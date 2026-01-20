# AI-Powered Todo Chatbot Specification

## Overview

This specification defines an AI-powered conversational Todo system that allows users to manage their tasks through natural language interaction. The system leverages OpenAI Agents SDK, MCP (Model Context Protocol), FastAPI, ChatKit, SQLModel, Neon PostgreSQL, and Better Auth to provide a stateless, scalable, and fully spec-driven solution.

## Clarifications

### Session 2026-01-19

- Q: What constitutes "normal load" in terms of requests per second? → A: 100 requests/sec
- Q: How long should authentication tokens be valid? → A: 24 hours
- Q: How long should completed tasks and conversation history be retained? → A: 2 years
- Q: How many requests per minute should be allowed per user? → A: 60 requests/min
- Q: How detailed should error responses be to prevent information leakage? → A: Generic messages with error codes

## User Scenarios & Testing

### Primary User Scenarios

1. **Adding a task via natural language**
   - User says "Add a task to buy groceries tomorrow"
   - System recognizes intent to add a task
   - System creates the task and confirms to the user
   - User receives confirmation of the created task

2. **Listing tasks via natural language**
   - User says "Show me my tasks"
   - System recognizes intent to list tasks
   - System retrieves and displays the user's tasks
   - User sees their task list

3. **Completing a task via natural language**
   - User says "Complete the grocery task"
   - System recognizes intent to complete a task
   - System identifies the specific task
   - System marks the task as completed and confirms
   - User receives confirmation of completion

4. **Updating a task via natural language**
   - User says "Change the grocery task to buy milk and bread"
   - System recognizes intent to update a task
   - System identifies the specific task
   - System updates the task and confirms changes
   - User receives confirmation of changes

5. **Deleting a task via natural language**
   - User says "Delete the grocery task"
   - System recognizes intent to delete a task
   - System identifies the specific task
   - System deletes the task and confirms deletion
   - User receives confirmation of deletion

### Edge Case Scenarios

1. **Ambiguous task references**
   - User refers to a task that could match multiple existing tasks
   - System asks for clarification to identify the correct task

2. **Non-existent tasks**
   - User refers to a task that doesn't exist
   - System informs the user that the task was not found

3. **Unauthorized access**
   - User attempts to access or modify tasks belonging to another user
   - System prevents the operation and informs the user

4. **Malformed requests**
   - User provides input that cannot be interpreted
   - System provides helpful guidance to the user

## Functional Requirements

### Agent Behavior Requirements

1. **Intent Recognition**
   - The AI agent must recognize user intents for adding, listing, updating, completing, and deleting tasks
   - The agent must handle natural language variations for the same intent
   - The agent must provide helpful responses when it cannot understand the user's intent

2. **Task Identification**
   - The agent must correctly identify specific tasks when referenced by name, description, or position
   - When multiple tasks match a reference, the agent must ask for clarification
   - The agent must handle ambiguous references gracefully

3. **Confirmation and Feedback**
   - The agent must confirm successful operations to the user
   - The agent must provide clear error messages when operations fail
   - The agent must maintain conversational context across multiple exchanges

4. **Tool Chaining**
   - When necessary, the agent must chain multiple MCP tools to fulfill a request
   - For example, resolving a task reference before deleting it
   - The agent must maintain state awareness during multi-step operations

### MCP Tool Requirements

1. **add_task(user_id, title, description?)**
   - Must accept a user ID, task title, and optional description
   - Must validate that the user ID is valid and belongs to the requesting user
   - Must create a new task with the provided details
   - Must return the created task details including ID and timestamps
   - Must handle duplicate titles appropriately

2. **list_tasks(user_id, status?)**
   - Must accept a user ID and optional status filter (all, active, completed)
   - Must validate that the user ID is valid and belongs to the requesting user
   - Must return tasks owned by the specified user
   - Must filter by status if provided
   - Must return paginated results if the user has many tasks

3. **complete_task(user_id, task_id)**
   - Must accept a user ID and task ID
   - Must validate that the user owns the specified task
   - Must update the task's completion status to true
   - Must return the updated task details
   - Must handle cases where the task is already completed

4. **delete_task(user_id, task_id)**
   - Must accept a user ID and task ID
   - Must validate that the user owns the specified task
   - Must delete the specified task
   - Must return confirmation of deletion
   - Must handle cases where the task does not exist

5. **update_task(user_id, task_id, title?, description?)**
   - Must accept a user ID, task ID, and optional fields to update
   - Must validate that the user owns the specified task
   - Must update only the provided fields, leaving others unchanged
   - Must return the updated task details
   - Must handle cases where the task does not exist

### API Requirements

1. **POST /api/{user_id}/chat**
   - Must accept a user ID in the path
   - Must accept a request body with conversation_id (optional) and message (required)
   - Must validate the user's authentication and authorization
   - Must load conversation history from the database if conversation_id is provided
   - Must append the new message to the conversation
   - Must execute the AI agent with available MCP tools
   - Must persist the assistant's response in the database
   - Must return conversation_id, response, and tool_calls
   - Must be stateless and idempotent

### Database Requirements

1. **Task Entity**
   - Must store user_id, id, title, description, completed status, created_at, updated_at
   - Must enforce foreign key relationship to user
   - Must have indexes for efficient querying by user_id and completion status
   - Must automatically set created_at and updated_at timestamps

2. **Conversation Entity**
   - Must store user_id, id, created_at, updated_at
   - Must enforce foreign key relationship to user
   - Must have indexes for efficient querying by user_id
   - Must automatically set created_at and updated_at timestamps

3. **Message Entity**
   - Must store user_id, id, conversation_id, role, content, created_at
   - Must enforce foreign key relationships to user and conversation
   - Must have indexes for efficient querying by conversation_id and created_at
   - Must automatically set created_at timestamp
   - Conversation history must be retained for 2 years before archival/deletion

### Frontend UI Requirements

1. **Chat Interface**
   - Must provide a conversational interface for task management
   - Must display messages in chronological order
   - Must support message streaming for real-time responses
   - Must handle loading states during AI processing
   - Must display tool call information when relevant

2. **Conversation Management**
   - Must allow users to resume previous conversations
   - Must indicate the current conversation context
   - Must support starting new conversations
   - Must handle conversation history display

### Security Requirements

1. **Authentication**
   - Must validate user authentication for every request
   - Must use Better Auth for JWT validation
   - Must reject requests with invalid or expired tokens
   - Must securely transmit authentication tokens

2. **Authorization**
   - Must enforce user isolation for all data operations
   - Must validate that users can only access their own data
   - Must prevent cross-user data leakage
   - Must validate ownership before allowing operations
   - Must implement rate limiting at 60 requests per minute per user

## Non-Functional Requirements

### Performance
- The system must respond to user requests within 5 seconds under normal load (defined as up to 100 requests per second)
- The system must handle up to 1,000 concurrent users
- Database queries must complete within 500ms for 95% of requests

### Scalability
- The system must be horizontally scalable
- The server must hold no in-memory session state between requests
- The system must support auto-scaling based on demand

### Availability
- The system must maintain 99.9% uptime during business hours
- The system must gracefully degrade during partial outages
- The system must recover automatically from common failure modes

### Security
- All data must be encrypted in transit using TLS 1.3
- User data must be isolated and inaccessible to other users
- Authentication tokens must expire after 24 hours
- Error responses must use generic messages with error codes to prevent information leakage
- The system must log security-relevant events

## Success Criteria

### Quantitative Measures
- Users can manage tasks entirely through natural language chat interface
- 95% of user requests result in successful task operations
- Average response time is under 3 seconds
- System maintains 99.9% availability
- Conversations persist across server restarts with 100% fidelity

### Qualitative Measures
- Users report high satisfaction with natural language task management
- Users can accomplish all basic task operations (add, list, update, complete, delete) through chat
- Conversations maintain coherent context across multiple exchanges
- Error handling is graceful and provides helpful feedback to users
- The system feels responsive and intuitive during interaction

## Key Entities

### Task
- Represents a user's todo item
- Contains title, description, completion status, and timestamps
- Belongs to a single user
- Completed tasks retained for 2 years before archival/deletion

### Conversation
- Represents a logical grouping of messages between user and AI
- Contains multiple messages in chronological order
- Belongs to a single user

### Message
- Represents a single exchange in a conversation
- Contains content, role (user/assistant), and timestamp
- Belongs to a conversation

## Assumptions

1. The OpenAI Agents SDK and MCP protocol are available and stable
2. Neon PostgreSQL provides adequate performance for the expected load
3. Better Auth provides sufficient authentication and authorization capabilities
4. ChatKit frontend components can be integrated with the backend API
5. Users have reasonable internet connectivity for real-time chat interactions

## Dependencies

1. OpenAI Agents SDK for AI agent functionality
2. MCP (Model Context Protocol) for tool integration
3. Better Auth for authentication and user management
4. Neon PostgreSQL for data persistence
5. FastAPI for backend API framework
6. SQLModel for database ORM
7. ChatKit for frontend chat interface