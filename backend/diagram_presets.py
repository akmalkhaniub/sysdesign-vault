"""
Architecture Diagram Presets and Palette Templates for Mermaid.js
"""

PALETTE_SNIPPETS = [
    {
        "id": "ingress_gateway",
        "name": "Ingress & Gateway",
        "description": "DNS -> Cloudflare CDN -> ALB -> API Gateway",
        "snippet": """    subgateway[Client Ingress]
    Client([Client Apps / Web]) --> CDN[Cloudflare CDN]
    CDN --> ALB[Application Load Balancer]
    ALB --> Gateway[API Gateway / Envoy]"""
    },
    {
        "id": "cache_db_cqrs",
        "name": "CQRS + Redis Cache",
        "description": "Read from Redis cache with DB fallback, Write to Primary DB with replica sync",
        "snippet": """    subgraph Data Tier [CQRS & Caching]
    Service[Application Service] -->|1. Check Cache| Cache[(Redis Cluster)]
    Service -->|2. Cache Miss Read| ReplicaDB[(PostgreSQL Read Replica)]
    Service -->|3. Write / Mutate| PrimaryDB[(PostgreSQL Primary)]
    PrimaryDB -.->|Async Replication| ReplicaDB
    end"""
    },
    {
        "id": "event_driven_queue",
        "name": "Async Kafka Pipeline",
        "description": "Kafka Event Bus with Consumer Worker Pool",
        "snippet": """    subgraph Event Streaming [Async Decoupling]
    Producer[Ingestion API] -->|Produce Events| Kafka{Kafka Partitioned Topic}
    Kafka -->|Consumer Group A| Worker1[Video Transcoder Worker]
    Kafka -->|Consumer Group B| Worker2[Notification Dispatcher]
    Worker1 -->|Store Processed Asset| S3[(S3 Object Storage)]
    end"""
    },
    {
        "id": "websocket_presence",
        "name": "WebSocket Real-Time Chat",
        "description": "Stateful WebSocket Gateways with Redis Pub/Sub backplane",
        "snippet": """    subgraph RealTime [WebSocket Mesh]
    UserA([User Alice]) <-->|WSS Connection| WS1[WS Gateway Node 1]
    UserB([User Bob]) <-->|WSS Connection| WS2[WS Gateway Node 2]
    WS1 <--> RedisBus{Redis PubSub / Kafka}
    WS2 <--> RedisBus
    WS1 --> MsgDB[(Cassandra Message Store)]
    end"""
    },
    {
        "id": "rate_limiter_layer",
        "name": "Distributed Rate Limiter",
        "description": "Token Bucket algorithm executed via Redis Lua script",
        "snippet": """    subgraph Protection [Rate Limiting Layer]
    IncomingReq([Incoming Request]) --> Limiter[Rate Limiter Middleware]
    Limiter -->|Eval Token Bucket| RedisRL[(Redis RedisCell / Lua Script)]
    Limiter -->|Allow| Downstream[Internal Microservice]
    Limiter -->|Deny 429| Drop([429 Too Many Requests])
    end"""
    }
]

DEFAULT_SYSTEM_DIAGRAMS = {
    "IUrQ5_g3XKs": {
        "title": "YouTube Video Streaming & Ingestion Architecture (Ex-Meta Staff)",
        "topic_slug": "youtube-streaming",
        "diagram_type": "flowchart",
        "mermaid_code": """flowchart TD
    subgraph Upload_Flow [1. Video Ingestion Pipeline]
        Creator([Creator Client]) -->|1. Chunked Upload / tus.io| IngestGW[Upload API Gateway]
        IngestGW -->|2. Raw Video Chunks| RawS3[(Raw Upload S3 Bucket)]
        IngestGW -->|3. Publish UploadComplete| TaskQueue{Kafka Video Tasks}
        TaskQueue --> Transcoder[Transcoding Worker Pool]
        Transcoder -->|Fetch Raw| RawS3
        Transcoder -->|Generate 1080p, 720p, 480p, HLS/DASH| EncodedS3[(Processed S3 Bucket)]
        Transcoder -->|Write Metadata & Manifest| MetaDB[(Vitess / Spanner Cluster)]
    end

    subgraph CDN_Streaming_Flow [2. Global Video Playback]
        Viewer([Viewer Mobile / Web]) -->|1. Fetch Manifest / MPD| PlaybackAPI[Playback Meta Service]
        PlaybackAPI --> MetaDB
        Viewer -->|2. Stream Video Segments .ts / .m4s| EdgeCDN[Global Edge CDN Cloudflare/Akamai]
        EdgeCDN -->|Cache Miss: Fetch from Origin| EncodedS3
    end

    subgraph Recommendation_Engine [3. Feed & Search]
        Viewer -->|Get Feed| FeedService[Feed Aggregator]
        FeedService --> UserCache[(Redis User Feed Cache)]
        FeedService --> RecModel[ML Candidate Generation & Ranking]
    end

    classDef primary fill:#2563eb,stroke:#1d4ed8,color:#fff;
    classDef storage fill:#059669,stroke:#047857,color:#fff;
    classDef edge fill:#d97706,stroke:#b45309,color:#fff;
    class IngestGW,Transcoder,PlaybackAPI,FeedService primary;
    class RawS3,EncodedS3,MetaDB,UserCache storage;
    class EdgeCDN,Viewer,Creator edge;"""
    },
    "whatsapp-chat": {
        "title": "WhatsApp / Real-Time Distributed Chat Architecture",
        "topic_slug": "whatsapp-chat",
        "diagram_type": "flowchart",
        "mermaid_code": """flowchart TD
    subgraph Clients [Clients & Edge]
        Sender([Sender App])
        Receiver([Receiver App])
    end

    subgraph Gateway_Tier [Stateful Connection Tier]
        LB[Network Load Balancer]
        WS1[Chat Server Node 1: WebSockets / Epoll]
        WS2[Chat Server Node 2: WebSockets / Epoll]
    end

    subgraph Presence_Routing [Routing & Presence Engine]
        SessionStore[(Redis Session Table: UserID -> NodeID)]
        PubSubCluster{Kafka / Redis PubSub Routing Bus}
    end

    subgraph Persistence [Data Tier]
        MsgService[Message Ingestion Service]
        Cassandra[(ScyllaDB / Cassandra Wide-Column Store)]
        PushService[Apple APNS / Google FCM Gateway]
    end

    Sender -->|TLS Persistent TCP/WSS| LB
    LB --> WS1
    WS1 -->|Query Receiver Node| SessionStore
    WS1 -->|Async Archive Message| MsgService
    MsgService --> Cassandra
    WS1 -->|Publish to Receiver Queue| PubSubCluster
    PubSubCluster -->|Deliver to active connection| WS2
    WS2 -->|Deliver message| Receiver
    SessionStore -.->|Receiver Offline? Trigger Push| PushService
    PushService -.-> Receiver"""
    },
    "uber-ride-sharing": {
        "title": "Uber / Ride Sharing Real-Time Dispatch System",
        "topic_slug": "uber-ride-sharing",
        "diagram_type": "flowchart",
        "mermaid_code": """flowchart TD
    subgraph Drivers [Supply Side: Drivers]
        DriverApp([Driver App]) -->|Location Ping every 4s| IngestLB[NLB]
        IngestLB --> LocGW[Driver Location Service]
    end

    subgraph Spatial_Index [Real-Time Spatial Memory Tier]
        LocGW --> RedisGeo[(Redis Cluster / Uber H3 Hexagonal Grid)]
        LocGW --> KafkaLoc{Kafka Driver Location Stream}
    end

    subgraph Riders [Demand Side: Riders]
        RiderApp([Rider App]) -->|Request Ride: Pickup/Dropoff| ReqGW[Trip Management Service]
    end

    subgraph Matching_Engine [Dynamic Matching & Pricing]
        ReqGW --> DispatchEngine[Dispatch & Match Engine]
        DispatchEngine -->|Query Radius Hexagons H3| RedisGeo
        DispatchEngine --> SurgePricing[Surge Pricing ML Service]
        DispatchEngine -->|Offer Ride| DriverApp
    end

    subgraph Ledger_DB [Trip Ledger & Auditing]
        ReqGW --> TripDB[(PostgreSQL / CockroachDB)]
    end"""
    }
}
