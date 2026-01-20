---
name: chatkit-backend
description: Comprehensive backend development for ChatKit applications including API design, database management, authentication, real-time messaging, and server infrastructure. Use when building, extending, or maintaining ChatKit backend services, APIs, or server-side functionality.
---

# ChatKit Backend Skill

This skill provides comprehensive guidance for developing and maintaining backend services for ChatKit applications.

## Overview

The ChatKit backend encompasses all server-side components including APIs, databases, authentication systems, real-time messaging infrastructure, and server management. This skill covers the complete backend stack needed for robust chat applications.

## When to Use This Skill

- Designing and implementing ChatKit APIs
- Setting up database schemas and migrations
- Implementing authentication and authorization
- Building real-time messaging systems
- Configuring server infrastructure
- Managing user accounts and permissions
- Handling file uploads and media storage
- Implementing rate limiting and security measures

## Core Components

### API Layer
- RESTful API design for chat operations
- WebSocket connections for real-time messaging
- GraphQL endpoints for complex queries
- API versioning and documentation

### Authentication & Authorization
- User registration and login systems
- JWT token management
- OAuth integration
- Role-based access control
- Session management

### Database Management
- Schema design for conversations and messages
- User profile storage
- Message history and threading
- Media attachment storage
- Indexing and optimization

### Real-time Infrastructure
- WebSocket server implementation
- Message broadcasting
- Presence tracking
- Typing indicators
- Connection management

## Best Practices

1. **Security**: Implement proper authentication, input validation, and rate limiting
2. **Performance**: Optimize database queries and implement caching strategies
3. **Scalability**: Design systems that can handle increasing user loads
4. **Reliability**: Implement proper error handling and retry mechanisms
5. **Monitoring**: Set up logging, metrics, and alerting for operational visibility

## Common Patterns

### API Design
- Consistent endpoint naming conventions
- Standard error response formats
- Pagination for large datasets
- Rate limiting to prevent abuse

### Database Optimization
- Proper indexing for frequently queried fields
- Connection pooling for database access
- Read replicas for scaling read operations
- Archiving old message history

## Troubleshooting

Common issues and solutions:
- Slow API responses: Profile and optimize database queries
- WebSocket disconnections: Implement proper reconnection logic
- Memory leaks: Monitor and fix resource management
- Authentication failures: Verify token handling and expiration

## Implementation Guidelines

### For New Projects
1. Plan API endpoints and data models early
2. Set up authentication system first
3. Implement basic message sending/receiving
4. Add real-time features incrementally
5. Configure monitoring and logging

### For Existing Systems
1. Audit current API usage and performance
2. Identify bottlenecks in database queries
3. Implement caching for frequently accessed data
4. Upgrade security measures as needed
5. Monitor and optimize resource usage

## References

For specific implementation details, configuration examples, and API documentation, refer to:
- [API_DESIGN.md](references/API_DESIGN.md)
- [DATABASE_SCHEMAS.md](references/DATABASE_SCHEMAS.md)
- [AUTHENTICATION_FLOW.md](references/AUTHENTICATION_FLOW.md)
- [REALTIME_INFRASTRUCTURE.md](references/REALTIME_INFRASTRUCTURE.md)