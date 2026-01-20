# Caching Strategies Reference

## Cache Layers

### Application-Level Caching

#### Redis Implementation
```python
import redis
import json
import pickle
from typing import Any, Optional, Union
from datetime import timedelta
import hashlib

class RedisCache:
    def __init__(self, host='localhost', port=6379, db=0, password=None):
        self.client = redis.Redis(host=host, port=port, db=db, password=password, decode_responses=False)

    def _make_key(self, key: str) -> str:
        """Create a prefixed key to avoid collisions"""
        return f"chatkit:{key}"

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        cached_value = self.client.get(self._make_key(key))
        if cached_value:
            try:
                return pickle.loads(cached_value)
            except:
                # Try JSON decoding for simpler objects
                try:
                    return json.loads(cached_value.decode('utf-8'))
                except:
                    return cached_value
        return None

    def set(self, key: str, value: Any, ttl: Union[int, timedelta] = 3600):
        """Set value in cache with TTL"""
        serialized_value = pickle.dumps(value)
        if isinstance(ttl, timedelta):
            ttl = int(ttl.total_seconds())

        self.client.setex(self._make_key(key), ttl, serialized_value)

    def delete(self, key: str):
        """Delete key from cache"""
        self.client.delete(self._make_key(key))

    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        return bool(self.client.exists(self._make_key(key)))

    def invalidate_pattern(self, pattern: str):
        """Delete keys matching pattern"""
        full_pattern = self._make_key(pattern)
        keys = self.client.keys(full_pattern)
        if keys:
            self.client.delete(*keys)

# Usage example
cache = RedisCache()

# Cache user data
def get_user_with_cache(user_id: str):
    cache_key = f"user:{user_id}"
    user_data = cache.get(cache_key)

    if user_data is None:
        # Fetch from database
        user_data = fetch_user_from_db(user_id)
        # Cache for 1 hour
        cache.set(cache_key, user_data, ttl=3600)

    return user_data
```

#### In-Memory Cache
```python
from typing import Any, Optional, Dict
from collections import OrderedDict
from datetime import datetime, timedelta
import threading

class InMemoryCache:
    def __init__(self, max_size: int = 1000):
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.max_size = max_size
        self.lock = threading.RLock()

    def get(self, key: str) -> Optional[Any]:
        with self.lock:
            if key not in self.cache:
                return None

            item = self.cache[key]

            # Check if expired
            if item['expires_at'] and item['expires_at'] < datetime.now():
                del self.cache[key]
                return None

            # Move to end (LRU)
            self.cache.move_to_end(key)
            return item['value']

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        with self.lock:
            expires_at = None
            if ttl:
                expires_at = datetime.now() + timedelta(seconds=ttl)

            self.cache[key] = {
                'value': value,
                'expires_at': expires_at
            }

            # Handle size limit
            if len(self.cache) > self.max_size:
                # Remove oldest item
                self.cache.popitem(last=False)

    def delete(self, key: str):
        with self.lock:
            self.cache.pop(key, None)

    def clear_expired(self):
        with self.lock:
            now = datetime.now()
            expired_keys = [
                key for key, item in self.cache.items()
                if item['expires_at'] and item['expires_at'] < now
            ]
            for key in expired_keys:
                del self.cache[key]

# Usage
memory_cache = InMemoryCache(max_size=500)
```

## Cache Strategies

### Cache-Aside Pattern
```python
def get_user_profile(user_id: str) -> dict:
    # Try cache first
    cache_key = f"user_profile:{user_id}"
    profile = cache.get(cache_key)

    if profile is None:
        # Cache miss - load from database
        profile = database.fetch_user_profile(user_id)

        if profile:
            # Put in cache for next time
            cache.set(cache_key, profile, ttl=1800)  # 30 minutes

    return profile

def update_user_profile(user_id: str, profile_data: dict):
    # Update database
    database.update_user_profile(user_id, profile_data)

    # Invalidate cache
    cache.delete(f"user_profile:{user_id}")
```

### Write-Through Pattern
```python
class WriteThroughCache:
    def __init__(self, cache_backend, storage_backend):
        self.cache = cache_backend
        self.storage = storage_backend

    def set(self, key: str, value: Any, ttl: int = 3600):
        # Write to storage first
        self.storage.set(key, value)
        # Then to cache
        self.cache.set(key, value, ttl)

    def get(self, key: str) -> Optional[Any]:
        # Try cache first
        value = self.cache.get(key)
        if value is None:
            # Load from storage and populate cache
            value = self.storage.get(key)
            if value is not None:
                self.cache.set(key, value)
        return value

    def update(self, key: str, value: Any):
        # Update both simultaneously
        self.storage.set(key, value)
        self.cache.set(key, value)  # Refresh cache with new value
```

### Cache Warming
```python
def warm_user_cache():
    """Pre-populate cache with frequently accessed users"""
    # Get top 100 most active users
    active_users = database.get_most_active_users(limit=100)

    for user in active_users:
        cache_key = f"user:{user['id']}"
        cache.set(cache_key, user, ttl=7200)  # 2 hours

def warm_conversation_cache():
    """Pre-populate cache with recent conversations"""
    recent_convs = database.get_recent_conversations(hours=24)

    for conv in recent_convs:
        cache_key = f"conversation:{conv['id']}"
        cache.set(cache_key, conv, ttl=1800)  # 30 minutes

        # Also cache participants
        participants = database.get_conversation_participants(conv['id'])
        participants_key = f"conversation_participants:{conv['id']}"
        cache.set(participants_key, participants, ttl=1800)
```

## Cache Invalidation Strategies

### Time-Based Invalidation
```python
from enum import Enum

class CacheStrategy(Enum):
    SHORT_LIVED = 300      # 5 minutes
    MEDIUM_LIVED = 1800    # 30 minutes
    LONG_LIVED = 7200      # 2 hours
    SESSION_LIVED = 0      # Until session ends

def get_cached_data(key: str, strategy: CacheStrategy, fetch_func):
    """Generic caching with strategy-based TTL"""
    ttl = strategy.value if strategy != CacheStrategy.SESSION_LIVED else 3600

    cached_data = cache.get(key)
    if cached_data is None:
        cached_data = fetch_func()
        if cached_data:
            cache.set(key, cached_data, ttl=ttl)

    return cached_data

# Usage
def get_frequently_changed_data(user_id: str):
    return get_cached_data(
        f"frequent_data:{user_id}",
        CacheStrategy.SHORT_LIVED,
        lambda: database.get_user_settings(user_id)
    )
```

### Event-Driven Invalidation
```python
class CacheInvalidator:
    def __init__(self, cache_backend):
        self.cache = cache_backend

    def invalidate_user_related_caches(self, user_id: str):
        """Invalidate all caches related to a user"""
        patterns_to_invalidate = [
            f"user:{user_id}",
            f"user_profile:{user_id}",
            f"user_conversations:{user_id}",
            f"user_settings:{user_id}",
            f"unread_count:{user_id}"
        ]

        for pattern in patterns_to_invalidate:
            self.cache.delete(pattern)

    def invalidate_conversation_caches(self, conversation_id: str):
        """Invalidate all caches related to a conversation"""
        patterns_to_invalidate = [
            f"conversation:{conversation_id}",
            f"conversation_participants:{conversation_id}",
            f"conversation_messages:{conversation_id}*",
            f"conversation_meta:{conversation_id}"
        ]

        for pattern in patterns_to_invalidate:
            self.cache.delete(pattern)

    def bulk_invalidate_on_update(self, entity_type: str, entity_id: str):
        """Centralized invalidation based on entity type"""
        if entity_type == 'user':
            self.invalidate_user_related_caches(entity_id)
        elif entity_type == 'conversation':
            self.invalidate_conversation_caches(entity_id)
        elif entity_type == 'message':
            # Invalidate conversation message cache
            self.cache.delete(f"conversation_messages:*")

# Usage in service layer
invalidator = CacheInvalidator(cache)

def update_user_profile(user_id: str, profile_data: dict):
    # Update in database
    database.update_user_profile(user_id, profile_data)

    # Invalidate related caches
    invalidator.invalidate_user_related_caches(user_id)
```

## Distributed Caching

### Multi-Level Cache Hierarchy
```python
class MultiLevelCache:
    def __init__(self):
        self.l1_cache = InMemoryCache(max_size=100)  # L1: Fastest, smallest
        self.l2_cache = RedisCache()                 # L2: Slower, larger
        self.l3_cache = DatabaseCache()              # L3: Slowest, persistent

    def get(self, key: str):
        # Check L1 first
        value = self.l1_cache.get(key)
        if value is not None:
            return value

        # Check L2
        value = self.l2_cache.get(key)
        if value is not None:
            # Populate L1
            self.l1_cache.set(key, value, ttl=300)  # Short TTL for L1
            return value

        # Check L3
        value = self.l3_cache.get(key)
        if value is not None:
            # Populate both L1 and L2
            self.l2_cache.set(key, value, ttl=1800)  # Medium TTL for L2
            self.l1_cache.set(key, value, ttl=300)   # Short TTL for L1
            return value

        return None

    def set(self, key: str, value: Any, ttl: int = 3600):
        # Set in all levels
        self.l1_cache.set(key, value, ttl=min(ttl, 300))   # Cap L1 TTL
        self.l2_cache.set(key, value, ttl)
        self.l3_cache.set(key, value, ttl)

# Usage
multi_cache = MultiLevelCache()
```

## Cache Performance Monitoring

### Cache Metrics Collection
```python
import time
from collections import defaultdict
from threading import Lock

class CacheMetrics:
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.errors = 0
        self.lock = Lock()
        self.operation_times = []

    def record_hit(self):
        with self.lock:
            self.hits += 1

    def record_miss(self):
        with self.lock:
            self.misses += 1

    def record_error(self):
        with self.lock:
            self.errors += 1

    def record_operation_time(self, time_ms: float):
        with self.lock:
            self.operation_times.append(time_ms)
            # Keep only last 1000 measurements
            if len(self.operation_times) > 1000:
                self.operation_times = self.operation_times[-1000:]

    def get_stats(self):
        with self.lock:
            total_requests = self.hits + self.misses
            hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
            avg_time = sum(self.operation_times) / len(self.operation_times) if self.operation_times else 0

            return {
                'hit_rate': hit_rate,
                'total_requests': total_requests,
                'hits': self.hits,
                'misses': self.misses,
                'errors': self.errors,
                'avg_response_time_ms': avg_time
            }

# Decorator for cache operations with metrics
metrics = CacheMetrics()

def monitored_cache_operation(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            if result is None:
                metrics.record_miss()
            else:
                metrics.record_hit()
            return result
        except Exception:
            metrics.record_error()
            raise
        finally:
            elapsed = (time.time() - start_time) * 1000
            metrics.record_operation_time(elapsed)
    return wrapper
```