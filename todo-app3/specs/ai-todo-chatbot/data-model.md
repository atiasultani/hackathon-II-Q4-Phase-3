# Data Model: Chat UI

## Message Entity

**Entity Name**: Message
**Description**: Represents a message in the chat interface with content, author, and metadata

### Fields
- `id` (string/UUID): Unique identifier for the message
- `content` (string): The actual message content
- `sender` (string): Identifier of the sender ('user' or 'assistant')
- `timestamp` (datetime): When the message was sent/received
- `status` (string): Message status (sent, delivered, read, error)
- `conversationId` (string/UUID): Reference to the conversation this message belongs to
- `toolCalls` (array): Optional tool calls executed by the message (for AI responses)
- `parentId` (string/UUID): Reference to parent message if this is a reply (optional)

### Relationships
- Many-to-one with Conversation (many messages belong to one conversation)
- One-to-many with ToolCall (one message can trigger multiple tool calls)

### Validation Rules
- Content must be provided and not exceed maximum length
- Sender must be either 'user' or 'assistant'
- Timestamp must be in ISO format
- Status must be one of the allowed values

## Conversation Entity

**Entity Name**: Conversation
**Description**: Represents a chat conversation with message history and metadata

### Fields
- `id` (string/UUID): Unique identifier for the conversation
- `title` (string): Auto-generated or user-defined title for the conversation
- `createdAt` (datetime): When the conversation was created
- `updatedAt` (datetime): Last activity timestamp
- `userId` (string/UUID): Reference to the user who owns this conversation
- `isActive` (boolean): Whether the conversation is currently active

### Relationships
- One-to-many with Message (one conversation can have many messages)
- Many-to-one with User (many conversations belong to one user)

### Validation Rules
- User must be authenticated to create/access conversations
- Title must not exceed maximum length
- updatedAt must be >= createdAt

## ToolCall Entity

**Entity Name**: ToolCall
**Description**: Represents a tool call executed as part of an AI response

### Fields
- `id` (string/UUID): Unique identifier for the tool call
- `toolName` (string): Name of the tool being called
- `parameters` (object): Parameters passed to the tool
- `result` (object): Result returned by the tool
- `status` (string): Execution status (pending, success, error)
- `messageId` (string/UUID): Reference to the message that triggered this tool call

### Relationships
- Many-to-one with Message (many tool calls can be associated with one message)
- One-to-many with ToolResult (one tool call produces one result)

### Validation Rules
- Tool name must be one of the allowed MCP tools
- Parameters must match the expected schema for the tool
- Status must be one of the allowed values

## UserPreferences Entity (Frontend)

**Entity Name**: UserPreferences
**Description**: Stores user-specific UI preferences for the chat interface

### Fields
- `theme` (string): UI theme preference (light, dark)
- `messageDisplay` (string): Message display preference (compact, comfortable, cozy)
- `notificationSettings` (object): Notification preferences
- `autoScroll` (boolean): Whether to auto-scroll to new messages
- `userId` (string/UUID): Reference to the user these preferences belong to

### Validation Rules
- Theme must be one of the supported themes
- Message display must be one of the supported options
- UserId must correspond to an authenticated user