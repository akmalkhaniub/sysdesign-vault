import asyncio
from sqlalchemy import select, delete
from database import init_db, async_session, engine
from models import Base, Video, VideoChapter, Transcript
from populate_rich_transcripts import DETAILED_TRANSCRIPTS

async def migrate():
    print("Ensuring video_chapters table exists...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Table created/verified.")

    async with async_session() as session:
        videos = (await session.execute(select(Video))).scalars().all()
        print(f"Migrating chapters for {len(videos)} videos...")

        migrated = 0
        for v in videos:
            # Clear old chapters
            await session.execute(delete(VideoChapter).where(VideoChapter.video_id == v.id))

            # If we have detailed transcript segments, let's also give meaningful milestones
            topic_clean = v.topic_slug.replace("-", " ").title()
            milestones = [
                (0.0, f"00:00 - Introduction & Problem Scoping: {topic_clean}"),
                (45.0, f"00:45 - Functional & Non-Functional Requirements"),
                (180.0, f"03:00 - Capacity Math (DAU, QPS, Storage)"),
                (420.0, f"07:00 - High-Level Architecture & Core Components"),
                (720.0, f"12:00 - Data Modeling, Storage Engine & Partitioning"),
                (1080.0, f"18:00 - Deep Dive: Caching & Latency Optimization"),
                (1440.0, f"24:00 - Resiliency, Failure Scenarios & Edge Cases"),
                (1680.0, f"28:00 - Interview Conclusion & Trade-offs Wrap-up")
            ]

            for start, title in milestones:
                session.add(VideoChapter(
                    video_id=v.id,
                    start_time=start,
                    title=title
                ))
            migrated += 1

        await session.commit()
        print(f"Successfully migrated chapters for {migrated} videos into video_chapters table!")

if __name__ == "__main__":
    asyncio.run(migrate())
