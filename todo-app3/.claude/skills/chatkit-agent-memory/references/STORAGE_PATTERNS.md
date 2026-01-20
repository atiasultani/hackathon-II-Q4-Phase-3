# Storage Patterns Reference

## In-Memory Storage

### Redis Implementation
```python
import redis
import json
from typing import Dict, Any, Optional

class RedisMemoryStore:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis_client = redis.Redis(host=host, port=port, db=db)

    def save_memory(self, session_id: str, data: Dict[str, Any], ttl: int = 3600):
        """Save memory data with TTL"""
        self.redis_client.setex(
            f"memory:{session_id}",
            ttl,
            json.dumps(data)
        )

    def get_memory(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve memory data"""
        data = self.redis_client.get(f"memory:{session_id}")
        return json.loads(data) if data else None

    def delete_memory(self, session_id: str):
        """Delete memory entry"""
        self.redis_client.delete(f"memory:{session_id}")
```

### Memory-Only Implementation
```python
from typing import Dict, Any, Optional
from collections import OrderedDict

class InMemoryStore:
    def __init__(self, max_size: int = 1000):
        self.store = OrderedDict()
        self.max_size = max_size

    def save_memory(self, session_id: str, data: Dict[str, Any]):
        """Save memory data with LRU eviction"""
        if len(self.store) >= self.max_size:
            # Remove oldest entry (LRU)
            self.store.popitem(last=False)

        self.store[session_id] = data

    def get_memory(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve memory data"""
        return self.store.get(session_id)

    def delete_memory(self, session_id: str):
        """Delete memory entry"""
        self.store.pop(session_id, None)
```

## Database Storage

### PostgreSQL Implementation
```python
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from typing import Dict, Any, Optional

class PostgreSQLMemoryStore:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    def _get_connection(self):
        return psycopg2.connect(self.connection_string)

    def save_memory(self, session_id: str, data: Dict[str, Any], ttl_minutes: int = 60):
        """Save memory data with TTL"""
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO agent_memory (session_id, data, created_at, expires_at)
                    VALUES (%s, %s, NOW(), NOW() + INTERVAL '%s minutes')
                    ON CONFLICT (session_id)
                    DO UPDATE SET data = EXCLUDED.data, created_at = EXCLUDED.created_at, expires_at = EXCLUDED.expires_at
                """, (session_id, json.dumps(data), ttl_minutes))
            conn.commit()
        finally:
            conn.close()

    def get_memory(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve memory data if not expired"""
        conn = self._get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT data FROM agent_memory
                    WHERE session_id = %s AND expires_at > NOW()
                """, (session_id,))
                result = cursor.fetchone()
                return result['data'] if result else None
        finally:
            conn.close()
```

## File-Based Storage

### JSON File Implementation
```python
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

class FileMemoryStore:
    def __init__(self, storage_dir: str = "./memory_store"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)

    def save_memory(self, session_id: str, data: Dict[str, Any]):
        """Save memory data to JSON file"""
        file_path = self.storage_dir / f"{session_id}.json"
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def get_memory(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve memory data from JSON file"""
        file_path = self.storage_dir / f"{session_id}.json"
        if file_path.exists():
            with open(file_path, 'r') as f:
                return json.load(f)
        return None

    def delete_memory(self, session_id: str):
        """Delete memory file"""
        file_path = self.storage_dir / f"{session_id}.json"
        if file_path.exists():
            file_path.unlink()
```

## Hybrid Storage Approach

### Fallback Chain Implementation
```python
from typing import Dict, Any, Optional

class HybridMemoryStore:
    def __init__(self, primary_store, fallback_store):
        self.primary_store = primary_store
        self.fallback_store = fallback_store

    def save_memory(self, session_id: str, data: Dict[str, Any], **kwargs):
        """Save to primary, fallback to secondary if primary fails"""
        try:
            self.primary_store.save_memory(session_id, data, **kwargs)
        except Exception:
            # Log the error and try fallback
            self.fallback_store.save_memory(session_id, data, **kwargs)

    def get_memory(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Try primary first, then fallback"""
        result = self.primary_store.get_memory(session_id)
        if result is None:
            result = self.fallback_store.get_memory(session_id)
        return result

    def delete_memory(self, session_id: str):
        """Delete from both stores"""
        self.primary_store.delete_memory(session_id)
        self.fallback_store.delete_memory(session_id)
```