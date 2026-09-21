import re
from typing import List, Dict, Any, Optional
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from models import Transcript, VideoChapter, Video, Channel

def format_timestamp(seconds: float) -> str:
    s = int(seconds)
    m = s // 60
    sec = s % 60
    if m >= 60:
        h = m // 60
        m = m % 60
        return f"{h:02d}:{m:02d}:{sec:02d}"
    return f"{m:02d}:{sec:02d}"

def highlight_snippet(text: str, query: str, max_chars: int = 140) -> str:
    words = [re.escape(w) for w in query.split() if len(w) > 1]
    if not words:
        return text[:max_chars] + ("..." if len(text) > max_chars else "")

    pattern = re.compile(f"({'|'.join(words)})", re.IGNORECASE)
    match = pattern.search(text)
    if not match:
        return text[:max_chars] + ("..." if len(text) > max_chars else "")

    start = max(0, match.start() - 40)
    end = min(len(text), match.end() + 70)
    snippet = text[start:end]
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."

    # Highlight matches with <mark> tags
    highlighted = pattern.sub(r"<mark class='bg-amber-300 dark:bg-amber-500/40 text-slate-950 dark:text-amber-200 font-bold px-1 rounded'>\1</mark>", snippet)
    return highlighted

async def search_transcripts_and_chapters(
    session: AsyncSession,
    query: str,
    channel_id: Optional[str] = None,
    limit: int = 40
) -> Dict[str, Any]:
    query_clean = query.strip()
    if not query_clean:
        return {"query": "", "total_matches": 0, "results": []}

    search_terms = [t for t in query_clean.split() if len(t) > 1]
    if not search_terms:
        search_terms = [query_clean]

    # 1. Search Verbatim Transcripts
    t_conditions = [Transcript.text.ilike(f"%{term}%") for term in search_terms]
    t_stmt = (
        select(Transcript, Video, Channel)
        .join(Video, Transcript.video_id == Video.id)
        .join(Channel, Video.channel_id == Channel.id)
        .where(or_(*t_conditions))
    )
    if channel_id and channel_id != "ALL":
        t_stmt = t_stmt.where(Video.channel_id == channel_id)
    t_stmt = t_stmt.limit(limit)

    t_res = await session.execute(t_stmt)
    transcript_matches = t_res.all()

    # 2. Search Chapters / Roadmaps
    c_conditions = [VideoChapter.title.ilike(f"%{term}%") for term in search_terms]
    c_stmt = (
        select(VideoChapter, Video, Channel)
        .join(Video, VideoChapter.video_id == Video.id)
        .join(Channel, Video.channel_id == Channel.id)
        .where(or_(*c_conditions))
    )
    if channel_id and channel_id != "ALL":
        c_stmt = c_stmt.where(Video.channel_id == channel_id)
    c_stmt = c_stmt.limit(limit)

    c_res = await session.execute(c_stmt)
    chapter_matches = c_res.all()

    results = []

    # Format chapter matches first (high relevance)
    for chap, vid, ch in chapter_matches:
        results.append({
            "video_id": vid.id,
            "video_title": vid.title,
            "channel_name": ch.name,
            "channel_id": ch.id,
            "timestamp_sec": chap.start_time,
            "timestamp_label": format_timestamp(chap.start_time),
            "snippet": highlight_snippet(chap.title, query_clean),
            "source_type": "chapter_milestone",
            "topic_slug": vid.topic_slug
        })

    # Format transcript matches
    for trans, vid, ch in transcript_matches:
        results.append({
            "video_id": vid.id,
            "video_title": vid.title,
            "channel_name": ch.name,
            "channel_id": ch.id,
            "timestamp_sec": trans.start_time,
            "timestamp_label": format_timestamp(trans.start_time),
            "snippet": highlight_snippet(trans.text, query_clean),
            "source_type": "verbatim_transcript",
            "topic_slug": vid.topic_slug
        })

    return {
        "query": query_clean,
        "total_matches": len(results),
        "results": results[:limit]
    }
