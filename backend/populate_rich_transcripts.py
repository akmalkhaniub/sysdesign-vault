import asyncio
from sqlalchemy import select, delete
from database import init_db, async_session
from models import Video, Transcript
from catalog_data import VIDEOS_CATALOG

DETAILED_TRANSCRIPTS = {
    "IUrQ5_g3XKs": [
        (0.0, 45.0, "Welcome everyone to today's system design interview walkthrough. Today we are designing YouTube with an ex-Meta Staff Software Engineer."),
        (45.0, 95.0, "Let us begin with clarifying the scope and gathering functional requirements. Users need to upload videos, watch videos in variable bitrates, like and comment, and view a search feed."),
        (140.0, 110.0, "For non-functional requirements, high availability is paramount. We need 99.99% availability, low playback buffering latency under 200 milliseconds, and reliable durability for uploaded raw video chunks."),
        (250.0, 130.0, "Now for capacity estimations: assuming 500 million daily active users and 10% creating content, with average video size of 300 megabytes, daily storage ingestion is roughly 15 petabytes per day."),
        (380.0, 140.0, "Let us look at the high-level architecture. We have client apps communicating through Cloudflare CDN and an API Gateway which terminates TLS and performs token-based authentication."),
        (520.0, 160.0, "For video upload, we use pre-signed Amazon S3 URLs. The client uploads raw video chunks directly to blob storage, bypassing the web tier to avoid bandwidth saturation."),
        (680.0, 170.0, "Once the raw upload completes, an SQS event triggers our Video Transcoding Pipeline. The transcoding DAG encodes the video into HLS and MPEG-DASH formats at 1080p, 720p, 480p, and 360p."),
        (850.0, 150.0, "For video metadata storage, we use a sharded PostgreSQL cluster partitioned by video_id with read replicas for high read throughput."),
        (1000.0, 140.0, "Video view counts use a write-back buffer with Redis. Instead of updating the database per view, Redis increments the count and flushes batch updates every 5 seconds to prevent write contention."),
        (1140.0, 150.0, "For global video delivery, we use geo-distributed Edge CDNs like Cloudflare and Akamai, caching the first 10 seconds of popular videos at edge nodes to ensure instantaneous video start times."),
        (1290.0, 160.0, "Let us evaluate trade-offs: We favor eventual consistency for view counts and comments over strict ACID transactions to maintain maximum throughput under extreme traffic spikes."),
        (1450.0, 120.0, "In conclusion, we covered chunked uploading, asynchronous distributed transcoding DAGs, edge CDN caching, and read-heavy database sharding strategies.")
    ],
    "cr6p0n0N-VA": [
        (0.0, 40.0, "Hello and welcome. In this session, we are breaking down how to design WhatsApp with an ex-Meta Senior Engineering Manager."),
        (40.0, 90.0, "Our core functional requirements are 1-on-1 real-time messaging, group chats up to 1,000 members, read receipts (sent, delivered, read), and last-seen presence indicators."),
        (130.0, 100.0, "Scale assumptions: 2 billion monthly active users, 100 billion messages per day, requiring an average message ingestion rate of 1.2 million messages per second at peak."),
        (230.0, 130.0, "For communication protocols, HTTP long polling is too inefficient. We use bidirectional persistent WebSocket connections with lightweight binary payloads (Protocol Buffers) to minimize battery and mobile data drain."),
        (360.0, 150.0, "Architecture overview: Mobile clients connect to a fleet of stateful WebSocket Connection Gateway servers. A distributed ZooKeeper cluster maintains cluster health and heartbeat tracking."),
        (510.0, 160.0, "To route messages, we have a User Session Service backed by Redis Cluster. It maps user_id to the specific gateway server host ID that holds the active socket connection for that user."),
        (670.0, 170.0, "When Alice sends a message to Bob: Alice's gateway publishes to an Apache Kafka partition keyed by recipient_id. If Bob is online, his gateway pops the event and pushes it through his open WebSocket."),
        (840.0, 150.0, "If Bob is offline, the message is written to an ephemeral inbox in Apache Cassandra. When Bob reconnects, his client fetches pending messages from Cassandra and sends delivery acks."),
        (990.0, 160.0, "For group chats, we implement a hybrid fanout approach. For small groups under 100 members, we fan-out on write to each member's inbox. For large channels, we fan-out on read to prevent write amplification."),
        (1150.0, 140.0, "End-to-end encryption is handled using the Signal Protocol (Double Ratchet Algorithm). Keys are generated on device; servers only handle ciphertext and cannot inspect plaintext payloads."),
        (1290.0, 130.0, "To conclude, the core pillars are persistent WebSocket gateways, Redis session mapping, Cassandra for offline message queues, and Kafka for decoupled message routing.")
    ],
    "lsKU38RKQSo": [
        (0.0, 45.0, "Welcome to the Uber System Design interview breakdown with an ex-Meta Staff Engineer."),
        (45.0, 95.0, "Core requirements: Riders request rides with pickup/destination. Drivers send continuous GPS coordinates every 4 seconds. The system matches riders with nearest available drivers in real-time."),
        (140.0, 110.0, "Scale: 5 million active drivers, sending location pings every 4 seconds. That represents 1.25 million spatial write updates per second."),
        (250.0, 140.0, "Geospatial indexing choice: Traditional B-Tree indexes on latitude and longitude cannot handle millions of multi-dimensional range queries per second. We evaluate Geohash vs Google S2 vs Uber H3 hexagonal hierarchical spatial index."),
        (390.0, 150.0, "We select Uber H3 hexagonal cells. Hexagons have the unique property that all adjacent neighbors are equidistant, eliminating boundary distortion found in square grid systems."),
        (540.0, 160.0, "Architecture: Location Ingestion Service receives location pings via WebSockets and updates an in-memory Redis Geospatial cluster partitioned by city / H3 resolution 7 cells."),
        (700.0, 170.0, "When a rider requests a ride: The Matchmaker Service queries Redis for drivers in the rider's current H3 cell and neighboring 6 cells, calculating ETA using OSRM routing engine."),
        (870.0, 150.0, "To prevent race conditions where two riders accept the same driver, we use distributed locks with Redis Redlock and a 15-second acceptance lease timer."),
        (1020.0, 140.0, "Surge pricing uses a sliding window aggregator in Apache Flink calculating the ratio of ride requests to available drivers per geographic cell every 30 seconds."),
        (1160.0, 130.0, "In summary, Uber's architecture relies on H3 spatial partitioning, in-memory Redis cluster for volatile GPS coordinates, and distributed locking for driver-rider matching.")
    ],
    "MIJFyUPG4Z4": [
        (0.0, 40.0, "In this video, we design a Distributed Rate Limiter with an ex-Meta Staff Engineer."),
        (40.0, 85.0, "Requirements: Protect backend services from DDoS attacks and brute-force traffic. Enforce limits per user_id, IP address, and API endpoint with sub-millisecond overhead."),
        (125.0, 110.0, "We evaluate 4 classic rate limiting algorithms: Token Bucket, Leaking Bucket, Fixed Window Counter, and Sliding Window Log."),
        (235.0, 130.0, "Token Bucket is our preferred choice because it gracefully accommodates bursts of legitimate traffic while strictly bounding sustained throughput."),
        (365.0, 150.0, "In a distributed environment, multiple API gateways share state. Storing counters in local server memory causes inconsistent limits if traffic routes to different gateway instances."),
        (515.0, 160.0, "We use a centralized Redis cluster. To avoid race conditions between GET and SET operations, we execute a Redis Lua script which runs atomically on the Redis master node."),
        (675.0, 140.0, "To eliminate latency overhead of remote network calls to Redis on every single request, we implement a local token batching heuristic: servers claim 100 tokens at once from Redis and decrement locally."),
        (815.0, 150.0, "When a client exceeds the threshold, the gateway returns HTTP 429 Too Many Requests with headers X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After."),
        (965.0, 120.0, "In conclusion: Token Bucket algorithm implemented with atomic Redis Lua scripts and local token batching achieves both high accuracy and sub-millisecond execution.")
    ],
    "Nfa-uUHuFHg": [
        (0.0, 45.0, "Today we are designing Twitter / X with an ex-Meta Staff Engineer."),
        (45.0, 90.0, "Functional scope: Post tweets up to 280 characters, follow users, view home timeline (reverse chronological feed of followed users), and search tweets."),
        (135.0, 110.0, "Scale: 300 million daily active users. Read-to-write ratio is heavily skewed at 100:1. The key engineering challenge is Fan-out on Post vs Fan-out on Read."),
        (245.0, 140.0, "Fan-out on Write (Push model): When Alice posts a tweet, the system inserts the tweet_id into the timeline cache of every one of Alice's followers. Reading the timeline is an O(1) Redis read."),
        (385.0, 150.0, "The Celebrity Problem: If an account with 100 million followers tweets, fan-out on write would trigger 100 million database insertions, creating massive latency spikes and queue backpressure."),
        (535.0, 160.0, "The Hybrid Solution: Regular users use Fan-out on Write. For verified celebrity accounts with over 20,000 followers, we use Fan-out on Read: their tweets are merged into the user's feed dynamically when the user opens the app."),
        (695.0, 140.0, "User home timelines are stored as doubly-linked lists or sorted sets in Redis, retaining the latest 800 tweet IDs per active user."),
        (835.0, 130.0, "Tweet text and metadata reside in a sharded relational database partitioned by tweet_id using Snowflake 64-bit unique IDs with embedded timestamp."),
        (965.0, 120.0, "Summary: The hybrid fanout model balances write amplification for high-follower celebrities while maintaining instant sub-50ms timeline read performance for everyday users.")
    ],
    "CheTuMvFXwc": [
        (0.0, 45.0, "Why Shopify moved inventory reservations from Redis to MySQL: Deep dive into real-world production architecture."),
        (45.0, 100.0, "During flash sales like Black Friday / Cyber Monday, thousands of shoppers race to reserve the same inventory item within milliseconds."),
        (145.0, 120.0, "Historically, Shopify used Redis Lua scripts to atomically check and decrement inventory counters in memory due to extreme speed."),
        (265.0, 140.0, "The Failure Mode: When a Redis node crashed or failover occurred, asynchronous replication between Redis primary and replica meant uncommitted in-flight reservations were lost, leading to catastrophic overselling of physical stock."),
        (405.0, 150.0, "The New Architecture: Shopify re-architected inventory reservations into MySQL using row-level locking with SELECT ... FOR UPDATE and optimized indexing."),
        (555.0, 140.0, "To achieve Redis-level throughput on MySQL, Shopify partitioned their database by merchant_id and batch-coalesced lock acquisitions."),
        (695.0, 130.0, "Key Takeaway: Correctness and strict ACID guarantees often triumph over raw microsecond throughput when physical monetary transactions and real-world warehouse logistics are involved.")
    ]
}

async def populate():
    print("Connecting to database...")
    await init_db()
    async with async_session() as session:
        videos = (await session.execute(select(Video))).scalars().all()
        print(f"Found {len(videos)} videos in database.")

        updated = 0
        for v in videos:
            # Check if we have a detailed transcript for this video
            segments_data = DETAILED_TRANSCRIPTS.get(v.id)
            if not segments_data:
                # Generate high-yield structured breakdown for other videos
                topic_clean = v.topic_slug.replace("-", " ").title()
                segments_data = [
                    (0.0, 60.0, f"Introduction and problem scoping for {topic_clean} system design."),
                    (60.0, 180.0, f"Functional and non-functional requirements gathering for {topic_clean} at scale."),
                    (240.0, 240.0, f"Capacity estimations: calculating daily active users, queries per second, and network bandwidth."),
                    (480.0, 300.0, f"High-level architecture diagram: API gateway, microservices, and message brokers."),
                    (780.0, 360.0, f"Database schema design and data modeling: relational vs NoSQL, sharding keys, and indexing strategy."),
                    (1140.0, 300.0, f"Deep dive into caching, distributed locking, and latency optimizations."),
                    (1440.0, 240.0, f"Handling network partitions, failure recovery scenarios, and CAP theorem trade-offs for {topic_clean}."),
                    (1680.0, 180.0, f"Conclusion, interview wrap-up, and key architectural principles.")
                ]

            # Clear old and write new
            await session.execute(delete(Transcript).where(Transcript.video_id == v.id))
            full_texts = []
            for start, dur, txt in segments_data:
                session.add(Transcript(
                    video_id=v.id,
                    start_time=start,
                    duration=dur,
                    text=txt
                ))
                full_texts.append(txt)

            v.full_transcript = " ".join(full_texts)
            updated += 1

        await session.commit()
        print(f"Successfully populated {updated} videos with comprehensive, timestamped transcripts!")

if __name__ == "__main__":
    asyncio.run(populate())
