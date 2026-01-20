---
name: chatkit-store
description: Comprehensive data storage and management for ChatKit applications including database design, caching strategies, data synchronization, backup systems, and storage optimization. Use when implementing, configuring, or optimizing data storage solutions for ChatKit applications including messages, user data, files, and metadata.
---

# ChatKit Store Skill

This skill provides comprehensive guidance for implementing and managing data storage solutions in ChatKit applications.

## Overview

The ChatKit store encompasses all aspects of data persistence including message storage, user profiles, conversation history, file attachments, metadata management, and storage optimization. This skill covers database design, caching strategies, and data management best practices.

## When to Use This Skill

- Designing database schemas for chat data
- Implementing caching strategies for performance
- Managing file storage and retrieval
- Setting up data backup and recovery systems
- Optimizing database queries and indexes
- Implementing data synchronization across services
- Managing storage costs and scalability
- Handling data migration and versioning
- Implementing data retention and archival policies

## Core Storage Components

### Message Storage
- Individual message records with metadata
- Message threading and relationships
- Message status tracking (sent, delivered, read)
- Message editing and deletion handling

### User Data Storage
- User profiles and preferences
- Authentication tokens and sessions
- User settings and configurations
- Privacy and consent management

### Conversation Storage
- Conversation metadata and properties
- Member relationships and permissions
- Conversation history and threading
- Group management data

### File and Attachment Storage
- File metadata and references
- Original file storage locations
- Thumbnail and preview generation
- Content type and security validation

## Storage Strategies

### Primary Storage
- Database selection based on use case
- Schema design and normalization
- Indexing strategies for performance
- Partitioning for large datasets

### Caching Layer
- In-memory caching for frequently accessed data
- Cache invalidation strategies
- Distributed caching for scalability
- Cache warming and preloading

### Archive Storage
- Cold storage for historical data
- Compression strategies for archived data
- Retrieval workflows for archived content
- Lifecycle management policies

## Best Practices

1. **Data Integrity**: Implement proper constraints and validation
2. **Performance**: Optimize queries and implement appropriate indexing
3. **Scalability**: Design for growth and horizontal scaling
4. **Security**: Encrypt sensitive data and implement access controls
5. **Cost Management**: Optimize storage costs through tiered storage
6. **Backup & Recovery**: Implement robust backup and recovery procedures

## Common Patterns

### Storage Tiering
- Hot data in fast storage (SSD, memory)
- Warm data in balanced storage (standard disk)
- Cold data in cost-effective storage (archival)

### Data Lifecycle Management
- Automatic archival of old messages
- Expiration and cleanup of temporary data
- Backup rotation and retention policies
- Compliance-driven retention periods

## Troubleshooting

Common issues and solutions:
- Slow query performance: Analyze and optimize indexes
- Storage capacity issues: Implement archiving strategies
- Data consistency problems: Review transaction handling
- Backup failures: Verify backup procedures and storage

## Implementation Guidelines

### For New Projects
1. Design data models based on access patterns
2. Plan for scalability from the start
3. Implement comprehensive backup procedures
4. Set up monitoring for storage metrics
5. Plan data migration strategies for future changes

### For Existing Systems
1. Audit current storage usage and performance
2. Identify optimization opportunities
3. Implement caching for hot data
4. Review and improve backup procedures
5. Plan for data migration if schema changes needed

## References

For specific implementation details, configuration examples, and storage patterns, refer to:
- [DATABASE_PATTERNS.md](references/DATABASE_PATTERNS.md)
- [CACHING_STRATEGIES.md](references/CACHING_STRATEGIES.md)
- [FILE_STORAGE.md](references/FILE_STORAGE.md)
- [BACKUP_RECOVERY.md](references/BACKUP_RECOVERY.md)