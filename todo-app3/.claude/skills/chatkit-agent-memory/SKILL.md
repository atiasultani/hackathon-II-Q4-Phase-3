---
name: chatkit-agent-memory
description: Comprehensive management and interaction with agent memory systems including storage, retrieval, persistence, and optimization. Use when working with chatbot memory, conversation history, context management, session storage, or any memory-related functionality for AI agents.
---

# ChatKit Agent Memory Skill

This skill provides comprehensive guidance for managing agent memory systems in ChatKit applications.

## Overview

Agent memory is crucial for maintaining context, conversation history, and user state in chat applications. This skill covers all aspects of memory management including storage mechanisms, retrieval strategies, and optimization techniques.

## When to Use This Skill

- Implementing conversation history persistence
- Managing user context across sessions
- Optimizing memory usage for performance
- Implementing memory cleanup and garbage collection
- Working with short-term vs long-term memory strategies
- Handling sensitive data in memory

## Core Concepts

### Memory Types
- **Short-term memory**: Current conversation context, typically stored in RAM
- **Long-term memory**: Persistent storage for conversation history and user profiles
- **Working memory**: Active context used during current interaction

### Storage Mechanisms
- In-memory stores (Redis, Memcached)
- Database persistence (PostgreSQL, MongoDB)
- File-based storage for large contexts
- Hybrid approaches combining multiple storage types

## Best Practices

1. **Context Window Management**: Monitor token usage and implement sliding windows
2. **Data Privacy**: Securely handle sensitive information in memory
3. **Performance**: Optimize retrieval times for large datasets
4. **Scalability**: Design memory systems that scale with user load
5. **Cleanup**: Implement automatic expiration of old memory entries

## Common Patterns

### Memory Summarization
- Automatically summarize long conversation histories
- Maintain key context while reducing memory footprint
- Store summaries alongside raw conversation data

### Selective Memory
- Prioritize important information for retention
- Implement relevance scoring for memory entries
- Allow configurable retention policies

## Troubleshooting

Common issues and solutions:
- Memory leaks: Implement proper cleanup routines
- Performance degradation: Optimize queries and add caching
- Data inconsistency: Use atomic operations for updates
- Storage limits exceeded: Implement compression or archival

## Implementation Guidelines

### For New Projects
1. Define memory requirements early in design
2. Choose appropriate storage mechanisms based on scale
3. Implement monitoring for memory usage
4. Plan for data migration and backup strategies

### For Existing Systems
1. Audit current memory usage patterns
2. Identify optimization opportunities
3. Gradually migrate to improved memory architecture
4. Monitor impact of changes on performance

## References

For specific implementation details, configuration examples, and API documentation, refer to:
- [MEMORY_ARCHITECTURE.md](references/MEMORY_ARCHITECTURE.md)
- [STORAGE_PATTERNS.md](references/STORAGE_PATTERNS.md)
- [PERFORMANCE_TUNING.md](references/PERFORMANCE_TUNING.md)