import io
import zipfile
import re
from datetime import datetime
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import Video, Channel, Transcript, VideoChapter, Note, DiagramSnapshot, VideoRelation

def sanitize_filename(name: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "", name).replace(" ", "_")

def format_timestamp(seconds: float) -> str:
    s = int(seconds)
    m = s // 60
    sec = s % 60
    if m >= 60:
        h = m // 60
        m = m % 60
        return f"{h:02d}:{m:02d}:{sec:02d}"
    return f"{m:02d}:{sec:02d}"

def generate_video_markdown(
    video: Video,
    channel: Channel,
    chapters: List[VideoChapter],
    transcripts: List[Transcript],
    notes: List[Note],
    snapshots: List[DiagramSnapshot],
    related: List[dict]
) -> str:
    lines = []
    
    # YAML Frontmatter
    lines.append("---")
    lines.append(f"id: \"{video.id}\"")
    lines.append(f"title: \"{video.title.replace('\"', '')}\"")
    lines.append(f"channel: \"{channel.name if channel else video.channel_id}\"")
    lines.append(f"category: \"{video.category}\"")
    lines.append(f"topic_slug: \"{video.topic_slug}\"")
    lines.append(f"status: \"{video.status}\"")
    lines.append(f"is_favorite: {str(video.is_favorite).lower()}")
    lines.append(f"date_exported: \"{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}\"")
    lines.append(f"tags: [system-design, {video.topic_slug}, \"{channel.name.lower().replace(' ', '-') if channel else 'creator'}\"]")
    lines.append("---")
    lines.append("")

    # Title & Metadata Callout
    lines.append(f"# {video.title}")
    lines.append("")
    lines.append("> [!info] Video Reference")
    lines.append(f"> - **Creator:** [[{channel.name if channel else video.channel_id}]]")
    lines.append(f"> - **YouTube Link:** [Watch on YouTube](https://www.youtube.com/watch?v={video.id})")
    lines.append(f"> - **Topic:** `{video.topic_slug}` | **Category:** `{video.category}`")
    lines.append(f"> - **Study Status:** `{video.status.upper()}`")
    lines.append("")

    # Chapters / Roadmap Section
    if chapters:
        lines.append("## 📌 Milestone Roadmap & Chapters")
        for c in chapters:
            t_label = format_timestamp(c.start_time)
            yt_time_url = f"https://www.youtube.com/watch?v={video.id}&t={int(c.start_time)}s"
            lines.append(f"- **[{t_label}]({yt_time_url})** — {c.title}")
        lines.append("")

    # Architecture Diagrams / Snapshots
    if snapshots:
        lines.append("## 📸 Whiteboard Architecture Snapshots")
        for s in snapshots:
            t_label = format_timestamp(s.timestamp_sec)
            yt_time_url = f"https://www.youtube.com/watch?v={video.id}&t={int(s.timestamp_sec)}s"
            lines.append(f"### [{t_label}]({yt_time_url}) — {s.caption}")
            if s.notes:
                lines.append(f"> {s.notes}")
            if s.image_url:
                lines.append(f"![{s.caption}]({s.image_url})")
            lines.append("")

    # Personal Study Notes
    if notes:
        lines.append("## 💡 Study Notes & Architecture Takeaways")
        for n in notes:
            lines.append(f"### {n.title}")
            lines.append(f"{n.content}")
            lines.append("")

    # Related Videos & Cross-Channel Alternatives
    if related:
        lines.append("## 🔗 Cross-Channel Alternative Solutions")
        for r in related:
            lines.append(f"- **[[{r['channel_name']}]]** — [{r['title']}](https://www.youtube.com/watch?v={r['id']})")
            if r.get('similarity_note'):
                lines.append(f"  > {r['similarity_note']}")
        lines.append("")

    # Verbatim Spoken Transcript Appendix
    if transcripts:
        lines.append("## 📜 Verbatim Transcript Appendix")
        lines.append("> [!note] Continuous Transcript Record")
        for t in transcripts:
            t_label = format_timestamp(t.start_time)
            lines.append(f"- `[{t_label}]` {t.text}")
        lines.append("")

    return "\n".join(lines)

async def generate_full_obsidian_vault_zip(session: AsyncSession) -> bytes:
    zip_buffer = io.BytesIO()

    # Query all videos
    videos = (await session.execute(select(Video))).scalars().all()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        index_lines = [
            "# System Design Vault — Master Knowledge Index",
            "",
            "Welcome to your offline **System Design Engineering Vault**.",
            "",
            "## 📚 Problem Walkthroughs",
            ""
        ]

        for v in videos:
            ch = await session.get(Channel, v.channel_id)
            chapters = (await session.execute(select(VideoChapter).where(VideoChapter.video_id == v.id).order_by(VideoChapter.start_time))).scalars().all()
            transcripts = (await session.execute(select(Transcript).where(Transcript.video_id == v.id).order_by(Transcript.start_time))).scalars().all()
            notes = (await session.execute(select(Note).where(Note.video_id == v.id))).scalars().all()
            snapshots = (await session.execute(select(DiagramSnapshot).where(DiagramSnapshot.video_id == v.id))).scalars().all()

            rel_stmt = (
                select(VideoRelation, Video, Channel)
                .join(Video, VideoRelation.target_video_id == Video.id)
                .join(Channel, Video.channel_id == Channel.id)
                .where(VideoRelation.source_video_id == v.id)
            )
            rel_rows = (await session.execute(rel_stmt)).all()
            related = [{"id": vid.id, "title": vid.title, "channel_name": ch_rel.name, "similarity_note": vr.similarity_note} for vr, vid, ch_rel in rel_rows]

            md_content = generate_video_markdown(v, ch, chapters, transcripts, notes, snapshots, related)
            file_name = f"Problems/{sanitize_filename(v.title[:70])}.md"
            zip_file.writestr(file_name, md_content)

            index_lines.append(f"- **[[{sanitize_filename(v.title[:70])}|{v.title}]]** (`{v.topic_slug}`) by *{ch.name if ch else v.channel_id}* — `{v.status.upper()}`")

        # Add index file
        zip_file.writestr("Index.md", "\n".join(index_lines))

    zip_buffer.seek(0)
    return zip_buffer.getvalue()
