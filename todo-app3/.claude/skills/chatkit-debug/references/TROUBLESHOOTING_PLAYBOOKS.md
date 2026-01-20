# Troubleshooting Playbooks Reference

## Systematic Troubleshooting Approaches

### The 5 Whys Technique for Root Cause Analysis

When encountering an issue, ask "Why?" five times to get to the root cause:

1. **Problem**: Users can't send messages
2. **Why 1**: API returns 500 error
3. **Why 2**: Database query fails
4. **Why 3**: Index is missing
5. **Why 4**: Migration wasn't applied
6. **Why 5**: CI/CD pipeline skipped migration step

### Issue Classification Matrix

| Priority | Symptoms | Immediate Actions |
|----------|----------|------------------|
| Critical | Complete service outage | 1. Rollback recent changes<br>2. Switch to backup system<br>3. Notify stakeholders |
| High | Major feature broken | 1. Isolate affected components<br>2. Implement temporary workaround<br>3. Deploy hotfix |
| Medium | Minor functionality impaired | 1. Gather detailed logs<br>2. Reproduce issue<br>3. Plan permanent fix |
| Low | Minor inconvenience | 1. Document issue<br>2. Schedule for next sprint<br>3. Monitor for escalation |

## Common Issue Playbooks

### Database Performance Issues

#### Symptoms
- Slow API responses
- High database CPU usage
- Connection timeouts
- Query timeouts

#### Diagnostic Steps
1. **Check database metrics**
   ```bash
   # PostgreSQL
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   ```

2. **Identify slow queries**
   ```bash
   # Enable query logging temporarily
   SET log_min_duration_statement = 100;  # Log queries taking > 100ms
   ```

3. **Check for locks**
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active' AND wait_event_type IS NOT NULL;
   ```

4. **Review indexes**
   ```sql
   SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
   FROM pg_statio_user_indexes
   WHERE idx_scan < 10;  -- Rarely used indexes
   ```

#### Resolution Actions
- Add missing indexes
- Optimize slow queries
- Increase connection pool size
- Scale database resources
- Implement query caching

### WebSocket Connection Issues

#### Symptoms
- Users getting disconnected frequently
- Messages not being received in real-time
- High connection failure rate
- Ping/pong failures

#### Diagnostic Steps
1. **Check WebSocket logs**
   ```bash
   tail -f /var/log/chatkit/websocket.log | grep -E "(disconnect|error|failed)"
   ```

2. **Monitor connection metrics**
   ```bash
   # Count active connections
   ss -s | grep websocket

   # Check for port exhaustion
   netstat -an | grep :8080 | wc -l
   ```

3. **Test connection from client**
   ```javascript
   const ws = new WebSocket('ws://localhost:8080/ws');

   ws.onopen = () => console.log('Connected');
   ws.onerror = (err) => console.error('Error:', err);
   ws.onclose = (event) => console.log('Closed:', event.code, event.reason);
   ```

4. **Check server resources**
   ```bash
   # Memory usage
   free -h

   # Process limits
   ulimit -n  # File descriptor limit
   ```

#### Resolution Actions
- Increase file descriptor limits
- Optimize heartbeat intervals
- Implement proper reconnection logic
- Scale WebSocket server instances
- Check firewall/load balancer settings

### Authentication Failures

#### Symptoms
- Users unable to log in
- Invalid token errors
- Session timeouts
- OAuth failures

#### Diagnostic Steps
1. **Check authentication logs**
   ```bash
   grep -i "auth\|login\|token" /var/log/chatkit/auth.log
   ```

2. **Verify token validity**
   ```bash
   # Decode JWT token
   echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | cut -d "." -f 1,2 - | base64 -d
   ```

3. **Check time synchronization**
   ```bash
   # Verify system time
   timedatectl status

   # Check JWT expiration
   date -d @$(echo $JWT_PAYLOAD | base64 -d | jq -r ".exp")
   ```

4. **Test OAuth providers**
   ```bash
   # Test Google OAuth endpoint
   curl -I "https://accounts.google.com/.well-known/openid_configuration"
   ```

#### Resolution Actions
- Verify JWT secret keys
- Check system time synchronization
- Update OAuth provider configurations
- Clear invalidated sessions
- Implement proper token refresh logic

### Memory Leaks

#### Symptoms
- Increasing memory usage over time
- Application restarts due to OOM
- Slow performance degradation
- High GC pressure

#### Diagnostic Steps
1. **Monitor memory usage**
   ```bash
   # Continuous monitoring
   watch -n 1 'ps aux | grep chatkit | grep -v grep'

   # Memory breakdown
   pmap -x <pid>
   ```

2. **Generate heap dump**
   ```bash
   # For Node.js
   kill -USR2 <pid>  # If node --heapsnapshot-signal is used

   # For Java
   jmap -dump:format=b,file=heap.hprof <pid>
   ```

3. **Analyze code for leaks**
   ```javascript
   // Common leak patterns to check:
   // 1. Event listeners not removed
   element.addEventListener('click', handler);
   // Missing: element.removeEventListener('click', handler);

   // 2. Closures holding references
   setInterval(() => {
       // Large object captured in closure
       console.log(largeObject.property);
   }, 1000);

   // 3. Global variable accumulation
   global.leakedData = [];
   ```

4. **Use memory profiling tools**
   ```bash
   # Node.js heap profiling
   node --inspect --inspect-brk app.js

   # Python memory profiling
   pip install memory-profiler
   python -m memory_profiler your_script.py
   ```

#### Resolution Actions
- Remove unused event listeners
- Break circular references
- Implement proper cleanup
- Use weak references where appropriate
- Optimize data structures

### File Upload Issues

#### Symptoms
- Uploads failing silently
- Large files timing out
- Disk space exhaustion
- Security scanning failures

#### Diagnostic Steps
1. **Check upload logs**
   ```bash
   tail -f /var/log/chatkit/uploads.log | grep -E "(error|fail|timeout)"
   ```

2. **Verify file size limits**
   ```bash
   # Check server limits
   grep -r "client_max_body_size\|upload_max_filesize" /etc/

   # Check actual file sizes
   ls -la /uploads/ | sort -k5 -hr | head -10
   ```

3. **Test upload endpoint**
   ```bash
   # Test with curl
   curl -X POST -F "file=@largefile.zip" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:3000/api/upload
   ```

4. **Check disk space**
   ```bash
   df -h /uploads
   du -sh /uploads/*
   ```

#### Resolution Actions
- Increase upload size limits
- Implement chunked uploads
- Add proper error handling
- Set up disk space monitoring
- Implement file cleanup routines

## Emergency Response Procedures

### Service Outage Checklist

1. **Immediate Assessment (0-5 minutes)**
   - [ ] Verify scope of outage
   - [ ] Check monitoring dashboards
   - [ ] Review recent deployments
   - [ ] Notify incident response team

2. **Initial Triage (5-15 minutes)**
   - [ ] Rollback recent changes if applicable
   - [ ] Scale up resources if under heavy load
   - [ ] Check external dependencies
   - [ ] Implement circuit breakers if needed

3. **Deep Dive (15-60 minutes)**
   - [ ] Analyze logs systematically
   - [ ] Reproduce the issue in staging
   - [ ] Identify root cause
   - [ ] Develop fix plan

4. **Resolution (60+ minutes)**
   - [ ] Deploy fix to production
   - [ ] Verify resolution
   - [ ] Monitor for recurrence
   - [ ] Document incident

### Communication Templates

#### Internal Notification
```
INCIDENT REPORT - PRIORITY LEVEL [HIGH/CRITICAL]

Service: ChatKit Backend
Issue: [Brief description]
Impact: [Scope of affected users/systems]
Started: [Timestamp]
Detected: [Timestamp]

Current Status: Under investigation
Assigned To: [Name/Team]
ETA to Resolution: [Estimate when available]

Link to incident channel: #[channel-name]
```

#### Customer Communication
```
NOTICE: Service Disruption

We are currently experiencing issues with [service/component].
Our team is actively working to resolve this issue.

Current Status: [Affected features]
Estimated Resolution: [Timeline when known]

We apologize for any inconvenience and will provide updates as they become available.
```

## Prevention Strategies

### Proactive Monitoring
- Implement synthetic monitoring for critical user journeys
- Set up anomaly detection for performance metrics
- Regular load testing before major releases
- Chaos engineering to test resilience

### Code Quality
- Static analysis tools in CI/CD
- Comprehensive test coverage
- Peer reviews for critical changes
- Automated security scanning

### Documentation
- Runbooks for common issues
- Architecture diagrams
- Emergency contact information
- Post-mortem templates and archives