from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Channel(Base):
    __tablename__ = "channels"

    id = Column(String(100), primary_key=True)  # e.g., "@hello_interview"
    name = Column(String(200), nullable=False)
    url = Column(String(300), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    channel_yt_id = Column(String(100), nullable=True)

    videos = relationship("Video", back_populates="channel", cascade="all, delete-orphan")


class Video(Base):
    __tablename__ = "videos"

    id = Column(String(50), primary_key=True)  # YouTube Video ID
    channel_id = Column(String(100), ForeignKey("channels.id"), nullable=False)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    published_at = Column(String(50), nullable=True)
    duration_sec = Column(Integer, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    category = Column(String(100), nullable=False, default="System Design", index=True)
    topic_slug = Column(String(100), nullable=False, index=True)

    # Library / Watch Status
    status = Column(String(50), nullable=False, default="inbox", index=True)  # "inbox", "watch_later", "watched"
    is_favorite = Column(Boolean, nullable=False, default=False, index=True)
    last_watched_at = Column(DateTime, nullable=True)

    # Full Aggregated Transcript for LLMs
    full_transcript = Column(Text, nullable=True)

    channel = relationship("Channel", back_populates="videos")
    transcripts = relationship("Transcript", back_populates="video", cascade="all, delete-orphan", order_by="Transcript.start_time")
    chapters = relationship("VideoChapter", back_populates="video", cascade="all, delete-orphan", order_by="VideoChapter.start_time")
    notes = relationship("Note", back_populates="video", cascade="all, delete-orphan")
    snapshots = relationship("DiagramSnapshot", back_populates="video", cascade="all, delete-orphan", order_by="DiagramSnapshot.timestamp_sec")

    # Relations
    outgoing_relations = relationship(
        "VideoRelation",
        foreign_keys="VideoRelation.source_video_id",
        back_populates="source_video",
        cascade="all, delete-orphan"
    )


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=False, index=True)
    start_time = Column(Float, nullable=False)  # in seconds
    duration = Column(Float, nullable=False)    # in seconds
    text = Column(Text, nullable=False)

    video = relationship("Video", back_populates="transcripts")


class VideoRelation(Base):
    __tablename__ = "video_relations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_video_id = Column(String(50), ForeignKey("videos.id"), nullable=False, index=True)
    target_video_id = Column(String(50), ForeignKey("videos.id"), nullable=False, index=True)
    relation_type = Column(String(100), nullable=False, default="related_solution")
    similarity_note = Column(Text, nullable=True)

    source_video = relationship("Video", foreign_keys=[source_video_id], back_populates="outgoing_relations")
    target_video = relationship("Video", foreign_keys=[target_video_id])


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=False, index=True)
    timestamp_sec = Column(Float, nullable=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="notes")


class DiagramSnapshot(Base):
    __tablename__ = "diagram_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=False, index=True)
    timestamp_sec = Column(Float, nullable=False)
    caption = Column(String(300), nullable=False)
    image_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="snapshots")
 

class VideoChapter(Base):
    __tablename__ = "video_chapters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=False, index=True)
    start_time = Column(Float, nullable=False)
    title = Column(String(300), nullable=False)

    video = relationship("Video", back_populates="chapters")


class ArchitectureDiagram(Base):
    __tablename__ = "architecture_diagrams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=True, index=True)
    topic_slug = Column(String(100), nullable=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    mermaid_code = Column(Text, nullable=False)
    diagram_type = Column(String(50), default="flowchart")  # flowchart, sequence, state, class
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    video = relationship("Video", backref="diagrams")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(String(50), ForeignKey("videos.id"), nullable=True, index=True)
    topic_slug = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=False, default="System Design", index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    
    # SM-2 Spaced Repetition fields
    repetition = Column(Integer, default=0)
    interval_days = Column(Float, default=0.0)
    ease_factor = Column(Float, default=2.5)
    next_review_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MockInterviewSession(Base):
    __tablename__ = "mock_interview_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_slug = Column(String(100), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    duration_minutes = Column(Integer, default=45)
    current_phase = Column(String(50), default="requirements")
    notes = Column(Text, nullable=True)
    capacity_math = Column(Text, nullable=True)
    architecture_mermaid = Column(Text, nullable=True)
    rubric_scores = Column(Text, nullable=True)  # JSON string
    status = Column(String(50), default="in_progress")  # in_progress, completed, abandoned
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

