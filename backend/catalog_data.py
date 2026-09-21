"""
Curated catalog of System Design problems, core concepts, and cross-channel relationships.
Maps HelloInterview videos to related videos on ByteByteGo, Gaurav Sen, Hussein Nasser, NeetCode, Arpit Bhayani, etc.
"""

CHANNELS = [
    {
        "id": "@hello_interview",
        "name": "Hello Interview",
        "url": "https://www.youtube.com/@hello_interview"
    },
    {
        "id": "@bytebytego",
        "name": "ByteByteGo",
        "url": "https://www.youtube.com/@bytebytego"
    },
    {
        "id": "@hnasr",
        "name": "Hussein Nasser",
        "url": "https://www.youtube.com/@hnasr"
    },
    {
        "id": "@gkcs",
        "name": "Gaurav Sen",
        "url": "https://www.youtube.com/@gkcs"
    },
    {
        "id": "@NeetCodeIO",
        "name": "NeetCode",
        "url": "https://www.youtube.com/@NeetCodeIO"
    },
    {
        "id": "@Jordanhasnolife",
        "name": "Jordan Has No Life",
        "url": "https://www.youtube.com/@Jordanhasnolife"
    },
    {
        "id": "@ArpitBhayani",
        "name": "Arpit Bhayani",
        "url": "https://www.youtube.com/@ArpitBhayani"
    }
]

# Videos with their core system design topic slugs and channel mappings
VIDEOS_CATALOG = [
    # --- PROBLEM WALKTHROUGHS ---
    {
        "id": "IUrQ5_g3XKs",
        "channel_id": "@hello_interview",
        "title": "System Design Interview: Design YouTube w/ a Ex-Meta Staff Engineer",
        "category": "Problem Walkthrough",
        "topic_slug": "youtube-streaming",
        "related": [
            {
                "id": "jPKTo166FbU",
                "channel_id": "@bytebytego",
                "title": "Design YouTube - System Design Interview",
                "relation": "alternative_solution",
                "note": "ByteByteGo's classic animated breakdown of video chunking, transcoding DAG, and CDN distribution."
            },
            {
                "id": "zl8TqV2O2iE",
                "channel_id": "@gkcs",
                "title": "System Design: YouTube Architecture",
                "relation": "deep_dive",
                "note": "Gaurav Sen's comprehensive look at video streaming protocols, blob storage, and read heavy caching."
            },
            {
                "id": "M3NmOX58kL4",
                "channel_id": "@NeetCodeIO",
                "title": "Design YouTube System Design Interview",
                "relation": "interview_prep",
                "note": "NeetCode's structured walkthrough focusing on functional requirements and schema design."
            }
        ]
    },
    {
        "id": "cr6p0n0N-VA",
        "channel_id": "@hello_interview",
        "title": "Design Whatsapp: System Design Interview w/ a Ex-Meta Senior Manager",
        "category": "Problem Walkthrough",
        "topic_slug": "chat-system",
        "related": [
            {
                "id": "vvhC64hQZMk",
                "channel_id": "@bytebytego",
                "title": "Design a Chat System (WhatsApp / Messenger)",
                "relation": "alternative_solution",
                "note": "ByteByteGo's architecture on WebSocket handshake, connection manager, and multi-device sync."
            },
            {
                "id": "2d_j-4b0V78",
                "channel_id": "@Jordanhasnolife",
                "title": "Design WhatsApp - System Design",
                "relation": "interview_prep",
                "note": "Deep dive into stateful WebSocket connections, heartbeat pings, and transient message queues."
            },
            {
                "id": "L7LtST52NQU",
                "channel_id": "@gkcs",
                "title": "WhatsApp System Design",
                "relation": "deep_dive",
                "note": "Gaurav Sen explains XMPP vs WebSockets and peer-to-peer media delivery."
            }
        ]
    },
    {
        "id": "lsKU38RKQSo",
        "channel_id": "@hello_interview",
        "title": "Design Uber w/ a Ex-Meta Staff Engineer: System Design Interview breakdown",
        "category": "Problem Walkthrough",
        "topic_slug": "proximity-uber",
        "related": [
            {
                "id": "Tp8kpMe-Zkw",
                "channel_id": "@bytebytego",
                "title": "Design a Proximity Service / Uber System Design",
                "relation": "alternative_solution",
                "note": "Spatial indexing using Quadtree vs Geohash and real-time driver location stream updates."
            },
            {
                "id": "umwab_40k2Q",
                "channel_id": "@Jordanhasnolife",
                "title": "Design Uber System Design",
                "relation": "deep_dive",
                "note": "Driver-rider matching algorithms, geospatial database sharding, and surge pricing queues."
            }
        ]
    },
    {
        "id": "MIJFyUPG4Z4",
        "channel_id": "@hello_interview",
        "title": "Design a Distributed Rate Limiter w/ a Ex-Meta Staff Engineer: System Design Breakdown",
        "category": "Problem Walkthrough",
        "topic_slug": "rate-limiter",
        "related": [
            {
                "id": "FU4WIZ44YRE",
                "channel_id": "@bytebytego",
                "title": "Design a Rate Limiter - System Design Interview",
                "relation": "alternative_solution",
                "note": "Detailed algorithmic comparison: Token Bucket, Leaking Bucket, Fixed Window, Sliding Window Log, and Sliding Window Counter."
            },
            {
                "id": "CRGPbQK9fCs",
                "channel_id": "@ArpitBhayani",
                "title": "How Rate Limiters work in Distributed Systems",
                "relation": "deep_dive",
                "note": "Arpit Bhayani explains race conditions in distributed Redis instances and Lua script atomic operations."
            },
            {
                "id": "mXN073cQ6Gg",
                "channel_id": "@hnasr",
                "title": "Rate Limiting Explained - Algorithms & Tradeoffs",
                "relation": "deep_dive",
                "note": "Hussein Nasser's deep dive into HTTP headers (X-RateLimit-Remaining) and reverse proxy rate limiting."
            }
        ]
    },
    {
        "id": "Nfa-uUHuFHg",
        "channel_id": "@hello_interview",
        "title": "System Design Interview Walkthrough: Design Twitter",
        "category": "Problem Walkthrough",
        "topic_slug": "news-feed-twitter",
        "related": [
            {
                "id": "oHk5nO-pC-g",
                "channel_id": "@bytebytego",
                "title": "Design Twitter - System Design Interview",
                "relation": "alternative_solution",
                "note": "Fanout-on-write (push) vs Fanout-on-read (pull) and how celebrity users are handled with a hybrid approach."
            },
            {
                "id": "KmAyPUv976E",
                "channel_id": "@gkcs",
                "title": "System Design: Twitter Architecture",
                "relation": "deep_dive",
                "note": "Gaurav Sen analyzes Redis timeline caching and timeline pagination."
            }
        ]
    },
    {
        "id": "_UZ1ngy-kOI",
        "channel_id": "@hello_interview",
        "title": "Design Dropbox or Google Drive w/ a Ex-Meta Staff Engineer System Design Interview",
        "category": "Problem Walkthrough",
        "topic_slug": "file-storage",
        "related": [
            {
                "id": "U0xTu6mrWGU",
                "channel_id": "@bytebytego",
                "title": "Design Google Drive / Dropbox",
                "relation": "alternative_solution",
                "note": "Block-level synchronization, hashing chunks for deduplication, and S3 cold/hot tiering."
            },
            {
                "id": "7n_b0aC_w8U",
                "channel_id": "@NeetCodeIO",
                "title": "Design Google Drive - System Design Interview",
                "relation": "interview_prep",
                "note": "Metadata database design, file chunk upload manager, and revision conflict resolution."
            }
        ]
    },
    {
        "id": "y-tA2NW4LNY",
        "channel_id": "@hello_interview",
        "title": "Top-K System Design Interview Breakdown w/ Ex-Meta Senior Manager",
        "category": "Problem Walkthrough",
        "topic_slug": "top-k",
        "related": [
            {
                "id": "kx-XDoPukH0",
                "channel_id": "@bytebytego",
                "title": "Design Top K Problem (Heavy Hitters)",
                "relation": "alternative_solution",
                "note": "Count-Min Sketch, map-reduce aggregators, sliding window tumbling, and heap/min-heap Top-K selection."
            }
        ]
    },
    {
        "id": "fhdPyoO6aXI",
        "channel_id": "@hello_interview",
        "title": "System Design Interview: Design Ticketmaster w/ a Ex-Meta Staff Engineer",
        "category": "Problem Walkthrough",
        "topic_slug": "ticketmaster-booking",
        "related": [
            {
                "id": "lBAwJgo73OM",
                "channel_id": "@bytebytego",
                "title": "Design Ticketmaster (High Concurrency Booking)",
                "relation": "alternative_solution",
                "note": "Distributed locks, inventory reservations, transactional isolation levels, and waiting room queue architecture."
            }
        ]
    },
    {
        "id": "18Fg5Akhkqw",
        "channel_id": "@hello_interview",
        "title": "System Design Interview: Design Tinder w/ a Ex-Meta Staff Engineer",
        "category": "Problem Walkthrough",
        "topic_slug": "dating-app",
        "related": [
            {
                "id": "tndr_arch_01",
                "channel_id": "@gkcs",
                "title": "Tinder System Design: Geosharding and Matching",
                "relation": "deep_dive",
                "note": "Recommendation generation, reciprocal liking storage, and geohash clustering."
            }
        ]
    },
    {
        "id": "krsuaUp__pM",
        "channel_id": "@hello_interview",
        "title": "Design a Web Crawler System Design Interview w/ a Ex-Meta Staff Engineer",
        "category": "Problem Walkthrough",
        "topic_slug": "web-crawler",
        "related": [
            {
                "id": "BKZxZwQyW9k",
                "channel_id": "@bytebytego",
                "title": "Design a Web Crawler",
                "relation": "alternative_solution",
                "note": "Frontier queue, politeness host queues, robots.txt caching, and duplicate content detection via Bloom Filters."
            }
        ]
    },
    {
        "id": "iUU4O1sWtJA",
        "channel_id": "@hello_interview",
        "title": "Beginner System Design Interview: Design Bitly w/ a Ex-Meta Staff Engineer",
        "category": "Problem Walkthrough",
        "topic_slug": "url-shortener",
        "related": [
            {
                "id": "fMZMm_0ZhK4",
                "channel_id": "@bytebytego",
                "title": "Design a URL Shortener (TinyURL)",
                "relation": "alternative_solution",
                "note": "Base62 encoding, unique ID generation (Snowflake), and high-throughput read caching."
            },
            {
                "id": "JQDHz72OA3c",
                "channel_id": "@gkcs",
                "title": "System Design: TinyURL Architecture",
                "relation": "deep_dive",
                "note": "Counter services vs MD5 hash truncation and collisions."
            }
        ]
    },

    # --- CORE CONCEPTS & DEEP DIVES ---
    {
        "id": "1NngTUYPdpI",
        "channel_id": "@hello_interview",
        "title": "Caching in System Design Interviews w/ Meta Staff Engineer",
        "category": "Deep Dive",
        "topic_slug": "caching",
        "related": [
            {
                "id": "U3RkDLtS7uY",
                "channel_id": "@bytebytego",
                "title": "Top Caching Strategies in System Design",
                "relation": "alternative_solution",
                "note": "Cache-aside, Read-through, Write-through, Write-around, Write-back, and eviction policies (LRU, LFU)."
            },
            {
                "id": "dGAgxozNWFE",
                "channel_id": "@hnasr",
                "title": "Database Caching Explained",
                "relation": "deep_dive",
                "note": "Hussein Nasser on cache stampedes, dogpiling, probabilistic early expiration, and cache invalidation."
            },
            {
                "id": "arpit_cache_inv",
                "channel_id": "@ArpitBhayani",
                "title": "Cache Invalidation Strategies at Scale",
                "relation": "deep_dive",
                "note": "Real-world cache synchronization with database write-ahead logs (Debezium/CDC)."
            }
        ]
    },
    {
        "id": "L521gizea4s",
        "channel_id": "@hello_interview",
        "title": "Sharding in System Design Interviews w/ Meta Staff Engineer",
        "category": "Deep Dive",
        "topic_slug": "sharding",
        "related": [
            {
                "id": "5faMjKuB9bc",
                "channel_id": "@bytebytego",
                "title": "Database Sharding & Consistent Hashing",
                "relation": "alternative_solution",
                "note": "Hash-based, range-based, and directory-based sharding with rebalancing."
            },
            {
                "id": "Psd_M8h5wP8",
                "channel_id": "@hnasr",
                "title": "Database Sharding Explained in Depth",
                "relation": "deep_dive",
                "note": "Cross-shard joins, distributed transactions across shards, and shard key selection pitfalls."
            }
        ]
    },
    {
        "id": "vccwdhfqIrI",
        "channel_id": "@hello_interview",
        "title": "Consistent Hashing: Easy Explanation for System Design Interviews",
        "category": "Deep Dive",
        "topic_slug": "consistent-hashing",
        "related": [
            {
                "id": "zaRkONvyGr8",
                "channel_id": "@bytebytego",
                "title": "What is Consistent Hashing and Why is it Useful?",
                "relation": "alternative_solution",
                "note": "Hash ring visualization, virtual nodes for uniform distribution, and node failure recovery."
            },
            {
                "id": "tHEyY5gA2j4",
                "channel_id": "@gkcs",
                "title": "Consistent Hashing Deep Dive",
                "relation": "deep_dive",
                "note": "Mathematical analysis of rehashing cost: O(K/N) vs O(K)."
            }
        ]
    },
    {
        "id": "1ISRd0bS714",
        "channel_id": "@hello_interview",
        "title": "Message Queues in System Design Interviews w/ Meta Staff Engineer",
        "category": "Deep Dive",
        "topic_slug": "message-queues",
        "related": [
            {
                "id": "oZdZbM-2e5U",
                "channel_id": "@bytebytego",
                "title": "Message Queues vs Event Streams Explained",
                "relation": "alternative_solution",
                "note": "Point-to-point vs Publish-Subscribe, RabbitMQ vs Apache Kafka."
            },
            {
                "id": "hn_mq_tradeoffs",
                "channel_id": "@hnasr",
                "title": "When to use a Message Queue vs an Event Bus",
                "relation": "deep_dive",
                "note": "Acknowledgment protocols, dead letter queues, and consumer backpressure."
            }
        ]
    },
    {
        "id": "1HOVtQ-_fcE",
        "channel_id": "@hello_interview",
        "title": "Kafka vs RabbitMQ",
        "category": "Deep Dive",
        "topic_slug": "kafka-rabbitmq",
        "related": [
            {
                "id": "b-t3B2m30bQ",
                "channel_id": "@bytebytego",
                "title": "Kafka vs RabbitMQ - System Design Comparison",
                "relation": "alternative_solution",
                "note": "Smart broker / dumb consumer (RabbitMQ) vs dumb broker / smart consumer (Kafka log)."
            }
        ]
    },
    {
        "id": "DOFflggE_0Q",
        "channel_id": "@hello_interview",
        "title": "Distributed Transactions Explained: 2 Phase Commit vs Saga Pattern",
        "category": "Deep Dive",
        "topic_slug": "distributed-transactions",
        "related": [
            {
                "id": "0UTOLtO4g7U",
                "channel_id": "@bytebytego",
                "title": "Saga Pattern vs 2-Phase Commit (2PC) in Microservices",
                "relation": "alternative_solution",
                "note": "ACID vs BASE, orchestrator vs choreography sagas, and compensating transactions."
            },
            {
                "id": "arpit_sagas_01",
                "channel_id": "@ArpitBhayani",
                "title": "Distributed Transactions and Saga Pattern",
                "relation": "deep_dive",
                "note": "Event-driven architecture with outbox pattern and idempotent message processing."
            }
        ]
    },
    {
        "id": "dQXdSxn7d1g",
        "channel_id": "@hello_interview",
        "title": "Proximity Search & Geospatial Indexes Explained",
        "category": "Deep Dive",
        "topic_slug": "geospatial-indexes",
        "related": [
            {
                "id": "M4lR_P8v73Q",
                "channel_id": "@bytebytego",
                "title": "Geospatial Indexing: Geohash vs QuadTree vs S2 Geometry",
                "relation": "alternative_solution",
                "note": "Comparing spatial indexing data structures for fast neighbor radius queries."
            }
        ]
    },
    {
        "id": "Qd76ZmfRs_Q",
        "channel_id": "@hello_interview",
        "title": "How do Time Series Databases Work?",
        "category": "Deep Dive",
        "topic_slug": "time-series-db",
        "related": [
            {
                "id": "hn_tsdb_internals",
                "channel_id": "@hnasr",
                "title": "Time Series Databases Explained: InfluxDB, Gorilla, TimescaleDB",
                "relation": "deep_dive",
                "note": "Delta-of-delta compression, downsampling policies, and columnar LSM storage."
            }
        ]
    },
    {
        "id": "CheTuMvFXwc",
        "channel_id": "@hello_interview",
        "title": "Why Shopify Moved Inventory Reservations from Redis to MySQL",
        "category": "System Design In the Wild",
        "topic_slug": "real-world-architecture",
        "related": [
            {
                "id": "shopify_db_arch",
                "channel_id": "@hnasr",
                "title": "Why Shopify Replaced Redis with MySQL for Flash Sales",
                "relation": "deep_dive",
                "note": "Memory limits, data durability, row-level locking, and flash-sale checkout spikes."
            }
        ]
    },
    {
        "id": "RuGY_1pap74",
        "channel_id": "@hello_interview",
        "title": "Senior System Design Mock Interview: Design an e-commerce platform",
        "category": "Mock Interview",
        "topic_slug": "ecommerce-platform",
        "related": [
            {
                "id": "ecom_bytebytego",
                "channel_id": "@bytebytego",
                "title": "Design Amazon / E-Commerce System",
                "relation": "alternative_solution",
                "note": "Inventory lock, shopping cart persistence, payment gateway idempotency, and fulfillment."
            }
        ]
    }
]
