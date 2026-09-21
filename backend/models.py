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
