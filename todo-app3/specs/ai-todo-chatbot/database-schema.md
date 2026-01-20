# Database Schema Specification

## Purpose
Defines the database schema for the AI-powered todo chatbot system, including tables for tasks, conversations, and messages with proper relationships, constraints, and indexing.

## Schema Definition

### Tasks Table
**Purpose**: Stores user's todo tasks

**Columns**:
- id (UUID, primary key, not null, default: gen_random_uuid()) - Unique identifier for the task
- user_id (UUID, not null) - ID of the user who owns this task
- title (VARCHAR(255), not null) - Title of the task
- description (TEXT, nullable) - Optional description of the task
- completed (BOOLEAN, not null, default: false) - Whether the task is completed
- created_at (TIMESTAMPTZ, not null, default: NOW()) - When the task was created
- updated_at (TIMESTAMPTZ, not null, default: NOW()) - When the task was last updated

**Indexes**:
- idx_tasks_user_id (user_id) - For efficient user-based queries
- idx_tasks_user_completed (user_id, completed) - For efficient queries by user and completion status
- idx_tasks_created_at (created_at DESC) - For chronological ordering

**Constraints**:
- fk_tasks_user_id - Foreign key to users table (assumes user management system exists)
- chk_tasks_title_not_empty - Title cannot be an empty string

### Conversations Table
**Purpose**: Stores conversation threads between users and AI

**Columns**:
- id (UUID, primary key, not null, default: gen_random_uuid()) - Unique identifier for the conversation
- user_id (UUID, not null) - ID of the user who owns this conversation
- created_at (TIMESTAMPTZ, not null, default: NOW()) - When the conversation was started
- updated_at (TIMESTAMPTZ, not null, default: NOW()) - When the conversation was last updated

**Indexes**:
- idx_conversations_user_id (user_id) - For efficient user-based queries
- idx_conversations_created_at (created_at DESC) - For chronological ordering

**Constraints**:
- fk_conversations_user_id - Foreign key to users table

### Messages Table
**Purpose**: Stores individual messages within conversations

**Columns**:
- id (UUID, primary key, not null, default: gen_random_uuid()) - Unique identifier for the message
- user_id (UUID, not null) - ID of the user who owns this message
- conversation_id (UUID, not null) - ID of the conversation this message belongs to
- role (VARCHAR(20), not null) - Role of the message sender ('user' or 'assistant')
- content (TEXT, not null) - Content of the message
- created_at (TIMESTAMPTZ, not null, default: NOW()) - When the message was created

**Indexes**:
- idx_messages_conversation_id (conversation_id) - For efficient conversation-based queries
- idx_messages_conversation_time (conversation_id, created_at ASC) - For chronological ordering within conversations
- idx_messages_user_id (user_id) - For efficient user-based queries
- idx_messages_role (role) - For efficient role-based queries

**Constraints**:
- fk_messages_user_id - Foreign key to users table
- fk_messages_conversation_id - Foreign key to conversations table
- chk_messages_role_valid - Role must be either 'user' or 'assistant'
- chk_messages_content_not_empty - Content cannot be an empty string

## Relationships

### Referential Integrity
- Tasks → Users: Each task belongs to a user
- Conversations → Users: Each conversation belongs to a user
- Messages → Users: Each message belongs to a user
- Messages → Conversations: Each message belongs to a conversation

### Cascade Behavior
- When a user is deleted: All associated tasks, conversations, and messages should be deleted (CASCADE)
- When a conversation is deleted: All associated messages should be deleted (CASCADE)

## Indexing Strategy

### Primary Indexes
- All primary keys are indexed automatically
- Foreign key columns are indexed for join performance

### Query-Optimized Indexes
- User-based queries: Indexed on user_id in all tables
- Conversation-based queries: Indexed on conversation_id in messages table
- Chronological queries: Indexed on created_at in all tables
- Status-based queries: Composite index on (user_id, completed) for tasks

### Performance Considerations
- Indexes should optimize the most frequent query patterns
- Avoid over-indexing which can slow down writes
- Regular monitoring of query performance to optimize indexes

## Constraints and Validation

### Data Integrity
- All required fields have NOT NULL constraints
- UUID fields ensure globally unique identifiers
- Timestamps are timezone-aware for proper ordering
- Check constraints prevent invalid data

### Business Logic Constraints
- Task titles must not be empty strings
- Message content must not be empty strings
- Message roles must be valid values
- Referential integrity is enforced with foreign keys

## Migrations

### Initial Schema Migration
1. Create users table (assumed to exist from Better Auth)
2. Create tasks table with all columns, indexes, and constraints
3. Create conversations table with all columns, indexes, and constraints
4. Create messages table with all columns, indexes, and constraints
5. Create foreign key relationships
6. Create check constraints

### Future Migration Considerations
- Adding columns for enhanced features (priority, categories, etc.)
- Creating additional indexes for new query patterns
- Modifying constraints based on evolving business rules
- Partitioning large tables for performance

## Retention Rules for Chat History

### Data Retention Policy
- Conversation messages: Retain indefinitely unless user explicitly deletes
- Completed tasks: Retain for 2 years before archival
- Active tasks: Retain indefinitely
- Deleted tasks: Purge after 30 days in soft-delete state

### Archival Strategy
- Old messages may be moved to cold storage after 1 year
- Archived data remains accessible but with slower retrieval
- Personal data deletion requests must be honored per privacy regulations

### Cleanup Procedures
- Regular cleanup jobs to remove expired soft-deleted items
- Automated archival of old conversation data
- Monitoring of storage usage and performance