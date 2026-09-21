"""
45-Minute Mock Interview Simulation Templates and Evaluation Rubric
"""

MOCK_INTERVIEW_PROMPTS = [
    {
        "id": "mock-youtube",
        "title": "Design YouTube (Global Video Streaming)",
        "difficulty": "Hard",
        "target_level": "Senior / Staff Software Engineer",
        "description": "Design a scalable video sharing and streaming service where users can upload, transcode, search, and stream videos globally.",
        "duration_minutes": 45,
        "phases": [
            {
                "phase_id": "requirements",
                "name": "Phase 1: Requirements & Scope",
                "recommended_minutes": 5,
                "goal": "Clarify functional & non-functional requirements and establish system boundaries.",
                "checklist": [
                    "Clarify Functional: Upload video, view/stream video, search, view count",
                    "Out of scope: Comments, recommendations, monetization (keep it focused)",
                    "Non-functional: High availability (99.99%), low playback latency (<200ms startup), reliable upload (no corrupted files)",
                    "Establish scale: 1B DAU, 5M uploads/day, average video size 300MB"
                ]
            },
            {
                "phase_id": "capacity_math",
                "name": "Phase 2: Capacity Estimation & Constraints",
                "recommended_minutes": 7,
                "goal": "Calculate traffic QPS, storage bandwidth, and compute requirements.",
                "checklist": [
                    "Upload QPS: 5M videos / 10^5 s = 50 uploads/sec (Peak ~150/s)",
                    "Playback QPS: 1B DAU * 5 views = 5B views/day -> ~50,000 views/sec (Peak ~150,000/s)",
                    "Daily Storage: 5M * 300MB = 1.5 PB / day. 5-Year: ~2.7 Exabytes raw.",
                    "Egress Bandwidth: 50,000 streams * 2 Mbps = 100 Gbps network egress -> Multi-CDN required"
                ]
            },
            {
                "phase_id": "high_level",
                "name": "Phase 3: High-Level Architecture",
                "recommended_minutes": 13,
                "goal": "Draw end-to-end component flow from upload client to playback CDN.",
                "checklist": [
                    "Ingestion Path: Client -> API Gateway -> Pre-signed S3 / tus.io chunker",
                    "Transcoding Pipeline: Kafka -> DAG Master -> FFmpeg Worker Pool -> Processed Storage",
                    "Playback Path: Client -> Edge CDN -> Origin Shield -> Blob Storage",
                    "Metadata & Search: Sharded DB (Vitess/PostgreSQL) + Elasticsearch/OpenSearch"
                ]
            },
            {
                "phase_id": "deep_dive",
                "name": "Phase 4: Component Deep Dives",
                "recommended_minutes": 15,
                "goal": "Dive deep into 2-3 complex bottlenecks.",
                "checklist": [
                    "Deep Dive 1: Resumable chunked upload & failure recovery protocol",
                    "Deep Dive 2: Video Transcoding optimization (GOP split & parallel encoding)",
                    "Deep Dive 3: Accurate view count aggregation without database lock contention (Redis HyperLogLog + buffered batch flush)"
                ]
            },
            {
                "phase_id": "wrap_up",
                "name": "Phase 5: Bottlenecks, Trade-offs & Wrap-Up",
                "recommended_minutes": 5,
                "goal": "Address single points of failure, cost optimizations, and cross-datacenter DR.",
                "checklist": [
                    "Single Point of Failure (SPOF) audit across all tiers",
                    "CDN Bandwidth cost optimization (Tiered storage: Hot vs Cold S3 Glacier)",
                    "Failure modes: What happens if Transcoding queue falls behind?",
                    "Security: Pre-signed upload expiration, DRM, and video content moderation"
                ]
            }
        ],
        "rubric": [
            {"category": "Communication & Driving the Discussion", "weight": 20, "description": "Did the candidate lead the conversation, ask targeted clarifying questions, and manage the 45-minute timer?"},
            {"category": "Estimation & Mathematical Rigor", "weight": 20, "description": "Did the candidate translate business volume to realistic QPS, storage, and egress bandwidth constraints?"},
            {"category": "High-Level Architecture & Separation of Concerns", "weight": 25, "description": "Are the read and write paths cleanly separated? Are asynchronous pipelines decoupled via queues?"},
            {"category": "Deep Dive & Bottleneck Resolution", "weight": 25, "description": "Did the candidate demonstrate senior engineering depth on data consistency, chunking, and caching?"},
            {"category": "Trade-off Justification", "weight": 10, "description": "Did the candidate justify technology choices (e.g. HLS vs WebRTC, Vitess vs Cassandra) rather than just listing buzzwords?"}
        ]
    },
    {
        "id": "mock-whatsapp",
        "title": "Design WhatsApp (Real-Time Chat & Messaging)",
        "difficulty": "Hard",
        "target_level": "Senior / Staff Software Engineer",
        "description": "Design a low-latency, cross-platform instant messaging system supporting 1-on-1 chat, group chat, delivery receipts, and presence.",
        "duration_minutes": 45,
        "phases": [
            {
                "phase_id": "requirements",
                "name": "Phase 1: Requirements & Scope",
                "recommended_minutes": 5,
                "goal": "Clarify functional & non-functional requirements and establish system boundaries.",
                "checklist": [
                    "Clarify Functional: 1-on-1 messaging, group messaging (<500 users), delivery status (Sent, Delivered, Read), Online/Offline presence",
                    "Out of scope: Voice/Video calls, media sharing (keep focused on message pipeline)",
                    "Non-functional: <100ms latency, 99.999% message durability, strictly ordered delivery per conversation"
                ]
            },
            {
                "phase_id": "capacity_math",
                "name": "Phase 2: Capacity Estimation & Constraints",
                "recommended_minutes": 7,
                "goal": "Calculate concurrent connections, message throughput, and connection memory.",
                "checklist": [
                    "500M DAU, 40 messages/user/day = 20 Billion messages/day",
                    "Average QPS: 20B / 10^5 s = 200,000 msg/sec (Peak ~600,000/s)",
                    "Active Connections: ~50M concurrent WebSockets. 10KB RAM per socket = 500GB RAM across connection fleet (~16 servers with 32GB RAM)"
                ]
            },
            {
                "phase_id": "high_level",
                "name": "Phase 3: High-Level Architecture",
                "recommended_minutes": 13,
                "goal": "Draw connection tier, routing bus, and persistent message store.",
                "checklist": [
                    "Connection Tier: Stateful WebSocket Servers / Epoll cluster",
                    "Routing Tier: Session Key-Value Store (Redis UserID -> ServerID mapping)",
                    "Persistence: Wide-column Cassandra / ScyllaDB for append-only message history",
                    "Offline Notification: Apple Push Notification Service (APNS) & FCM gateway"
                ]
            },
            {
                "phase_id": "deep_dive",
                "name": "Phase 4: Component Deep Dives",
                "recommended_minutes": 15,
                "goal": "Dive deep into ordering, presence, and group fanout.",
                "checklist": [
                    "Deep Dive 1: Message ordering and causal consistency (Snowflake ID / Monotonic sequence)",
                    "Deep Dive 2: Group chat fan-out vs fan-in trade-offs",
                    "Deep Dive 3: Heartbeat presence tracking without thundering herd on Redis"
                ]
            },
            {
                "phase_id": "wrap_up",
                "name": "Phase 5: Bottlenecks, Trade-offs & Wrap-Up",
                "recommended_minutes": 5,
                "goal": "Address E2EE, connection rebalancing during deployment, and network failure.",
                "checklist": [
                    "Graceful connection drain during rolling deployments",
                    "End-to-end encryption key exchange (Signal Protocol / Double Ratchet)",
                    "Split-brain and network partition resilience"
                ]
            }
        ],
        "rubric": [
            {"category": "Communication & Driving the Discussion", "weight": 20, "description": "Candidate structured the problem methodically and led the conversation."},
            {"category": "Estimation & Mathematical Rigor", "weight": 20, "description": "Accurately calculated WebSocket connection memory and message fan-out multipliers."},
            {"category": "High-Level Architecture", "weight": 25, "description": "Clear understanding of stateful vs stateless layers in real-time communication."},
            {"category": "Deep Dive & Bottleneck Resolution", "weight": 25, "description": "Addressed edge cases: offline users, connection drop-reconnect, out-of-order delivery."},
            {"category": "Trade-off Justification", "weight": 10, "description": "Justified storage selection (Cassandra vs Relational DB) and push vs pull routing."}
        ]
    }
]
