from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, delete
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime

from database import get_db, init_db, async_session
from models import (
    Channel, Video, Transcript, VideoRelation, Note, DiagramSnapshot, VideoChapter,
    ArchitectureDiagram, Flashcard, MockInterviewSession
)
from channel_sync import resolve_channel_id, fetch_recent_videos_from_rss, KNOWN_CHANNEL_IDS
from transcript_parser import parse_raw_transcript, parse_raw_chapters
from search_service import search_transcripts_and_chapters
from export_service import generate_video_markdown, generate_full_obsidian_vault_zip, sanitize_filename
from diagram_presets import PALETTE_SNIPPETS, DEFAULT_SYSTEM_DIAGRAMS
from comparison_data import COMPARISON_TOPICS
from flashcard_data import SEED_FLASHCARDS
from spaced_repetition import calculate_sm2_review
from mock_interview_data import MOCK_INTERVIEW_PROMPTS

app = FastAPI(title="System Design Vault API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class ChannelOut(BaseModel):
    id: str
    name: str
    url: str
    avatar_url: Optional[str] = None
    channel_yt_id: Optional[str] = None

    class Config:
        from_attributes = True

class ChannelCreate(BaseModel):
    handle_or_url: str
    name: Optional[str] = None

class RelatedVideoOut(BaseModel):
    id: str
    channel_id: str
    channel_name: str
    title: str
    thumbnail_url: Optional[str] = None
    relation_type: str
    similarity_note: Optional[str] = None

class VideoListItem(BaseModel):
    id: str
    channel_id: str
    channel_name: str
    title: str
    category: str
    topic_slug: str
    thumbnail_url: Optional[str] = None
    status: str
    is_favorite: bool
    related_count: int
    has_transcript: bool = False
    segment_count: int = 0

    class Config:
        from_attributes = True

class VideoStatusUpdate(BaseModel):
    status: Optional[str] = None
    is_favorite: Optional[bool] = None

class TranscriptSegmentOut(BaseModel):
    id: int
    start_time: float
    duration: float
    text: str

    class Config:
        from_attributes = True

class TranscriptSegmentIn(BaseModel):
    start_time: float
    duration: float = 4.0
    text: str

class SaveTranscriptRequest(BaseModel):
    segments: List[TranscriptSegmentIn]
    mark_watched: bool = True

class NoteCreate(BaseModel):
    video_id: str
    timestamp_sec: Optional[float] = None
    title: str
    content: str

class NoteOut(BaseModel):
    id: int
    video_id: str
    timestamp_sec: Optional[float] = None
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class SnapshotCreate(BaseModel):
    video_id: str
    timestamp_sec: float
    caption: str
    image_url: Optional[str] = None
    notes: Optional[str] = None

class SnapshotOut(BaseModel):
    id: int
    video_id: str
    timestamp_sec: float
    caption: str
    image_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChapterOut(BaseModel):
    id: int
    start_time: float
    title: str

    class Config:
        from_attributes = True

class ImportTranscriptRequest(BaseModel):
    raw_text: str

class ImportChaptersRequest(BaseModel):
    raw_text: str

class VideoDetail(BaseModel):
    id: str
    channel_id: str
    channel: ChannelOut
    title: str
    description: Optional[str] = None
    category: str
    topic_slug: str
    thumbnail_url: Optional[str] = None
    published_at: Optional[str] = None
    duration_sec: Optional[int] = None
    status: str
    is_favorite: bool
    full_transcript: Optional[str] = None
    related_videos: List[RelatedVideoOut]
    chapters: List[ChapterOut] = []
    notes: List[NoteOut]
    snapshots: List[SnapshotOut]

    class Config:
        from_attributes = True

class SearchResultItem(BaseModel):
    video_id: str
    video_title: str
    channel_name: str
    topic_slug: str
    thumbnail_url: Optional[str] = None
    matched_timestamp: Optional[float] = None
    matched_snippet: str

class LLMContextOut(BaseModel):
    video_id: str
    title: str
    channel_name: str
    topic_slug: str
    prompt_context: str
    total_segments: int

class CompareRequest(BaseModel):
    video_ids: List[str]

class CompareResponse(BaseModel):
    videos: List[Dict]
    comparison_prompt: str

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "System Design Vault API"}

@app.get("/api/topics")
async def get_topics(db: AsyncSession = Depends(get_db)):
    query = select(Video.topic_slug, func.count(Video.id)).group_by(Video.topic_slug)
    res = await db.execute(query)
    return [{"topic_slug": row[0], "video_count": row[1]} for row in res.all()]

@app.get("/api/channels", response_model=List[ChannelOut])
async def get_channels(db: AsyncSession = Depends(get_db)):
    query = select(Channel).order_by(Channel.name)
    res = await db.execute(query)
    return res.scalars().all()

@app.post("/api/channels", response_model=ChannelOut)
async def add_channel(payload: ChannelCreate, db: AsyncSession = Depends(get_db)):
    raw = payload.handle_or_url.strip()
    handle = raw if raw.startswith("@") else ("@" + raw.split("/")[-1].replace("@", ""))
    yt_id = resolve_channel_id(raw)

    existing = await db.get(Channel, handle)
    if existing:
        return existing

    name = payload.name or handle.replace("@", "").capitalize()
    ch = Channel(
        id=handle,
        name=name,
        url=f"https://www.youtube.com/{handle}",
        avatar_url=f"https://unavatar.io/youtube/{handle.replace('@', '')}",
        channel_yt_id=yt_id
    )
    db.add(ch)
    await db.commit()
    await db.refresh(ch)
    return ch

@app.post("/api/sync")
async def sync_channel_feeds(db: AsyncSession = Depends(get_db)):
    channels = (await db.execute(select(Channel))).scalars().all()
    added_count = 0

    for ch in channels:
        yt_id = ch.channel_yt_id or KNOWN_CHANNEL_IDS.get(ch.id) or resolve_channel_id(ch.id)
        if not yt_id:
            continue

        if not ch.channel_yt_id:
            ch.channel_yt_id = yt_id
            await db.commit()

        recent = fetch_recent_videos_from_rss(yt_id)
        for rv in recent:
            existing = await db.get(Video, rv["id"])
            if not existing:
                topic = "system-design"
                t_lower = rv["title"].lower()
                if "chat" in t_lower or "whatsapp" in t_lower:
                    topic = "chat-system"
                elif "cache" in t_lower:
                    topic = "caching"
                elif "rate limit" in t_lower:
                    topic = "rate-limiter"
                elif "uber" in t_lower:
                    topic = "proximity-uber"

                new_v = Video(
                    id=rv["id"],
                    channel_id=ch.id,
                    title=rv["title"],
                    description=rv["description"],
                    published_at=rv["published_at"],
                    thumbnail_url=rv["thumbnail_url"],
                    category="Recent Upload",
                    topic_slug=topic,
                    status="inbox"
                )
                db.add(new_v)
                added_count += 1
        await db.commit()

    return {"status": "success", "new_videos_added": added_count}

@app.get("/api/videos", response_model=List[VideoListItem])
async def list_videos(
    category: Optional[str] = None,
    channel_id: Optional[str] = None,
    topic_slug: Optional[str] = None,
    status: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Video).join(Channel)

    if category:
        query = query.where(Video.category == category)
    if channel_id:
        query = query.where(Video.channel_id == channel_id)
    if topic_slug:
        query = query.where(Video.topic_slug == topic_slug)
    if status:
        query = query.where(Video.status == status)
    if is_favorite is not None:
        query = query.where(Video.is_favorite == is_favorite)

    res = await db.execute(query)
    videos = res.scalars().all()

    output = []
    for v in videos:
        rel_q = select(func.count(VideoRelation.id)).where(VideoRelation.source_video_id == v.id)
        rel_count = (await db.execute(rel_q)).scalar() or 0
        ch = await db.get(Channel, v.channel_id)

        t_q = select(func.count(Transcript.id)).where(Transcript.video_id == v.id)
        t_count = (await db.execute(t_q)).scalar() or 0

        output.append(VideoListItem(
            id=v.id,
            channel_id=v.channel_id,
            channel_name=ch.name if ch else v.channel_id,
            title=v.title,
            category=v.category,
            topic_slug=v.topic_slug,
            thumbnail_url=v.thumbnail_url,
            status=v.status,
            is_favorite=v.is_favorite,
            related_count=rel_count,
            has_transcript=t_count > 0,
            segment_count=t_count
        ))
    return output

@app.patch("/api/videos/{video_id}/status")
async def update_video_status(video_id: str, payload: VideoStatusUpdate, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if payload.status is not None:
        video.status = payload.status
        if payload.status == "watched":
            video.last_watched_at = datetime.utcnow()
    if payload.is_favorite is not None:
        video.is_favorite = payload.is_favorite

    await db.commit()
    await db.refresh(video)
    return {"id": video.id, "status": video.status, "is_favorite": video.is_favorite}

@app.get("/api/videos/{video_id}", response_model=VideoDetail)
async def get_video_detail(video_id: str, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    channel = await db.get(Channel, video.channel_id)

    rel_q = select(VideoRelation).where(VideoRelation.source_video_id == video_id)
    relations = (await db.execute(rel_q)).scalars().all()

    related_videos = []
    for r in relations:
        target_v = await db.get(Video, r.target_video_id)
        if target_v:
            target_ch = await db.get(Channel, target_v.channel_id)
            related_videos.append(RelatedVideoOut(
                id=target_v.id,
                channel_id=target_v.channel_id,
                channel_name=target_ch.name if target_ch else target_v.channel_id,
                title=target_v.title,
                thumbnail_url=target_v.thumbnail_url,
                relation_type=r.relation_type,
                similarity_note=r.similarity_note
            ))

    notes = (await db.execute(select(Note).where(Note.video_id == video_id).order_by(Note.created_at.desc()))).scalars().all()
    snapshots = (await db.execute(select(DiagramSnapshot).where(DiagramSnapshot.video_id == video_id).order_by(DiagramSnapshot.timestamp_sec))).scalars().all()
    chapters = (await db.execute(select(VideoChapter).where(VideoChapter.video_id == video_id).order_by(VideoChapter.start_time))).scalars().all()

    return VideoDetail(
        id=video.id,
        channel_id=video.channel_id,
        channel=ChannelOut.from_orm(channel) if channel else ChannelOut(id=video.channel_id, name=video.channel_id, url=""),
        title=video.title,
        description=video.description,
        category=video.category,
        topic_slug=video.topic_slug,
        thumbnail_url=video.thumbnail_url,
        published_at=video.published_at,
        duration_sec=video.duration_sec,
        status=video.status,
        is_favorite=video.is_favorite,
        full_transcript=video.full_transcript,
        related_videos=related_videos,
        chapters=[ChapterOut.from_orm(c) for c in chapters],
        notes=[NoteOut.from_orm(n) for n in notes],
        snapshots=[SnapshotOut.from_orm(s) for s in snapshots]
    )

@app.get("/api/videos/{video_id}/transcript", response_model=List[TranscriptSegmentOut])
async def get_transcript(video_id: str, db: AsyncSession = Depends(get_db)):
    q = select(Transcript).where(Transcript.video_id == video_id).order_by(Transcript.start_time)
    res = await db.execute(q)
    return res.scalars().all()

@app.post("/api/videos/{video_id}/import-transcript")
async def import_verbatim_transcript(video_id: str, payload: ImportTranscriptRequest, db: AsyncSession = Depends(get_db)):
    """Parse raw pasted YouTube verbatim transcripts or subtitle text and save into database."""
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    segments = parse_raw_transcript(payload.raw_text)
    if not segments:
        raise HTTPException(status_code=400, detail="Could not parse any transcript segments from provided text.")

    # Remove previous verbatim transcripts
    await db.execute(delete(Transcript).where(Transcript.video_id == video_id))

    for s in segments:
        db.add(Transcript(
            video_id=video_id,
            start_time=s["start_time"],
            duration=s["duration"],
            text=s["text"]
        ))

    video.full_transcript = " ".join([s["text"] for s in segments])
    video.status = "watched"
    video.last_watched_at = datetime.utcnow()
    await db.commit()

    return {
        "status": "success",
        "video_id": video_id,
        "segments_saved": len(segments),
        "total_words": len(video.full_transcript.split()),
        "first_start": segments[0]["start_time"],
        "last_start": segments[-1]["start_time"]
    }

@app.get("/api/videos/{video_id}/chapters", response_model=List[ChapterOut])
async def get_chapters(video_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve high-level milestone chapters for the video."""
    q = select(VideoChapter).where(VideoChapter.video_id == video_id).order_by(VideoChapter.start_time)
    res = await db.execute(q)
    return res.scalars().all()

@app.post("/api/videos/{video_id}/chapters")
async def import_chapters(video_id: str, payload: ImportChaptersRequest, db: AsyncSession = Depends(get_db)):
    """Import video chapter milestones typically copied from video descriptions."""
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    chaps = parse_raw_chapters(payload.raw_text)
    if not chaps:
        raise HTTPException(status_code=400, detail="No chapters detected. Please include timestamps like 00:00 Title.")

    await db.execute(delete(VideoChapter).where(VideoChapter.video_id == video_id))
    for c in chaps:
        db.add(VideoChapter(
            video_id=video_id,
            start_time=c["start_time"],
            title=c["title"]
        ))
    await db.commit()

    return {
        "status": "success",
        "video_id": video_id,
        "chapters_saved": len(chaps)
    }

@app.post("/api/videos/{video_id}/transcript")
async def save_recorded_transcript(video_id: str, payload: SaveTranscriptRequest, db: AsyncSession = Depends(get_db)):
    """Save live browser Web Speech recorded transcript segments into the database."""
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Clear old segments for this video
    await db.execute(delete(Transcript).where(Transcript.video_id == video_id))

    # Add new recorded segments
    full_text_parts = []
    for s in payload.segments:
        if s.text.strip():
            db.add(Transcript(
                video_id=video_id,
                start_time=s.start_time,
                duration=s.duration,
                text=s.text.strip()
            ))
            full_text_parts.append(s.text.strip())

    video.full_transcript = " ".join(full_text_parts)
    if payload.mark_watched:
        video.status = "watched"
        video.last_watched_at = datetime.utcnow()

    await db.commit()
    return {
        "status": "success",
        "video_id": video_id,
        "segments_saved": len(payload.segments),
        "total_words": len(video.full_transcript.split()) if video.full_transcript else 0
    }

@app.get("/api/videos/{video_id}/snapshots", response_model=List[SnapshotOut])
async def get_snapshots(video_id: str, db: AsyncSession = Depends(get_db)):
    q = select(DiagramSnapshot).where(DiagramSnapshot.video_id == video_id).order_by(DiagramSnapshot.timestamp_sec)
    res = await db.execute(q)
    return res.scalars().all()

@app.post("/api/videos/{video_id}/snapshots", response_model=SnapshotOut)
async def create_snapshot(video_id: str, payload: SnapshotCreate, db: AsyncSession = Depends(get_db)):
    img = payload.image_url or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    snapshot = DiagramSnapshot(
        video_id=video_id,
        timestamp_sec=payload.timestamp_sec,
        caption=payload.caption,
        image_url=img,
        notes=payload.notes
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot

@app.delete("/api/snapshots/{snapshot_id}")
async def delete_snapshot(snapshot_id: int, db: AsyncSession = Depends(get_db)):
    snap = await db.get(DiagramSnapshot, snapshot_id)
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    await db.delete(snap)
    await db.commit()
    return {"success": True}

@app.post("/api/compare-transcripts", response_model=CompareResponse)
async def compare_transcripts(payload: CompareRequest, db: AsyncSession = Depends(get_db)):
    if len(payload.video_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 video IDs to compare")

    video_entries = []
    prompt_sections = []

    for vid_id in payload.video_ids:
        video = await db.get(Video, vid_id)
        if not video:
            continue
        ch = await db.get(Channel, video.channel_id)
        segments = (await db.execute(select(Transcript).where(Transcript.video_id == vid_id).order_by(Transcript.start_time))).scalars().all()

        formatted_lines = [f"[{int(s.start_time//60):02d}:{int(s.start_time%60):02d}] {s.text}" for s in segments]
        video_entries.append({
            "id": video.id,
            "title": video.title,
            "channel": ch.name if ch else video.channel_id,
            "topic": video.topic_slug,
            "segment_count": len(segments)
        })

        prompt_sections.append(
            f"### VIDEO SOURCE: {video.title} (by {ch.name if ch else video.channel_id})\n"
            f"Topic: {video.topic_slug}\n"
            f"Transcript Summary:\n" + "\n".join(formatted_lines[:40]) + "\n"
        )

    llm_prompt = (
        "# MULTI-VIDEO SYSTEM DESIGN ARCHITECTURE COMPARISON\n\n"
        "You are a Principal Software Architect evaluating multiple senior engineering proposals.\n"
        "Analyze and compare the following architecture designs based on their transcripts:\n\n"
        + "\n---\n".join(prompt_sections) +
        "\n\n## EVALUATION TASKS:\n"
        "1. Compare the High-Level Architecture diagram and dataflow between both approaches.\n"
        "2. Identify conflicting choices (e.g. database type, caching strategy, communication protocol).\n"
        "3. Evaluate the scalability trade-offs (latency vs consistency, push vs pull fanout).\n"
        "4. Which approach is preferred for a FAANG Senior/Staff System Design interview, and why?"
    )

    return CompareResponse(
        videos=video_entries,
        comparison_prompt=llm_prompt
    )

@app.get("/api/videos/{video_id}/llm-context", response_model=LLMContextOut)
async def get_llm_context(video_id: str, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    ch = await db.get(Channel, video.channel_id)
    segments = (await db.execute(select(Transcript).where(Transcript.video_id == video_id).order_by(Transcript.start_time))).scalars().all()

    formatted_transcript = []
    for s in segments:
        m = int(s.start_time // 60)
        sec = int(s.start_time % 60)
        formatted_transcript.append(f"[{m:02d}:{sec:02d}] {s.text}")

    context_prompt = (
        f"# SYSTEM DESIGN ARCHITECTURE STUDY CONTEXT\n"
        f"Title: {video.title}\n"
        f"Channel: {ch.name if ch else video.channel_id}\n"
        f"Topic: {video.topic_slug}\n"
        f"Description: {video.description or 'N/A'}\n\n"
        f"## TIMECODED TRANSCRIPT CONTENT\n"
        + "\n".join(formatted_transcript)
    )

    return LLMContextOut(
        video_id=video.id,
        title=video.title,
        channel_name=ch.name if ch else video.channel_id,
        topic_slug=video.topic_slug,
        prompt_context=context_prompt,
        total_segments=len(segments)
    )

@app.post("/api/videos/{video_id}/summarize")
async def generate_summary(video_id: str, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    ch = await db.get(Channel, video.channel_id)

    summary = {
        "title": video.title,
        "topic": video.topic_slug.replace("-", " ").title(),
        "channel": ch.name if ch else video.channel_id,
        "functional_requirements": [
            f"Core workflow and lifecycle management for {video.topic_slug}",
            "High availability and low-latency response times under peak load",
            "Data consistency and idempotency during network partitions"
        ],
        "key_components": [
            {"name": "API Gateway / Reverse Proxy", "role": "Authentication, TLS termination, and rate limiting."},
            {"name": "In-Memory Cache (Redis)", "role": "Fast read caching and session/token state storage."},
            {"name": "Message Broker (Kafka / SQS)", "role": "Asynchronous event decoupling and traffic smoothing."},
            {"name": "Persistent Storage", "role": "Sharded database with read replicas and WAL replication."}
        ],
        "core_tradeoffs": [
            "Consistency vs Availability (CAP Theorem): Favoring eventual consistency for high throughput.",
            "Write-Through vs Cache-Aside: Minimizing cache stampedes while ensuring fresh reads.",
            "Push vs Pull Fanout: Hybrid model for regular users vs high-follower celebrity accounts."
        ]
    }
    return summary

@app.get("/api/search", response_model=List[SearchResultItem])
async def search_vault(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    term = f"%{q}%"
    results: List[SearchResultItem] = []

    v_query = select(Video).where(
        or_(Video.title.ilike(term), Video.description.ilike(term))
    )
    v_res = await db.execute(v_query)
    for v in v_res.scalars().all():
        ch = await db.get(Channel, v.channel_id)
        results.append(SearchResultItem(
            video_id=v.id,
            video_title=v.title,
            channel_name=ch.name if ch else v.channel_id,
            topic_slug=v.topic_slug,
            thumbnail_url=v.thumbnail_url,
            matched_timestamp=0.0,
            matched_snippet=v.title
        ))

    t_query = select(Transcript, Video).join(Video).where(Transcript.text.ilike(term)).limit(50)
    t_res = await db.execute(t_query)
    for t, v in t_res.all():
        ch = await db.get(Channel, v.channel_id)
        results.append(SearchResultItem(
            video_id=v.id,
            video_title=v.title,
            channel_name=ch.name if ch else v.channel_id,
            topic_slug=v.topic_slug,
            thumbnail_url=v.thumbnail_url,
            matched_timestamp=t.start_time,
            matched_snippet=t.text
        ))

    return results

@app.post("/api/notes", response_model=NoteOut)
async def create_note(payload: NoteCreate, db: AsyncSession = Depends(get_db)):
    note = Note(
        video_id=payload.video_id,
        timestamp_sec=payload.timestamp_sec,
        title=payload.title,
        content=payload.content
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: int, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.delete(note)
    await db.commit()
    return {"success": True}

# ---------------------------------------------------------------------------
# PHASE 1: GLOBAL TRANSCRIPT SEARCH & OBSIDIAN EXPORT ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/api/search/transcripts")
async def search_transcripts_global(
    q: str = Query(..., min_length=1),
    channel_id: Optional[str] = Query(None),
    limit: int = Query(40, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Global fast full-text search across all transcripts and milestone chapters."""
    return await search_transcripts_and_chapters(db, q, channel_id, limit)

@app.get("/api/export/markdown/{video_id}")
async def export_video_markdown(video_id: str, db: AsyncSession = Depends(get_db)):
    """Generate and download Obsidian/Notion-compatible Markdown note for a single video."""
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    ch = await db.get(Channel, video.channel_id)
    chapters = (await db.execute(select(VideoChapter).where(VideoChapter.video_id == video_id).order_by(VideoChapter.start_time))).scalars().all()
    transcripts = (await db.execute(select(Transcript).where(Transcript.video_id == video_id).order_by(Transcript.start_time))).scalars().all()
    notes = (await db.execute(select(Note).where(Note.video_id == video_id))).scalars().all()
    snapshots = (await db.execute(select(DiagramSnapshot).where(DiagramSnapshot.video_id == video_id))).scalars().all()

    rel_stmt = (
        select(VideoRelation, Video, Channel)
        .join(Video, VideoRelation.target_video_id == Video.id)
        .join(Channel, Video.channel_id == Channel.id)
        .where(VideoRelation.source_video_id == video_id)
    )
    rel_rows = (await db.execute(rel_stmt)).all()
    related = [{"id": vid.id, "title": vid.title, "channel_name": ch_rel.name, "similarity_note": vr.similarity_note} for vr, vid, ch_rel in rel_rows]

    md_content = generate_video_markdown(video, ch, chapters, transcripts, notes, snapshots, related)
    filename = f"{sanitize_filename(video.title[:60])}.md"

    return Response(
        content=md_content,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/export/obsidian-vault")
async def export_obsidian_vault(db: AsyncSession = Depends(get_db)):
    """Generate and stream a complete Zettelkasten Obsidian Vault zip archive."""
    zip_bytes = await generate_full_obsidian_vault_zip(db)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="SystemDesignVault_Obsidian.zip"'}
    )

# ---------------------------------------------------------------------------
# PHASE 2: ARCHITECTURE CANVAS & COMPARISON MATRIX ENDPOINTS
# ---------------------------------------------------------------------------

class DiagramSaveRequest(BaseModel):
    title: str
    mermaid_code: str
    diagram_type: Optional[str] = "flowchart"
    description: Optional[str] = None
    topic_slug: Optional[str] = None

@app.get("/api/diagrams/palette")
async def get_diagram_palette():
    """Retrieve pre-configured Mermaid architecture component templates."""
    return PALETTE_SNIPPETS

@app.get("/api/diagrams/{video_id}")
async def get_diagram_for_video(video_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch the saved diagram for a video, or fallback to default preset."""
    # Check if a custom saved diagram exists
    stmt = select(ArchitectureDiagram).where(ArchitectureDiagram.video_id == video_id).order_by(ArchitectureDiagram.updated_at.desc())
    res = await db.execute(stmt)
    diagram = res.scalars().first()

    if diagram:
        return {
            "id": diagram.id,
            "video_id": diagram.video_id,
            "topic_slug": diagram.topic_slug,
            "title": diagram.title,
            "mermaid_code": diagram.mermaid_code,
            "diagram_type": diagram.diagram_type,
            "is_custom": True,
            "updated_at": diagram.updated_at.isoformat() if diagram.updated_at else None
        }

    # If no custom diagram, check presets
    video = await db.get(Video, video_id)
    preset = None
    if video_id in DEFAULT_SYSTEM_DIAGRAMS:
        preset = DEFAULT_SYSTEM_DIAGRAMS[video_id]
    elif video and video.topic_slug in DEFAULT_SYSTEM_DIAGRAMS:
        preset = DEFAULT_SYSTEM_DIAGRAMS[video.topic_slug]
    else:
        # Default generic starter diagram
        title_display = video.title if video else "System Architecture"
        preset = {
            "title": f"Architecture: {title_display}",
            "topic_slug": video.topic_slug if video else "system-design",
            "diagram_type": "flowchart",
            "mermaid_code": f"""flowchart TD
    Client([Client App / Browser]) --> LB[Load Balancer]
    LB --> Gateway[API Gateway]
    Gateway --> AppService[Application Service]
    AppService --> Cache[(Redis Cache)]
    AppService --> PrimaryDB[(Primary Database)]
    PrimaryDB -.-> ReplicaDB[(Read Replica)]"""
        }

    return {
        "id": 0,
        "video_id": video_id,
        "topic_slug": preset.get("topic_slug", ""),
        "title": preset.get("title", "Architecture Diagram"),
        "mermaid_code": preset.get("mermaid_code", ""),
        "diagram_type": preset.get("diagram_type", "flowchart"),
        "is_custom": False,
        "updated_at": None
    }

@app.post("/api/diagrams/{video_id}")
async def save_diagram_for_video(video_id: str, req: DiagramSaveRequest, db: AsyncSession = Depends(get_db)):
    """Save or update the Mermaid diagram for a video."""
    stmt = select(ArchitectureDiagram).where(ArchitectureDiagram.video_id == video_id)
    res = await db.execute(stmt)
    diagram = res.scalars().first()

    if diagram:
        diagram.title = req.title
        diagram.mermaid_code = req.mermaid_code
        diagram.diagram_type = req.diagram_type or "flowchart"
        diagram.description = req.description
        diagram.topic_slug = req.topic_slug
        diagram.updated_at = datetime.utcnow()
    else:
        diagram = ArchitectureDiagram(
            video_id=video_id,
            topic_slug=req.topic_slug,
            title=req.title,
            mermaid_code=req.mermaid_code,
            diagram_type=req.diagram_type or "flowchart",
            description=req.description
        )
        db.add(diagram)

    await db.commit()
    await db.refresh(diagram)
    return {"success": True, "id": diagram.id, "title": diagram.title}

@app.get("/api/comparisons")
async def list_comparisons():
    """List available cross-channel multi-perspective comparison topics."""
    return [
        {
            "slug": t["slug"],
            "title": t["title"],
            "category": t["category"],
            "creators_count": len(t["creators"]),
            "key_challenges": t["key_challenges"]
        }
        for t in COMPARISON_TOPICS
    ]

@app.get("/api/comparisons/{slug}")
async def get_comparison_detail(slug: str):
    """Retrieve full deep comparison matrix for a specific problem."""
    for t in COMPARISON_TOPICS:
        if t["slug"] == slug:
            return t
    raise HTTPException(status_code=404, detail="Comparison topic not found")


# ---------------------------------------------------------------------------
# PHASE 3: SPACED REPETITION FLASHCARDS & MOCK INTERVIEW SIMULATOR ENDPOINTS
# ---------------------------------------------------------------------------

class FlashcardReviewRequest(BaseModel):
    quality: int  # 1: Again, 3: Hard, 4: Good, 5: Easy

class FlashcardCreateRequest(BaseModel):
    category: str
    front: str
    back: str
    explanation: Optional[str] = None
    topic_slug: Optional[str] = None
    video_id: Optional[str] = None

@app.get("/api/flashcards")
async def list_flashcards(due_only: bool = False, category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """List flashcards, optionally filtering by due status or category."""
    # If table is empty, auto-seed with standard high-yield questions
    count_stmt = select(func.count(Flashcard.id))
    total_count = (await db.execute(count_stmt)).scalar_one()
    if total_count == 0:
        for card_data in SEED_FLASHCARDS:
            card = Flashcard(
                category=card_data["category"],
                topic_slug=card_data["topic_slug"],
                front=card_data["front"],
                back=card_data["back"],
                explanation=card_data.get("explanation"),
                next_review_at=datetime.utcnow()
            )
            db.add(card)
        await db.commit()

    query = select(Flashcard)
    if due_only:
        query = query.where(Flashcard.next_review_at <= datetime.utcnow())
    if category:
        query = query.where(Flashcard.category == category)
    query = query.order_by(Flashcard.next_review_at.asc())

    cards = (await db.execute(query)).scalars().all()
    now = datetime.utcnow()

    return [
        {
            "id": c.id,
            "category": c.category,
            "topic_slug": c.topic_slug,
            "front": c.front,
            "back": c.back,
            "explanation": c.explanation,
            "repetition": c.repetition,
            "interval_days": c.interval_days,
            "ease_factor": c.ease_factor,
            "is_due": c.next_review_at <= now,
            "next_review_at": c.next_review_at.isoformat() if c.next_review_at else None
        }
        for c in cards
    ]

@app.post("/api/flashcards/{card_id}/review")
async def review_flashcard(card_id: int, req: FlashcardReviewRequest, db: AsyncSession = Depends(get_db)):
    """Apply SuperMemo-2 spaced repetition calculation on review response."""
    card = await db.get(Flashcard, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    new_rep, new_int, new_ef, next_rev = calculate_sm2_review(
        quality=req.quality,
        repetition=card.repetition or 0,
        interval_days=card.interval_days or 0.0,
        ease_factor=card.ease_factor or 2.5
    )

    card.repetition = new_rep
    card.interval_days = new_int
    card.ease_factor = new_ef
    card.next_review_at = next_rev
    card.last_reviewed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(card)

    return {
        "id": card.id,
        "repetition": card.repetition,
        "interval_days": card.interval_days,
        "ease_factor": card.ease_factor,
        "next_review_at": card.next_review_at.isoformat()
    }

@app.post("/api/flashcards")
async def create_flashcard(req: FlashcardCreateRequest, db: AsyncSession = Depends(get_db)):
    """Create a new custom user flashcard."""
    card = Flashcard(
        category=req.category,
        front=req.front,
        back=req.back,
        explanation=req.explanation,
        topic_slug=req.topic_slug or "general",
        video_id=req.video_id,
        next_review_at=datetime.utcnow()
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return {"success": True, "id": card.id}

@app.get("/api/mock-interview/prompts")
async def get_mock_interview_prompts():
    """Get structured 45-minute mock interview prompts with 5-phase guidelines and rubrics."""
    return MOCK_INTERVIEW_PROMPTS

class MockSessionSaveRequest(BaseModel):
    topic_slug: str
    title: str
    current_phase: Optional[str] = "requirements"
    notes: Optional[str] = None
    capacity_math: Optional[str] = None
    architecture_mermaid: Optional[str] = None
    rubric_scores: Optional[str] = None
    status: Optional[str] = "in_progress"

@app.post("/api/mock-interview/sessions")
async def save_mock_interview_session(req: MockSessionSaveRequest, db: AsyncSession = Depends(get_db)):
    """Save or log a mock interview rehearsal attempt."""
    session = MockInterviewSession(
        topic_slug=req.topic_slug,
        title=req.title,
        current_phase=req.current_phase or "requirements",
        notes=req.notes,
        capacity_math=req.capacity_math,
        architecture_mermaid=req.architecture_mermaid,
        rubric_scores=req.rubric_scores,
        status=req.status or "completed",
        completed_at=datetime.utcnow() if req.status == "completed" else None
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {"success": True, "id": session.id}

@app.get("/api/mock-interview/sessions")
async def list_mock_interview_sessions(db: AsyncSession = Depends(get_db)):
    """List completed and in-progress mock interview rehearsals."""
    stmt = select(MockInterviewSession).order_by(MockInterviewSession.started_at.desc())
    res = await db.execute(stmt)
    sessions = res.scalars().all()
    return [
        {
            "id": s.id,
            "topic_slug": s.topic_slug,
            "title": s.title,
            "duration_minutes": s.duration_minutes,
            "current_phase": s.current_phase,
            "status": s.status,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None
        }
        for s in sessions
    ]


