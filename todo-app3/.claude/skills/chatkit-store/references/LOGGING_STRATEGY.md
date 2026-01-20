# Logging Strategy Reference

## Comprehensive Logging Implementation Guide

### Log Levels and Categories

#### Standard Log Levels
```javascript
// Log level hierarchy (from most to least severe)
{
  "fatal": 60,  // System unusable
  "error": 50,  // Error events
  "warn": 40,   // Warning events
  "info": 30,   // Informational messages
  "debug": 20,  // Debug information
  "trace": 10   // Trace debugging
}
```

#### Log Categories
- **access**: HTTP requests, API calls, user actions
- **error**: Exceptions, failures, system errors
- **security**: Authentication, authorization, suspicious activities
- **performance**: Response times, resource usage, bottlenecks
- **business**: User registrations, purchases, key business events
- **system**: Startup/shutdown, configuration changes, health checks

### Structured Logging Format

#### JSON Log Format
```json
{
  "level": "info",
  "time": "2023-01-01T10:00:00.000Z",
  "pid": 12345,
  "hostname": "server-01",
  "name": "chatkit-backend",
  "reqId": "req-12345-abcde",
  "traceId": "trace-67890-fghij",
  "spanId": "span-54321-klmno",
  "msg": "User authenticated successfully",
  "user": {
    "id": "user-12345",
    "email": "user@example.com"
  },
  "context": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "method": "POST",
    "url": "/api/auth/login"
  },
  "duration": 150,
  "tags": ["auth", "login", "success"]
}
```

#### Implementation Example
```javascript
const pino = require('pino');

// Create logger with custom serializers
const logger = pino({
  level: 'info',
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    error: pino.stdSerializers.err,
    user: (user) => ({
      id: user.id,
      email: user.email
    })
  },
  mixin() {
    return { service: 'chatkit-backend' };
  }
});

// Logger middleware
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const reqId = generateRequestId();

  // Add request ID to request context
  req.requestId = reqId;

  // Log request
  logger.info({
    reqId,
    ip: req.ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  }, 'Incoming request');

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;

    logger.info({
      reqId,
      statusCode: res.statusCode,
      duration,
      contentLength: data?.length || 0
    }, 'Request completed');

    originalSend.call(this, data);
  };

  next();
};
```

### Application-Specific Logging

#### Database Queries
```javascript
// Database query logging
const logDatabaseQuery = (query, params, duration, error = null) => {
  logger[error ? 'warn' : 'debug']({
    event: 'database_query',
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    params: maskSensitiveParams(params),
    duration,
    error: error?.message,
    stack: error?.stack
  }, error ? 'Database query failed' : 'Database query executed');
};

// Mask sensitive data
const maskSensitiveParams = (params) => {
  if (!params) return params;

  const masked = { ...params };
  Object.keys(masked).forEach(key => {
    if (key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret')) {
      masked[key] = '[MASKED]';
    }
  });
  return masked;
};
```

#### User Activity Logging
```javascript
// User action logging
const logUserAction = (user, action, details = {}) => {
  logger.info({
    event: 'user_action',
    user: {
      id: user.id,
      email: user.email
    },
    action,
    details,
    ip: getUserIP(),
    userAgent: getUserAgent()
  }, `User performed action: ${action}`);
};

// Example usage
logUserAction(req.user, 'message_sent', {
  messageId: message.id,
  conversationId: message.conversationId,
  messageLength: message.content.length
});
```

#### Security Event Logging
```javascript
// Security event logging
const logSecurityEvent = (type, user = null, details = {}) => {
  logger.warn({
    event: 'security_event',
    type,
    user: user ? { id: user.id, email: user.email } : null,
    details,
    ip: getUserIP(),
    userAgent: getUserAgent()
  }, `Security event: ${type}`);
};

// Examples
logSecurityEvent('login_failed', null, { email: 'attempted@email.com', reason: 'invalid_credentials' });
logSecurityEvent('brute_force_detected', user, { attempts: 10, timeframe: '5m' });
logSecurityEvent('suspicious_activity', user, { action: 'multiple_device_login' });
```

### Performance Monitoring Logs

#### Response Time Tracking
```javascript
// Performance logging middleware
const performanceLogging = async (req, res, next) => {
  const start = process.hrtime.bigint();
  const reqId = req.requestId || generateRequestId();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) { // Log requests taking more than 1 second
      logger.warn({
        reqId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id
      }, 'Slow request detected');
    }

    // Log performance metrics
    logger.info({
      event: 'response_time',
      reqId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    }, 'Request performance');
  });

  next();
};
```

#### Resource Usage Monitoring
```javascript
// Resource monitoring
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = getCPUUsage(); // Implementation depends on environment

  logger.info({
    event: 'resource_usage',
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    },
    cpu: cpuUsage,
    uptime: process.uptime()
  }, 'Resource usage report');
}, 30000); // Log every 30 seconds
```

### Log Filtering and Sampling

#### Production Log Sampling
```javascript
// Log sampling for high-volume events
const sampledLogger = (probability) => (level, obj, msg) => {
  if (Math.random() < probability) {
    logger[level](obj, msg);
  }
};

// Use for high-frequency events
const accessLogger = sampledLogger(0.1); // Log 10% of access events in production
```

#### Context-Aware Logging
```javascript
// Create contextual loggers
const createConversationLogger = (conversationId) => {
  return logger.child({
    conversationId,
    module: 'conversation_service'
  });
};

const createUserServiceLogger = () => {
  return logger.child({
    module: 'user_service',
    version: '1.2.3'
  });
};

// Usage
const conversationLogger = createConversationLogger('conv-12345');
conversationLogger.info('Message added to conversation');
```

### Log Aggregation and Analysis

#### ELK Stack Integration
```javascript
// Elasticsearch-friendly format
const elasticSearchTransport = require('pino-elasticsearch');

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-elasticsearch',
    options: {
      index: 'chatkit-logs-' + new Date().toISOString().split('T')[0],
      node: 'http://elasticsearch:9200',
      esVersion: 7,
      waitForActiveShards: 1,
      consistency: 'one'
    }
  }
});
```

#### Log Enrichment
```javascript
// Add environment-specific context
const addEnvironmentContext = (logger) => {
  return logger.child({
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || 'unknown',
    instanceId: process.env.INSTANCE_ID || 'local',
    region: process.env.AWS_REGION || 'local'
  });
};

const enrichedLogger = addEnvironmentContext(logger);
```

### Error Handling and Logging

#### Comprehensive Error Logging
```javascript
// Error handling with context
const logErrorWithContext = (error, context = {}) => {
  logger.error({
    event: 'application_error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status
    },
    context,
    reqId: context.reqId,
    userId: context.userId
  }, `Error occurred: ${error.message}`);
};

// Express error handler
const errorHandler = (err, req, res, next) => {
  const errorId = generateErrorId();

  logErrorWithContext(err, {
    reqId: req.requestId,
    userId: req.user?.id,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: {
      id: errorId,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    }
  });
};
```

### Log Rotation and Management

#### Log Rotation Configuration
```bash
# Example logrotate configuration (/etc/logrotate.d/chatkit)
/var/log/chatkit/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        # Signal application to reopen log files if needed
        # kill -USR1 `cat /var/run/chatkit.pid`
    endscript
}
```

#### Log Retention Policies
- **Production**: 30 days for application logs, 90 days for security logs
- **Staging**: 7 days for all logs
- **Development**: No automated retention (managed manually)

### Compliance and Privacy

#### GDPR Compliance Logging
```javascript
// PII-aware logging
const logWithPrivacy = (data, piiFields = []) => {
  const safeData = { ...data };

  piiFields.forEach(field => {
    if (safeData[field]) {
      safeData[field] = '[REDACTED - PII]';
    }
  });

  logger.info(safeData, 'Data logged with privacy compliance');
};

// Example usage
logWithPrivacy(userData, ['email', 'phone', 'address']);
```

#### Audit Trail Requirements
```javascript
// Audit trail for regulatory compliance
const logAuditEvent = (user, action, resource, oldValue = null, newValue = null) => {
  logger.info({
    event: 'audit_trail',
    userId: user.id,
    action,
    resourceType: resource.type,
    resourceId: resource.id,
    oldValue: oldValue ? maskPII(oldValue) : null,
    newValue: newValue ? maskPII(newValue) : null,
    timestamp: new Date().toISOString(),
    ipAddress: getUserIP(),
    userAgent: getUserAgent()
  }, 'Audit trail event');
};
```