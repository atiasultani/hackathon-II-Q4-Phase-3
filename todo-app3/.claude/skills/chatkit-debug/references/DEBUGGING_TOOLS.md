# Debugging Tools Reference

## Server-Side Debugging

### Python Debugging
```python
import pdb
import logging
from functools import wraps

def debug_trace(func):
    """Decorator to add debugging trace to functions"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        logging.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        logging.debug(f"{func.__name__} returned {result}")
        return result
    return wrapper

# Usage
@debug_trace
def process_message(message_data):
    # Process message logic
    return processed_result
```

### Node.js Debugging
```javascript
// Enable inspector for Node.js
// node --inspect-brk app.js

const util = require('util');
const debugLog = require('debug')('chatkit:debug');

// Detailed object inspection
function inspectObject(obj, label = '') {
    console.log(`${label}: ${util.inspect(obj, { depth: null, colors: true })}`);
}

// Performance timing
function timeFunction(fn, ...args) {
    const start = process.hrtime.bigint();
    const result = fn.apply(this, args);
    const end = process.hrtime.bigint();
    console.log(`Function took ${(end - start) / 1000000n}ms`);
    return result;
}
```

## Database Debugging

### PostgreSQL Query Analysis
```sql
-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE conversation_id = 'uuid-value'
ORDER BY created_at DESC LIMIT 20;

-- Show current active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check for deadlocks
SELECT * FROM pg_stat_activity WHERE state = 'active' AND wait_event_type IS NOT NULL;
```

### MongoDB Debugging
```javascript
// Enable query profiling temporarily
db.setProfilingLevel(2, {slowms: 100});

// Analyze slow queries
db.system.profile.find().sort({ts: -1}).limit(5);

// Explain query execution
db.messages.find({
    conversation_id: ObjectId("..."),
    created_at: {$gte: ISODate("...")}
}).explain("executionStats");
```

## Network Debugging

### WebSocket Connection Debugging
```javascript
// Client-side WebSocket debugging
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
    console.log('WebSocket connected');
    // Send ping to test connection
    ws.send(JSON.stringify({type: 'ping'}));
};

ws.onmessage = (event) => {
    console.log('Received:', event.data);
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
};
```

### HTTP Request Debugging
```bash
# Using curl for detailed request/response analysis
curl -v -H "Authorization: Bearer token" \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}' \
     http://localhost:3000/api/messages

# Using httpie for pretty-printed output
http --headers --verbose POST :3000/api/messages \
     Authorization:"Bearer token" \
     message="test message"

# HTTP request with timing info
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/messages
```

curl-format.txt:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## Performance Profiling

### Python Profiling
```python
import cProfile
import pstats
from pstats import SortKey

def profile_function():
    profiler = cProfile.Profile()
    profiler.enable()

    # Code to profile
    result = your_function()

    profiler.disable()

    stats = pstats.Stats(profiler)
    stats.sort_stats(SortKey.TIME)
    stats.print_stats(10)  # Top 10 time-consuming functions

    return result

# Memory profiling with memory_profiler
from memory_profiler import profile

@profile
def memory_intensive_function():
    # Function that uses lots of memory
    large_list = [i for i in range(1000000)]
    return sum(large_list)
```

### Node.js Profiling
```bash
# CPU profiling
node --prof app.js
node --prof-process isolate-*.log

# Heap profiling
node --inspect app.js
# Then connect Chrome DevTools to profile memory

# Async hooks for tracking async operations
node --async-hooks app.js
```

## Log Analysis Tools

### Log Parsing with Python
```python
import re
from datetime import datetime
from collections import Counter

def parse_chatkit_logs(log_file_path):
    """Parse ChatKit application logs"""
    log_pattern = r'(?P<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z)\s+(?P<level>\w+)\s+(?P<message>.*)'

    with open(log_file_path, 'r') as f:
        logs = f.readlines()

    parsed_logs = []
    for log_line in logs:
        match = re.match(log_pattern, log_line.strip())
        if match:
            parsed_logs.append(match.groupdict())

    return parsed_logs

def analyze_error_frequency(parsed_logs):
    """Analyze error frequency by type"""
    errors = [log for log in parsed_logs if log['level'] == 'ERROR']
    error_messages = [log['message'] for log in errors]

    error_counts = Counter(error_messages)
    return error_counts.most_common(10)
```

### Real-time Log Monitoring
```bash
# Tail logs with filtering
tail -f /var/log/chatkit/app.log | grep -E "(ERROR|WARN)"

# Monitor specific user activity
tail -f /var/log/chatkit/app.log | grep "user_id=12345"

# Count requests per minute
tail -f /var/log/chatkit/access.log | awk '{print $4}' | cut -d: -f1,2,3 | uniq -c

# Monitor WebSocket connections
tail -f /var/log/chatkit/app.log | grep -E "(websocket|connection|disconnect)"
```

## Diagnostic Scripts

### Health Check Script
```python
#!/usr/bin/env python3
"""
ChatKit Health Check Script
"""

import requests
import socket
import time
from datetime import datetime

def check_api_health(base_url):
    """Check API endpoint health"""
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def check_database_connection():
    """Check database connectivity"""
    import psycopg2
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="chatkit",
            user="user",
            password="password"
        )
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return result[0] == 1
    except:
        return False

def check_websocket_connection(ws_url):
    """Check WebSocket connection"""
    try:
        import websocket
        ws = websocket.WebSocket()
        ws.connect(ws_url)
        ws.send('{"type":"ping"}')
        response = ws.recv()
        ws.close()
        return True
    except:
        return False

def run_diagnostics():
    """Run comprehensive diagnostics"""
    print(f"Diagnostics started at {datetime.now()}")

    checks = {
        "API Endpoint": check_api_health("http://localhost:3000"),
        "Database Connection": check_database_connection(),
        "WebSocket Service": check_websocket_connection("ws://localhost:8080/ws")
    }

    for check_name, result in checks.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{check_name}: {status}")

if __name__ == "__main__":
    run_diagnostics()
```