# Performance Tuning Reference

## Memory Performance Optimization

### Configuration Parameters

#### Redis Configuration
```conf
# Redis configuration for optimal ChatKit memory performance
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 60
timeout 300
save 900 1 300 10 60 10000
```

#### PostgreSQL Configuration
```conf
# PostgreSQL configuration for memory storage
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

### Performance Monitoring

#### Key Metrics to Monitor
- Memory utilization percentage
- Request response times
- Cache hit ratio
- Database query performance
- Connection pool usage

#### Monitoring Commands

##### Redis Performance
```bash
# Monitor Redis performance
redis-cli --stat

# Check memory usage
redis-cli info memory

# Monitor commands per second
redis-cli --intrinsic-latency 100
```

##### PostgreSQL Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename,
       ROUND(CASE WHEN otta=0 THEN 0.0 ELSE table_bloat.relsize::FLOAT/otta END, 1) AS bloat_ratio
FROM table_bloat
JOIN pg_stat_user_tables USING (schemaname, tablename)
WHERE table_bloat.relsize > 500000000  -- Larger than 500MB
ORDER BY bloat_ratio DESC;
```

### Optimization Strategies

#### Memory Management
1. **Implement sliding window contexts** - Keep only the most recent N messages in active memory
2. **Use compression for large contexts** - Compress historical conversations
3. **Tier memory by importance** - Keep important context in fast storage
4. **Implement automatic cleanup** - Remove expired or unused memory entries

#### Caching Optimization
```python
# Example of optimized caching strategy
from functools import lru_cache
import time

class OptimizedMemoryCache:
    def __init__(self, max_size=1000, ttl=3600):
        self.max_size = max_size
        self.ttl = ttl
        self.cache = {}
        self.access_times = {}

    def get(self, key):
        if key in self.cache:
            current_time = time.time()
            if current_time - self.access_times[key] < self.ttl:
                # Update access time for LRU
                self.access_times[key] = current_time
                return self.cache[key]
            else:
                # Expired, remove from cache
                del self.cache[key]
                del self.access_times[key]
        return None

    def set(self, key, value):
        if len(self.cache) >= self.max_size:
            # Remove least recently used item
            oldest_key = min(self.access_times, key=self.access_times.get)
            del self.cache[oldest_key]
            del self.access_times[oldest_key]

        current_time = time.time()
        self.cache[key] = value
        self.access_times[key] = current_time
```

#### Database Query Optimization
```sql
-- Optimized queries for memory retrieval
-- Index on conversation_id and timestamp for fast message retrieval
CREATE INDEX CONCURRENTLY idx_messages_conv_time ON messages(conversation_id, created_at DESC);

-- Partial index for active conversations only
CREATE INDEX CONCURRENTLY idx_conversations_active ON conversations(created_at DESC)
WHERE deleted_at IS NULL;

-- Composite index for message status queries
CREATE INDEX CONCURRENTLY idx_message_status_user ON message_status(user_id, status, timestamp DESC);
```

### Performance Benchmarks

#### Baseline Performance Targets
- Memory read: < 5ms average
- Memory write: < 10ms average
- Cache hit ratio: > 90%
- Memory utilization: < 80%

#### Stress Testing
```bash
# Example stress test commands
# Test concurrent memory access
ab -n 10000 -c 100 -H "Authorization: Bearer token" \
   http://localhost:3000/api/memory/context/session-123

# Monitor during stress test
watch -n 1 'redis-cli info stats | grep instantaneous_ops_per_sec'
```

### Scaling Recommendations

#### Horizontal Scaling
1. **Shard memory storage** by user or conversation ID
2. **Load balance requests** across multiple memory servers
3. **Implement distributed caching** with consistent hashing

#### Vertical Scaling
1. **Increase memory allocation** for cache tiers
2. **Upgrade storage** to faster SSD drives
3. **Add more compute resources** for processing

### Troubleshooting Performance Issues

#### Slow Response Times
1. Check database query performance
2. Verify cache hit ratios
3. Monitor memory usage
4. Review network latency

#### High Memory Usage
1. Adjust TTL settings for memory entries
2. Implement more aggressive cleanup
3. Review data retention policies
4. Optimize data serialization

#### Connection Pool Exhaustion
1. Increase connection pool size
2. Optimize connection reuse
3. Check for connection leaks
4. Implement circuit breaker patterns