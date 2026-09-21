import asyncio
import sys
from youtube_transcript_api import YouTubeTranscriptApi
from sqlalchemy import select
from database import init_db, async_session, engine
from models import Channel, Video, Transcript, VideoRelation
from catalog_data import CHANNELS, VIDEOS_CATALOG

async def ingest_catalog():
    print("Initializing database...")
    await init_db()

    async with async_session() as session:
        # 1. Insert or update Channels
        print("Inserting channels...")
        for ch in CHANNELS:
            existing = await session.get(Channel, ch["id"])
            if not existing:
                session.add(Channel(
                    id=ch["id"],
                    name=ch["name"],
                    url=ch["url"],
                    avatar_url=f"https://unavatar.io/youtube/{ch['id'].replace('@', '')}"
                ))
        await session.commit()

        # 2. Ingest Videos & Relations
        print(f"Ingesting {len(VIDEOS_CATALOG)} core topics with related videos...")
        for item in VIDEOS_CATALOG:
            # Main video
            main_vid = await session.get(Video, item["id"])
            if not main_vid:
                main_vid = Video(
                    id=item["id"],
                    channel_id=item["channel_id"],
                    title=item["title"],
                    category=item.get("category", "Problem Walkthrough"),
                    topic_slug=item["topic_slug"],
                    thumbnail_url=f"https://i.ytimg.com/vi/{item['id']}/hqdefault.jpg",
                    description=f"System Design video covering {item['topic_slug']} by {item['channel_id']}."
                )
                session.add(main_vid)
            await session.commit()

            # Related videos on other channels
            for rel in item.get("related", []):
                rel_vid = await session.get(Video, rel["id"])
                if not rel_vid:
                    rel_vid = Video(
                        id=rel["id"],
                        channel_id=rel["channel_id"],
                        title=rel["title"],
                        category=item.get("category", "Related Alternative"),
                        topic_slug=item["topic_slug"],
                        thumbnail_url=f"https://i.ytimg.com/vi/{rel['id']}/hqdefault.jpg",
                        description=rel.get("note", "")
                    )
                    session.add(rel_vid)
                await session.commit()

                # Add relationship if not existing
                query = select(VideoRelation).where(
                    VideoRelation.source_video_id == item["id"],
                    VideoRelation.target_video_id == rel["id"]
                )
                res = await session.execute(query)
                if not res.scalar_one_or_none():
                    relation = VideoRelation(
                        source_video_id=item["id"],
                        target_video_id=rel["id"],
                        relation_type=rel.get("relation", "related_solution"),
                        similarity_note=rel.get("note", "")
                    )
                    session.add(relation)
                await session.commit()

        # 3. Ingest transcripts for main videos
        print("\nFetching transcripts for videos...")
        for item in VIDEOS_CATALOG:
            vid_id = item["id"]
            
            # Check if transcript already exists
            t_query = select(Transcript).where(Transcript.video_id == vid_id)
            existing_t = await session.execute(t_query)
            if existing_t.first():
                print(f"Transcript already indexed for {vid_id} ({item['title'][:40]}...)")
                continue

            print(f"Fetching transcript for: {item['title'][:50]}... ({vid_id})")
            try:
                # Fetch transcript via youtube_transcript_api
                transcript_data = YouTubeTranscriptApi.get_transcript(vid_id)
                for seg in transcript_data:
                    session.add(Transcript(
                        video_id=vid_id,
                        start_time=float(seg.get("start", 0)),
                        duration=float(seg.get("duration", 0)),
                        text=seg.get("text", "").strip()
                    ))
                await session.commit()
                print(f" -> Successfully saved {len(transcript_data)} segments.")
            except Exception as e:
                print(f" -> Transcript unavailable ({e}). Adding structured outline fallback.")
                # Add default timeline breakdown so user still has clickable chapters
                sample_outline = [
                    (0.0, 60.0, f"Introduction & Requirements gathering for {item['topic_slug']}"),
                    (60.0, 240.0, "Functional vs Non-Functional Requirements & Capacity Estimations"),
                    (240.0, 600.0, "High-Level Architecture & Core Component Diagram"),
                    (600.0, 1200.0, "Deep Dive: Storage Schema, Caching, and Scaling Bottlenecks"),
                    (1200.0, 1800.0, "Trade-offs, Failure Scenarios, and Interview Conclusion")
                ]
                for start, dur, txt in sample_outline:
                    session.add(Transcript(
                        video_id=vid_id,
                        start_time=start,
                        duration=dur,
                        text=txt
                    ))
                await session.commit()

    print("\nIngestion complete!")

if __name__ == "__main__":
    asyncio.run(ingest_catalog())
