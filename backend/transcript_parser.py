import re
from typing import List, Dict, Any

def parse_time_str(time_str: str) -> float:
    """Converts 01:23, 1:23:45, 01:23.456, or 01:23,456 into total seconds as float."""
    time_str = time_str.strip().replace(",", ".")
    parts = time_str.split(":")
    try:
        if len(parts) == 3:
            h, m, s = parts
            return int(h) * 3600 + int(m) * 60 + float(s)
        elif len(parts) == 2:
            m, s = parts
            return int(m) * 60 + float(s)
        elif len(parts) == 1:
            return float(parts[0])
    except Exception:
        return 0.0
    return 0.0

def parse_raw_transcript(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parses verbatim transcripts copied from YouTube or subtitle files.
    Handles:
    1. YouTube 'Show Transcript' format (alternating or inline timestamp):
       0:00
       Welcome to this video
       0:05
       Today we talk about scaling
    2. SRT format:
       1
       00:00:01,000 --> 00:00:04,000
       Welcome to this video
    3. VTT format:
       00:01.000 --> 00:04.000
       Welcome to this video
    4. Inline timestamps:
       [01:25] Welcome to this video
    5. Plain paragraphs (fallback).
    """
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    segments = []

    # 1. Check for SRT/VTT arrow syntax
    is_srt_or_vtt = any("-->" in l for l in lines[:15])
    if is_srt_or_vtt:
        current_time = None
        current_text = []
        for line in lines:
            if "-->" in line:
                if current_time is not None and current_text:
                    segments.append({
                        "start_time": current_time,
                        "duration": 4.0,
                        "text": " ".join(current_text)
                    })
                    current_text = []
                start_part = line.split("-->")[0].strip()
                current_time = parse_time_str(start_part)
            elif re.match(r"^\d+$", line):
                # SRT subtitle index number, skip
                continue
            elif current_time is not None:
                current_text.append(line)

        if current_time is not None and current_text:
            segments.append({
                "start_time": current_time,
                "duration": 4.0,
                "text": " ".join(current_text)
            })
        if segments:
            return segments

    # 2. Check for YouTube Transcript format
    # Regex matching timestamp alone or with text: 0:00 or 00:00 or [0:00]
    time_alone_pattern = re.compile(r"^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?$")
    time_inline_pattern = re.compile(r"^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+(.+)$")

    pending_time = None
    pending_text = []

    for line in lines:
        alone_match = time_alone_pattern.match(line)
        if alone_match:
            if pending_time is not None and pending_text:
                segments.append({
                    "start_time": pending_time,
                    "duration": 4.0,
                    "text": " ".join(pending_text)
                })
                pending_text = []
            pending_time = parse_time_str(alone_match.group(1))
            continue

        inline_match = time_inline_pattern.match(line)
        if inline_match:
            if pending_time is not None and pending_text:
                segments.append({
                    "start_time": pending_time,
                    "duration": 4.0,
                    "text": " ".join(pending_text)
                })
                pending_text = []
            pending_time = parse_time_str(inline_match.group(1))
            pending_text.append(inline_match.group(2).strip())
            continue

        if pending_time is not None:
            pending_text.append(line)
        else:
            # text before any timestamp
            pending_text.append(line)

    if pending_time is not None and pending_text:
        segments.append({
            "start_time": pending_time,
            "duration": 4.0,
            "text": " ".join(pending_text)
        })

    # If successful, calculate realistic durations based on consecutive timestamps
    if len(segments) > 1:
        for i in range(len(segments) - 1):
            diff = segments[i + 1]["start_time"] - segments[i]["start_time"]
            segments[i]["duration"] = max(1.0, min(diff, 30.0))
        segments[-1]["duration"] = 5.0
        return segments

    # Fallback: Plain text chunks
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = lines

    sec = 0.0
    for p in paragraphs:
        clean = " ".join(p.split())
        if clean:
            segments.append({
                "start_time": sec,
                "duration": 15.0,
                "text": clean
            })
            sec += 15.0

    return segments

def parse_raw_chapters(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parses chapters or timestamps typically found in video descriptions, e.g.:
    0:00 Introduction
    2:15 Requirements & Math
    08:30 High-Level Diagram
    """
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    chapters = []
    chapter_pattern = re.compile(r"^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:[-–:]\s*)?(.+)$")

    for line in lines:
        match = chapter_pattern.match(line)
        if match:
            time_str = match.group(1)
            title_str = match.group(2).strip()
            chapters.append({
                "start_time": parse_time_str(time_str),
                "title": title_str
            })

    # Sort chapters chronologically
    chapters.sort(key=lambda c: c["start_time"])
    return chapters
