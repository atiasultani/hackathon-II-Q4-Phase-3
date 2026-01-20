# Database Patterns Reference

## Relational Database Patterns

### Entity Relationship Modeling

#### Chat Data Model
```sql
-- Users table with soft deletes
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT users_username_check CHECK (LENGTH(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Conversations with polymorphic types
CREATE TYPE conversation_type AS ENUM ('direct', 'group', 'channel');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type conversation_type NOT NULL,
    name VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Junction table for conversation participants
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB,

    UNIQUE(conversation_id, user_id)
);

-- Messages with threading support
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system', 'command');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- For threaded replies
    type message_type DEFAULT 'text',
    content TEXT NOT NULL,
    metadata JSONB, -- For storing reactions, edits, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Message status tracking
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

CREATE TABLE message_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status message_status NOT NULL DEFAULT 'sent',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(message_id, user_id)
);
```

### Indexing Strategies

#### Common Index Patterns
```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users USING hash(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users USING btree(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC) WHERE deleted_at IS NULL;

-- Conversations indexes
CREATE INDEX idx_conversations_type ON conversations(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC) WHERE deleted_at IS NULL;

-- Conversation participants indexes
CREATE INDEX idx_conv_participants_conv ON conversation_participants(conversation_id) WHERE left_at IS NULL;
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id) WHERE left_at IS NULL;

-- Messages indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_messages_type ON messages(type) WHERE deleted_at IS NULL;

-- Message receipts indexes
CREATE INDEX idx_message_receipts_user_status ON message_receipts(user_id, status) WHERE timestamp > NOW() - INTERVAL '30 days';
CREATE INDEX idx_message_receipts_message ON message_receipts(message_id, user_id);
```

### Partitioning for Large Tables

#### Time-based Partitioning for Messages
```sql
-- Create partitioned table for messages
CREATE TABLE messages_partitioned (
    id UUID DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    parent_message_id UUID,
    type message_type DEFAULT 'text',
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE messages_2023_01 PARTITION OF messages_partitioned
    FOR VALUES FROM ('2023-01-01') TO ('2023-02-01');

CREATE TABLE messages_2023_02 PARTITION OF messages_partitioned
    FOR VALUES FROM ('2023-02-01') TO ('2023-03-01');

-- Add foreign key constraints to partitions
ALTER TABLE messages_2023_01 ADD FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages_2023_01 ADD FOREIGN KEY (sender_id) REFERENCES users(id);
ALTER TABLE messages_2023_01 ADD FOREIGN KEY (parent_message_id) REFERENCES messages_2023_01(id) ON DELETE SET NULL;

-- Create indexes on partitions
CREATE INDEX idx_messages_2023_01_conversation ON messages_2023_01(conversation_id, created_at DESC);
CREATE INDEX idx_messages_2023_01_sender ON messages_2023_01(sender_id, created_at DESC);
```

## NoSQL Patterns

### MongoDB Document Structure
```javascript
// User document
{
  "_id": ObjectId("..."),
  "username": "johndoe",
  "email": "john@example.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  },
  "status": "online",
  "lastSeen": ISODate("2023-01-01T10:00:00Z"),
  "createdAt": ISODate("2023-01-01T00:00:00Z"),
  "updatedAt": ISODate("2023-01-01T10:00:00Z"),
  "deletedAt": null
}

// Conversation document
{
  "_id": ObjectId("..."),
  "type": "group", // "direct", "group", "channel"
  "name": "Team Discussion",
  "avatar": "https://...",
  "members": [
    {"userId": ObjectId("..."), "role": "admin", "joinedAt": ISODate("...")},
    {"userId": ObjectId("..."), "role": "member", "joinedAt": ISODate("...")}
  ],
  "settings": {
    "isPrivate": false,
    "messageHistoryVisible": true
  },
  "lastMessageAt": ISODate("2023-01-01T10:00:00Z"),
  "createdAt": ISODate("2023-01-01T00:00:00Z"),
  "updatedAt": ISODate("2023-01-01T10:00:00Z")
}

// Message document
{
  "_id": ObjectId("..."),
  "conversationId": ObjectId("..."),
  "senderId": ObjectId("..."),
  "type": "text", // "text", "image", "file", "system"
  "content": "Hello, team!",
  "parentId": null, // For threaded replies
  "reactions": [
    {"emoji": "👍", "users": [ObjectId("..."), ObjectId("...")]},
    {"emoji": "❤️", "users": [ObjectId("...")]}
  ],
  "mentions": [ObjectId("...")], // User IDs mentioned
  "status": {
    "deliveredTo": [ObjectId("...")],
    "readBy": [ObjectId("...")]
  },
  "createdAt": ISODate("2023-01-01T10:00:00Z"),
  "updatedAt": ISODate("2023-01-01T10:00:00Z"),
  "editedAt": null
}
```

### MongoDB Indexing Patterns
```javascript
// Users collection indexes
db.users.createIndex({"email": 1}, {"unique": true, "partialFilterExpression": {"deletedAt": {"$exists": false}}})
db.users.createIndex({"username": 1}, {"unique": true, "partialFilterExpression": {"deletedAt": {"$exists": false}}})
db.users.createIndex({"createdAt": -1})

// Conversations collection indexes
db.conversations.createIndex({"type": 1})
db.conversations.createIndex({"lastMessageAt": -1})
db.conversations.createIndex({"members.userId": 1})

// Messages collection indexes
db.messages.createIndex({"conversationId": 1, "createdAt": -1})
db.messages.createIndex({"senderId": 1, "createdAt": -1})
db.messages.createIndex({"parentId": 1})
db.messages.createIndex({"createdAt": 1}, {"expireAfterSeconds": 365 * 24 * 3600}) // Auto-expire after 1 year
```

## Query Optimization Techniques

### PostgreSQL Optimization Examples
```sql
-- Use CTEs for complex queries
WITH recent_conversations AS (
    SELECT c.*, MAX(m.created_at) as last_message_time
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE c.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY last_message_time DESC NULLS LAST
    LIMIT 50
)
SELECT rc.*, u.username as last_sender
FROM recent_conversations rc
LEFT JOIN messages lm ON rc.id = lm.conversation_id AND rc.last_message_time = lm.created_at
LEFT JOIN users u ON lm.sender_id = u.id;

-- Use EXISTS instead of IN for better performance
SELECT u.*
FROM users u
WHERE EXISTS (
    SELECT 1
    FROM conversation_participants cp
    JOIN conversations c ON cp.conversation_id = c.id
    WHERE cp.user_id = u.id
    AND c.type = 'group'
    AND c.deleted_at IS NULL
);

-- Use UNION ALL instead of OR when possible
SELECT id, username, email
FROM users
WHERE email LIKE '%@gmail.com'
UNION ALL
SELECT id, username, email
FROM users
WHERE username LIKE 'admin%';
```

### MongoDB Aggregation Pipeline Optimization
```javascript
// Efficient way to get user's conversations with last message
db.conversations.aggregate([
  {
    $match: {
      "members.userId": ObjectId("user_id_here"),
      "deletedAt": null
    }
  },
  {
    $lookup: {
      from: "messages",
      let: { convId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$conversationId", "$$convId"] },
            "deletedAt": null
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 }
      ],
      as: "lastMessage"
    }
  },
  {
    $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true }
  },
  {
    $addFields: {
      lastMessageText: "$lastMessage.content",
      lastMessageTime: "$lastMessage.createdAt",
      lastSenderId: "$lastMessage.senderId"
    }
  },
  {
    $project: {
      lastMessage: 0
    }
  }
]);
```