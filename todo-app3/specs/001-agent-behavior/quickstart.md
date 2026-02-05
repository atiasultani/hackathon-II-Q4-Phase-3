# Quickstart: AI Todo Chatbot Agent Behavior

## Overview
This guide provides the essential information needed to implement and test the AI agent behavior feature for the todo chatbot.

## Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed
- PostgreSQL-compatible database (Neon recommended)
- OpenAI API key configured
- Git repository cloned and set up

## Backend Setup

### Install Dependencies
```bash
cd backend
pip install openai fastapi sqlmodel pydantic python-jose[cryptography] python-multipart
```

### Core Agent Components
Create the following components:

1. **Todo Agent** (`src/agents/todo_agent.py`):
   - Main AI agent class that processes natural language
   - Intent detection and classification
   - MCP tool mapping and execution
   - Context management and conversation flow

2. **Intent Detection Service** (`src/services/intent_detection.py`):
   - Natural language processing
   - Intent classification (ADD, LIST, COMPLETE, DELETE, UPDATE)
   - Entity extraction from user input
   - Confidence scoring and ambiguity handling

3. **Context Manager** (`src/services/context_manager.py`):
   - Conversation history retrieval and storage
   - Context window management
   - Task reference resolution
   - Cross-exchange state maintenance

4. **Task Resolver** (`src/services/task_resolver.py`):
   - Maps natural language references to specific tasks
   - Handles ambiguous references and disambiguation
   - Provides options when multiple tasks match
   - Manages positional and contextual references

### API Endpoint
Create the main chat endpoint:
- POST /api/{user_id}/chat
- Handles natural language input
- Manages conversation context
- Returns structured responses with tool calls

## Frontend Setup

### Chat Interface Component
Create the main chat interface:
- Real-time message display
- Natural language input handling
- Response rendering with rich formatting
- Loading states during processing

### Chat Service
Create service for API communication:
```javascript
export const chatService = {
  sendMessage: async (userId, conversationId, message, context) => {
    // Call POST /api/{user_id}/chat endpoint
  },

  getConversationHistory: async (userId, conversationId, limit) => {
    // Call GET /api/{user_id}/conversations/{conversation_id}/messages
  },

  getConversations: async (userId) => {
    // Call GET /api/{user_id}/conversations
  }
};
```

## Environment Configuration

### Backend (.env)
```
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname
JWT_SECRET=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (environment)
Configure API base URL and handle authentication tokens

## Testing the Implementation

### Unit Tests
- Test intent detection functions
- Test context management logic
- Test task reference resolution
- Test response generation

### Integration Tests
- Test natural language processing end-to-end
- Test conversation context maintenance
- Test MCP tool mapping and execution
- Test error handling scenarios

### User Flow Tests
- Test ADD task intent with various natural language forms
- Test LIST tasks with different query variations
- Test COMPLETE task with different reference styles
- Test ambiguous reference resolution
- Test context-aware responses

## Running the Application

### Backend
```bash
cd backend
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

## API Testing
You can test the chat endpoint using curl or a tool like Postman:

Send a message:
```bash
curl -X POST http://localhost:8000/api/user123/chat \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add a task to call mom at 3 PM",
    "conversation_id": "conv-abc-123"
  }'
```

Get conversation history:
```bash
curl -X GET http://localhost:8000/api/user123/conversations/conv-abc-123/messages \
  -H "Authorization: Bearer your-jwt-token"
```

## Expected Behaviors

### Intent Detection
- "Add a task to call mom" → ADD_TASK intent
- "What do I have to do?" → LIST_TASKS intent
- "Complete the first one" → COMPLETE_TASK with positional reference
- "Delete my meeting" → DELETE_TASK with title reference
- "Update the grocery list" → UPDATE_TASK with title reference

### Context Management
- Maintain conversation history across exchanges
- Resolve contextual references like "that one" or "the previous task"
- Handle ambiguous references by asking for clarification
- Manage context window size to maintain performance

### Error Handling
- Gracefully handle unrecognized intents
- Provide helpful responses when context is unclear
- Maintain conversation flow during errors
- Respond appropriately to requests outside scope