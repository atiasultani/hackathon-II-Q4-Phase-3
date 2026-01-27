# Data Model: Frontend Recreation for Professional Todo App

## Task Entity
- **id**: string (UUID) - Unique identifier for the task
- **user_id**: string (UUID) - Owner of the task (for user isolation)
- **title**: string (required) - Title of the task
- **description**: string (optional) - Additional details about the task
- **completed**: boolean - Whether the task is completed
- **created_at**: datetime - Timestamp when task was created
- **updated_at**: datetime - Timestamp when task was last updated
- **due_date**: datetime (optional) - Deadline for the task
- **priority**: enum ('low', 'medium', 'high') - Priority level of the task

**Validation rules**:
- Title must be 1-200 characters
- User_id must match authenticated user
- Due date must be in the future if provided

**State transitions**:
- pending → completed (when marked complete)
- completed → pending (when unmarked)

## Conversation Entity
- **id**: string (UUID) - Unique identifier for the conversation
- **user_id**: string (UUID) - Owner of the conversation
- **created_at**: datetime - Timestamp when conversation was started
- **updated_at**: datetime - Timestamp when conversation was last updated
- **title**: string (optional) - Auto-generated title from first message

**Validation rules**:
- User_id must match authenticated user
- Created_at must be before updated_at

## Message Entity
- **id**: string (UUID) - Unique identifier for the message
- **user_id**: string (UUID) - Owner of the message
- **conversation_id**: string (UUID) - Parent conversation
- **role**: enum ('user', 'assistant') - Who sent the message
- **content**: string (required) - The actual message content
- **created_at**: datetime - Timestamp when message was created
- **tool_calls**: JSON (optional) - Any MCP tool calls made during the message
- **tool_responses**: JSON (optional) - Responses from MCP tools

**Validation rules**:
- User_id must match authenticated user
- Conversation_id must exist and belong to user
- Role must be either 'user' or 'assistant'
- Content must be 1-10000 characters

## Relationships
- User (1) : (Many) Task
- User (1) : (Many) Conversation
- User (1) : (Many) Message
- Conversation (1) : (Many) Message
- Task (0..1) : (Many) Message (tasks referenced in messages)