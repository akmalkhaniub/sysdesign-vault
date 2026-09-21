"""
Flashcard Seed Data for Spaced Repetition (SuperMemo-2) System Design Mastery
"""

SEED_FLASHCARDS = [
    {
        "category": "Latency Numbers",
        "topic_slug": "system-design-fundamentals",
        "front": "What is the approximate latency comparison between L1 Cache, RAM, NVMe SSD, and Datacenter Network Roundtrip?",
        "back": "• L1 Cache reference: ~0.5 - 1 ns\\n• Main Memory (RAM): ~100 ns (~100x slower than L1)\\n• NVMe SSD Random Read: ~10 - 50 µs (microseconds) (~100-500x slower than RAM)\\n• Round trip in same Datacenter: ~500 µs (0.5 ms)\\n• Cross-continent WAN (e.g. SF to NYC / London): ~50 - 150 ms",
        "explanation": "Memorizing these order-of-magnitude steps is essential during estimation: RAM is measured in nanoseconds, SSD in tens of microseconds, local network in hundreds of microseconds, and WAN in tens/hundreds of milliseconds."
    },
    {
        "category": "Capacity Math",
        "topic_slug": "system-design-fundamentals",
        "front": "How do you quickly estimate Average QPS from Daily Active Requests?",
        "back": "Formula: QPS = Total Requests per Day / 86,400 (approx. 100,000).\\n• 1 Million requests/day ≈ 12 QPS\\n• 10 Million requests/day ≈ 120 QPS\\n• 100 Million requests/day ≈ 1,200 QPS\\n• 1 Billion requests/day ≈ 12,000 QPS\\n\\nPeak QPS: Typically 2x to 5x of Average QPS (e.g. 100M req/day -> ~2,500 - 6,000 Peak QPS).",
        "explanation": "Rounding 86,400 seconds to 10^5 (100k) simplifies mental math in under 5 seconds during an interview."
    },
    {
        "category": "Capacity Math",
        "topic_slug": "system-design-fundamentals",
        "front": "How do you estimate storage requirements for 100M daily active users writing 200 KB per day for 5 years?",
        "back": "Daily write: 100,000,000 * 200 KB = 20,000,000,000 KB = 20,000,000 MB = 20,000 GB = 20 TB / day.\\n\\n5-Year Storage: 20 TB * 365 * 5 ≈ 20 TB * 1,825 ≈ 36.5 Petabytes.\\n\\nWith 3x Replication factor: ~110 Petabytes total raw disk capacity required.",
        "explanation": "Always account for replication factor (typically 3x in distributed storage) and index overhead (+20-30%)."
    },
    {
        "category": "Caching Patterns",
        "topic_slug": "caching",
        "front": "What is the difference between Cache-Aside, Write-Through, and Write-Behind (Write-Back)?",
        "back": "1. Cache-Aside (Lazy Loading): Application code reads from cache; on miss, reads from DB and populates cache. Writes go directly to DB, and cache entry is invalidated.\\n2. Write-Through: Application writes to cache; cache synchronously writes to DB before returning success (consistent, higher write latency).\\n3. Write-Behind (Write-Back): Application writes to cache and returns immediately. Cache asynchronously batches writes to DB (ultra-fast writes, risk of data loss if cache crashes).",
        "explanation": "Cache-Aside is the default for most web architectures because cache failure does not crash the database write path."
    },
    {
        "category": "Distributed Systems",
        "topic_slug": "distributed-systems",
        "front": "What problem does Consistent Hashing solve, and why are Virtual Nodes necessary?",
        "back": "Consistent Hashing maps both servers and data keys to a 360° ring. When a server node is added or removed, only k/N keys need to be remapped (where k = total keys, N = number of nodes), rather than all keys as in `hash(key) % N`.\\n\\nVirtual Nodes: Real physical servers are assigned multiple points (virtual nodes) across the ring. This prevents hotspots and ensures uniform key distribution even with heterogeneous hardware.",
        "explanation": "Without virtual nodes, non-uniform hash distribution leads to severe cascading failures if one node inherits an oversized partition."
    },
    {
        "category": "Databases & Storage",
        "topic_slug": "storage",
        "front": "When should you choose a Wide-Column Store (Cassandra/ScyllaDB) over a Relational DB (PostgreSQL)?",
        "back": "Choose Cassandra/ScyllaDB when:\\n• Massive write throughput (LSM-tree appends without in-place updates)\\n• Predictable query patterns known in advance (queries filter strictly by partition key + clustering key)\\n• Linear horizontal scalability across datacenters without master bottleneck\\n• You do NOT need complex JOINs, foreign keys, or multi-table ACID transactions.",
        "explanation": "Cassandra models data around queries, not around entity relationships."
    },
    {
        "category": "Message Streaming",
        "topic_slug": "event-driven",
        "front": "How does Apache Kafka guarantee message ordering, and what causes out-of-order delivery?",
        "back": "Ordering Guarantee: Kafka guarantees strict total ordering ONLY within a single partition of a topic.\\n\\nKeys: Messages with the same partition key (e.g. `user_id` or `order_id`) are always routed to the same partition and consumed in order.\\n\\nOut-of-order causes: If consumer retries fail without idempotent producer (`enable.idempotence=true`) or `max.in.flight.requests.per.connection > 1`, retried batches can arrive out of order.",
        "explanation": "If global order is required, you must use a single partition, which limits consumer throughput to a single worker thread."
    },
    {
        "category": "Resiliency & Fault Tolerance",
        "topic_slug": "resiliency",
        "front": "What are the 3 states of a Circuit Breaker, and how does it prevent cascading service failure?",
        "back": "1. Closed: Normal operation. Requests flow to downstream service. Failure count is monitored.\\n2. Open: Error rate exceeds threshold (e.g., >50% errors). Requests immediately fail fast with fallback response without hitting downstream service (allowing it to recover).\\n3. Half-Open: After a cooldown timeout (e.g., 30s), a trial batch of requests is allowed through. If successful, breaker transitions back to Closed; if it fails, reverts to Open.",
        "explanation": "Circuit breakers protect against thread pool exhaustion and resource saturation across cascading microservices."
    }
]
