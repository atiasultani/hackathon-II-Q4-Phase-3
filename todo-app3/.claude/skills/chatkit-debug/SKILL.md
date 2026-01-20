---
name: chatkit-debug
description: Comprehensive debugging and troubleshooting for ChatKit applications including error diagnosis, performance analysis, logging, monitoring, and diagnostic tools. Use when investigating issues, optimizing performance, or diagnosing problems in ChatKit applications across frontend, backend, and infrastructure layers.
---

# ChatKit Debug Skill

This skill provides comprehensive guidance for debugging and troubleshooting ChatKit applications across all layers of the system.

## Overview

Effective debugging of ChatKit applications requires understanding issues across multiple layers: frontend, backend, real-time communications, database interactions, and infrastructure. This skill covers diagnostic techniques, tools, and methodologies for identifying and resolving issues efficiently.

## When to Use This Skill

- Investigating application errors and crashes
- Diagnosing performance bottlenecks
- Analyzing slow API responses
- Troubleshooting WebSocket connection issues
- Debugging authentication failures
- Investigating message delivery problems
- Monitoring system health and stability
- Resolving database performance issues
- Analyzing memory leaks and resource consumption

## Core Debugging Areas

### Frontend Debugging
- Client-side JavaScript errors
- WebSocket connection issues
- UI rendering problems
- State management issues
- Browser compatibility problems

### Backend Debugging
- API endpoint failures
- Database query performance
- Authentication system issues
- Memory leaks in server processes
- Third-party service integrations

### Real-time Communication
- WebSocket connection drops
- Message delivery delays
- Presence system failures
- Broadcasting issues
- Connection scaling problems

### Infrastructure
- Server resource exhaustion
- Load balancer misconfigurations
- Network connectivity issues
- CDN problems
- SSL/TLS certificate issues

## Diagnostic Tools

### Logging Strategy
- Structured logging with correlation IDs
- Request/response tracing
- Performance metric logging
- Error categorization and aggregation
- Distributed tracing for microservices

### Monitoring Stack
- Application performance monitoring (APM)
- Infrastructure monitoring
- Custom business metric tracking
- Alerting and notification systems
- Log aggregation and analysis

### Profiling Tools
- CPU and memory profiling
- Database query analysis
- Network request analysis
- Frontend performance profiling
- Garbage collection analysis

## Best Practices

1. **Reproduce Issues**: Establish consistent reproduction steps for intermittent problems
2. **Isolate Problems**: Narrow down issues to specific components or layers
3. **Collect Evidence**: Gather logs, metrics, and dumps before making changes
4. **Document Findings**: Record root causes and solutions for future reference
5. **Monitor Impact**: Track resolution effectiveness and prevent regressions

## Common Debugging Patterns

### Error Classification
- Distinguish between client and server errors
- Categorize by frequency and impact
- Identify patterns in error occurrence
- Prioritize fixes based on severity

### Performance Analysis
- Identify bottlenecks in request flows
- Measure database query performance
- Analyze network latency impacts
- Monitor resource utilization trends

## Troubleshooting Workflows

### Issue Investigation Process
1. Gather initial reports and symptoms
2. Reproduce the issue if possible
3. Collect relevant logs and metrics
4. Formulate hypotheses about root cause
5. Test hypotheses with minimal changes
6. Implement and verify the fix
7. Document the resolution

### Critical Path Debugging
- Focus on user-impacting issues first
- Verify core functionality before optimizations
- Test recovery procedures for critical failures
- Validate fixes in staging before production

## Diagnostic Commands

Common debugging commands and techniques:
- Log analysis with grep and filtering
- Database query performance analysis
- Network connectivity testing
- Memory dump analysis
- Thread and process inspection

## Implementation Guidelines

### For New Projects
1. Build in logging and monitoring from the start
2. Implement comprehensive error handling
3. Set up alerting for critical metrics
4. Create diagnostic tools and dashboards
5. Plan for debugging in production environments

### For Existing Systems
1. Audit current logging and monitoring coverage
2. Identify blind spots in observability
3. Implement targeted diagnostic improvements
4. Create debugging playbooks for common issues
5. Train team members on debugging tools and processes

## References

For specific debugging techniques, diagnostic tools, and troubleshooting guides, refer to:
- [DEBUGGING_TOOLS.md](references/DEBUGGING_TOOLS.md)
- [LOGGING_STRATEGY.md](references/LOGGING_STRATEGY.md)
- [MONITORING_DASHBOARDS.md](references/MONITORING_DASHBOARDS.md)
- [TROUBLESHOOTING_PLAYBOOKS.md](references/TROUBLESHOOTING_PLAYBOOKS.md)