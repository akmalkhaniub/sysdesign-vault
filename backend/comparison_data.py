"""
Cross-Channel System Design Comparison Data
Multi-dimension comparison matrix of top interview problem architectures across creators.
"""

COMPARISON_TOPICS = [
    {
        "slug": "youtube-streaming",
        "title": "YouTube / Netflix Video Streaming System",
        "category": "High-Throughput Distributed Media",
        "problem_summary": "Design a global scale video uploading, transcoding, storage, and streaming platform capable of handling billions of views and millions of hours of uploads daily.",
        "key_challenges": [
            "Massive write throughput and multi-gigabyte payload ingestion",
            "Computationally intensive adaptive bitrate (ABR) transcoding",
            "Global ultra-low latency playback with high cache hit ratios (>95%)",
            "Near real-time view count tracking without lock contention"
        ],
        "creators": [
            {
                "channel_name": "Ex-Meta Staff / System Design Interview",
                "approach_title": "Chunked Tus.io Ingestion + Asynchronous DAG Transcoder + Edge HLS",
                "video_id": "IUrQ5_g3XKs",
                "key_components": {
                    "ingestion": "tus.io resumable HTTP chunk protocol direct to staging S3 buckets with presigned URLs",
                    "transcoding": "Kafka topic triggers DAG task coordinator running FFmpeg container workers (1080p, 720p, 480p, 360p)",
                    "streaming_protocol": "HLS (HTTP Live Streaming) with .m3u8 master playlists and 6-second .ts chunks",
                    "database": "Vitess / Google Spanner for horizontal scaling with ACID transactions for user subscriptions & comments",
                    "caching_cdn": "Tiered CDN (Cloudflare/Fastly PoPs + Origin Shield cache tier)",
                    "view_counter": "Redis HyperLogLog for unique deduplication + in-memory batch aggregators flushing to DB every 10s"
                },
                "trade_offs": {
                    "pros": [
                        "Resumable tus.io chunking prevents having to restart multi-gigabyte uploads on network drops",
                        "Tiered CDN shields storage origin from viral stampede",
                        "Async worker DAG enables prioritizing premium creators"
                    ],
                    "cons": [
                        "Complex FFmpeg DAG orchestration requires careful worker autoscaling during peak upload hours",
                        "HLS introduces 6-18 second playback latency compared to WebRTC (acceptable for VOD, poor for live chat)"
                    ]
                }
            },
            {
                "channel_name": "ByteByteGo (Alex Xu)",
                "approach_title": "Pre-signed URL Direct Upload + Watermark Pipeline + Cloud CDN",
                "video_id": "none",
                "key_components": {
                    "ingestion": "Client requests pre-signed S3 URL from API server, uploads directly to blob storage bypassing API gateway",
                    "transcoding": "Event-driven Lambda / EC2 spot instances split video by GOP (Group of Pictures) for parallel transcoding",
                    "streaming_protocol": "DASH (Dynamic Adaptive Streaming over HTTP) + HLS dual delivery",
                    "database": "Sharded MySQL with master-slave replication + Redis LRU cache for metadata",
                    "caching_cdn": "Multi-CDN routing strategy using Anycast DNS based on regional ISP performance",
                    "view_counter": "Distributed counter using random shard keys to prevent single-row write bottleneck"
                },
                "trade_offs": {
                    "pros": [
                        "Direct pre-signed upload saves massive bandwidth costs on API gateways",
                        "GOP-level parallel transcoding cuts 4K encoding latency significantly",
                        "Multi-CDN eliminates single CDN vendor outage risk"
                    ],
                    "cons": [
                        "GOP stitching requires precise audio/video sync alignments",
                        "Sharded MySQL requires manual re-sharding when user volume surges"
                    ]
                }
            },
            {
                "channel_name": "Jordan has no life",
                "approach_title": "ScyllaDB Metadata + Custom Storage Node Ring + BitTorrent P2P Edge",
                "video_id": "none",
                "key_components": {
                    "ingestion": "Direct TCP stream to storage node ring with consistent hashing ring",
                    "transcoding": "Decentralized task queue running on RabbitMQ with priority preemption",
                    "streaming_protocol": "HLS with WebTorrent / WebRTC mesh data channels between viewers watching the same viral stream",
                    "database": "ScyllaDB (C++ Cassandra rewrite) for high-throughput single-digit millisecond metadata reads",
                    "caching_cdn": "Hybrid CDN + peer-to-peer browser caching for viral live streams",
                    "view_counter": "Kafka log compaction stream with Spark Streaming sliding window aggregation"
                },
                "trade_offs": {
                    "pros": [
                        "P2P mesh offloads up to 70% of peak bandwidth costs during live presidential / world cup events",
                        "ScyllaDB delivers consistent latency without JVM GC pause spikes"
                    ],
                    "cons": [
                        "WebRTC data channel peer upload can drain mobile batteries",
                        "Increased architectural complexity managing P2P signaling servers"
                    ]
                }
            }
        ]
    },
    {
        "slug": "whatsapp-chat",
        "title": "WhatsApp / Discord Real-Time Chat System",
        "category": "Low-Latency Stateful Communication",
        "problem_summary": "Design a high-concurrency 1-on-1 and group chat messenger supporting billions of active users, end-to-end encryption, online presence, and offline message delivery.",
        "key_challenges": [
            "Maintaining 100M+ concurrent open TCP/WebSocket connections with minimal memory footprint",
            "Guaranteed at-least-once message delivery with correct chronological ordering",
            "Group message fan-out amplification (1 message -> 500 recipients)",
            "Scalable presence status (online/last seen) without hammering databases"
        ],
        "creators": [
            {
                "channel_name": "ByteByteGo (Alex Xu)",
                "approach_title": "WebSocket Gateway Cluster + Redis Session Map + Cassandra Storage",
                "video_id": "none",
                "key_components": {
                    "connection": "Stateful WebSocket servers maintaining persistent connections",
                    "presence": "Heartbeat mechanism over WebSocket, Redis key with 30s TTL refreshed every 10s",
                    "message_delivery": "Message Queue (Kafka) partitions by conversation ID for strict ordering",
                    "storage": "Cassandra wide-column store; primary key (channel_id, message_id) with timeUUID clustering key",
                    "group_fanout": "Sender-side fanout for small groups (<500), receiver-side pull for large channels"
                },
                "trade_offs": {
                    "pros": [
                        "Cassandra sequential disk writes provide immense write throughput",
                        "Redis TTL naturally expires dead connections without active polling"
                    ],
                    "cons": [
                        "Large groups can trigger fanout write storms in message queues"
                    ]
                }
            },
            {
                "channel_name": "Gaurav Sen",
                "approach_title": "XMPP Protocol + Erlang/Elixir BEAM Processes + Consistent Hashing",
                "video_id": "none",
                "key_components": {
                    "connection": "Lightweight Erlang processes (EJabberD) holding TCP sockets with <2KB RAM per connection",
                    "presence": "Gossip protocol / ephemeral state in Mnesia in-memory database",
                    "message_delivery": "Ack-based delivery: Server-Ack (single check) -> Delivered-Ack (double check) -> Read-Ack (blue check)",
                    "storage": "Ephemeral server buffer (delete on delivery); SQLite local storage on user device",
                    "group_fanout": "Central Group Service managing member lists and distributing copies"
                },
                "trade_offs": {
                    "pros": [
                        "Deleting delivered messages from server guarantees zero cloud storage liability & true privacy",
                        "Erlang BEAM actor model handles millions of concurrent green threads natively"
                    ],
                    "cons": [
                        "If device is lost or new device logged in, message history cannot be restored without cloud backups (Google Drive/iCloud)"
                    ]
                }
            }
        ]
    },
    {
        "slug": "uber-ride-sharing",
        "title": "Uber / Lyft Ride Dispatch System",
        "category": "Real-Time Geospatial Matching",
        "problem_summary": "Design a real-time ride-matching and pricing system tracking millions of active drivers updating GPS coordinates every 4 seconds, matching riders within 1 second.",
        "key_challenges": [
            "Inexpensive continuous 4-second geospatial location ingestion",
            "Radius queries finding top 10 closest drivers in <50ms",
            "Concurrency control: Ensuring two riders cannot be dispatched to the same driver",
            "Dynamic surge pricing calculation based on supply-demand imbalance"
        ],
        "creators": [
            {
                "channel_name": "Hello Interview",
                "approach_title": "Uber H3 Hexagonal Grid + Redis Geospatial + Distributed Lock Dispatch",
                "video_id": "none",
                "key_components": {
                    "spatial_index": "Uber H3 hierarchical hexagonal spatial index (resolution 8: ~460m edge)",
                    "location_cache": "Redis in-memory set indexing driver IDs by H3 cell ID",
                    "dispatch_lock": "Redis Redlock / atomic CAS (Compare-And-Swap) on driver state (AVAILABLE -> OFFERED -> BOOKED)",
                    "matching": "K-ring traversal: inspect center hex cell, then expand outwards (rings 1, 2, 3) until N drivers found",
                    "pricing": "Aggregate supply/demand counts per H3 cell every 10 seconds to compute multiplier"
                },
                "trade_offs": {
                    "pros": [
                        "Hexagons have uniform neighbor distance (all 6 neighbors have identical center-to-center distance, unlike squares)",
                        "Atomic Redis state machine eliminates double-booking race conditions"
                    ],
                    "cons": [
                        "Boundary crossing between hexagons requires checking adjacent cells"
                    ]
                }
            },
            {
                "channel_name": "ByteByteGo (Alex Xu)",
                "approach_title": "Google S2 Cells + QuadTree In-Memory Cache + Kafka Event Log",
                "video_id": "none",
                "key_components": {
                    "spatial_index": "Google S2 Geometry library mapping sphere coordinates to 1D Hilbert Curve 64-bit integers",
                    "location_cache": "Custom QuadTree in memory replicated across dispatch cluster",
                    "dispatch_lock": "Database pessimistic row lock with short 10s lease time",
                    "matching": "Hilbert curve prefix range query to instantly locate nearby cells",
                    "pricing": "Machine learning model trained on historical weather, events, and traffic"
                },
                "trade_offs": {
                    "pros": [
                        "S2 Hilbert 64-bit integers can be indexed directly in standard B-Tree databases",
                        "QuadTree allows dynamic splitting when city centers become ultra-dense"
                    ],
                    "cons": [
                        "Rebalancing QuadTrees under heavy driver movement creates lock contention"
                    ]
                }
            }
        ]
    },
    {
        "slug": "rate-limiter",
        "title": "Distributed API Rate Limiter",
        "category": "Traffic Shaping & DDoS Mitigation",
        "problem_summary": "Design a resilient, low-latency (<5ms) rate limiting tier to protect downstream microservices from spam, noisy neighbors, and volumetric abuse.",
        "key_challenges": [
            "Sub-millisecond latency overhead on every inbound request",
            "Race conditions under concurrent multi-threaded requests",
            "High availability: Rate limiter failure must not take down the entire API",
            "Graceful handling of clock drift across distributed servers"
        ],
        "creators": [
            {
                "channel_name": "ByteByteGo (Alex Xu)",
                "approach_title": "Redis Token Bucket via Lua Script + Fail-Open Fallback",
                "video_id": "none",
                "key_components": {
                    "algorithm": "Token Bucket: refill tokens at fixed rate, subtract token on request",
                    "concurrency": "Redis EVAL with Lua script executes read-decrement atomically in Redis single thread",
                    "tier_placement": "API Gateway filter (Envoy / Kong) before routing to internal services",
                    "failure_strategy": "Fail-open with circuit breaker: if Redis cluster is unreachable, allow traffic through to avoid outage",
                    "response_headers": "X-Ratelimit-Remaining, X-Ratelimit-Limit, X-Ratelimit-Retry-After, HTTP 429 Too Many Requests"
                },
                "trade_offs": {
                    "pros": [
                        "Token bucket naturally accommodates temporary legitimate traffic bursts",
                        "Lua script eliminates network round-trip race conditions"
                    ],
                    "cons": [
                        "Redis cluster network hop adds 1-2ms to overall request latency"
                    ]
                }
            },
            {
                "channel_name": "Gaurav Sen",
                "approach_title": "Sliding Window Counter + Local Memory Cache with Batch Sync",
                "video_id": "none",
                "key_components": {
                    "algorithm": "Sliding Window Counter (weighted average of previous and current minute windows)",
                    "concurrency": "Local in-memory counter on each API Gateway node + async background sync every 500ms",
                    "tier_placement": "Sidecar proxy (Envoy) co-located on the same EC2/Kubernetes pod",
                    "failure_strategy": "Local fallback quota: Each node is allocated MaxQuota / TotalNodes tokens locally",
                    "response_headers": "HTTP 429 with exponential backoff advisory"
                },
                "trade_offs": {
                    "pros": [
                        "In-memory check has sub-microsecond latency (zero network hops)",
                        "Total immunity to central Redis network partitions"
                    ],
                    "cons": [
                        "Sync delay can allow temporary 5-10% quota overages during sudden traffic spikes"
                    ]
                }
            }
        ]
    }
]
