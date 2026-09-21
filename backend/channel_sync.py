import xml.etree.ElementTree as ET
import urllib.request
import re
from typing import List, Dict, Optional

# Known channel UC IDs for instant zero-latency RSS syncing
KNOWN_CHANNEL_IDS = {
    "@hello_interview": "UC3kf-QFT6FZzDk9JsPg8Svg",
    "@bytebytego": "UCZgt6AzoyjslHTC9dz0UoTw",
    "@gkcs": "UCn1X3PYGeFi538KGURW10DA",
    "@hnasr": "UC_ML5xP23TOWKUcc-oAE_Eg",
    "@NeetCodeIO": "UC_mJaOflzssp0RR_w8kmG5Q",
    "@Jordanhasnolife": "UCmJz2DV1a3yfgrR7GqRtUUA",
    "@ArpitBhayani": "UCQ5_WnZtO_QO1wWjVd9Nfcw"
}

def resolve_channel_id(handle_or_url: str) -> Optional[str]:
    """Resolve a YouTube handle or URL to its canonical UC... channel ID."""
    handle = handle_or_url.strip()
    if not handle.startswith("@") and "youtube.com/@" in handle:
        handle = "@" + handle.split("youtube.com/@")[1].split("/")[0]

    if handle in KNOWN_CHANNEL_IDS:
        return KNOWN_CHANNEL_IDS[handle]

    # Try resolving via channel page
    url = f"https://www.youtube.com/{handle}" if handle.startswith("@") else handle
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=8) as res:
            html = res.read().decode("utf-8", errors="ignore")
            # match channelId
            m = re.search(r'"channelId":"(UC[a-zA-Z0-9_-]+)"', html)
            if m:
                return m.group(1)
            m = re.search(r'data-channel-id="(UC[a-zA-Z0-9_-]+)"', html)
            if m:
                return m.group(1)
    except Exception as e:
        print(f"Could not resolve channel ID for {handle_or_url}: {e}")
    return None

def fetch_recent_videos_from_rss(channel_yt_id: str) -> List[Dict]:
    """Fetch the latest videos from a channel's public RSS feed with fast timeout."""
    rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_yt_id}"
    videos = []
    try:
        req = urllib.request.Request(rss_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=3) as res:
            xml_content = res.read()
            root = ET.fromstring(xml_content)

            ns = {
                "atom": "http://www.w3.org/2005/Atom",
                "yt": "http://www.youtube.com/xml/schemas/2015",
                "media": "http://search.yahoo.com/mrss/"
            }

            for entry in root.findall("atom:entry", ns):
                vid_elem = entry.find("yt:videoId", ns)
                title_elem = entry.find("atom:title", ns)
                pub_elem = entry.find("atom:published", ns)
                media_group = entry.find("media:group", ns)
                desc_elem = media_group.find("media:description", ns) if media_group is not None else None

                if vid_elem is not None and title_elem is not None:
                    vid_id = vid_elem.text
                    title = title_elem.text
                    published = pub_elem.text if pub_elem is not None else ""
                    desc = desc_elem.text if desc_elem is not None else ""

                    videos.append({
                        "id": vid_id,
                        "title": title,
                        "published_at": published,
                        "description": desc,
                        "thumbnail_url": f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
                    })
    except Exception as e:
        print(f"Skipping RSS feed {channel_yt_id}: {e}")

    return videos
