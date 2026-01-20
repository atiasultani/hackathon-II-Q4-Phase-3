# AI-Powered Todo Chatbot

This project implements an AI-powered conversational Todo system that allows users to manage their tasks through natural language interaction. The system leverages OpenAI Agents SDK, MCP (Model Context Protocol), FastAPI, ChatKit, SQLModel, Neon PostgreSQL, and Better Auth to provide a stateless, scalable, and fully spec-driven solution.

## Features

- Natural language processing for task management using advanced intent classification
- Add, list, complete, update, and delete tasks via chat
- User authentication and authorization with JWT tokens
- Rate limiting for API protection (60 requests per minute per user)
- Conversation history management with context injection
- Task ownership validation and user isolation
- 2-year retention policy for conversations and data
- Entity extraction for intelligent task parsing
- Context-aware task recommendations
- Multi-step task workflows
- AI-powered task categorization
- Persistent conversation history
- Multi-user support with proper isolation
- Tool-driven architecture using MCP
- Stateless, horizontally scalable design
- Real-time chat interface with streaming responses

## Architecture

The system follows a clear separation between components:

1. **AI Agent**: Interprets natural language and maps to MCP tools
2. **MCP Tools**: Provide interfaces for task operations
3. **API Layer**: Stateless chat endpoint
4. **Database Layer**: Persistent storage for tasks, conversations, messages
5. **Authentication Layer**: User verification and authorization
6. **NLP Layer**: Intent classification and entity extraction for sophisticated language understanding

### AI Agent Features
- **Intent Classification**: Recognizes ADD, LIST, COMPLETE, UPDATE, DELETE task intents
- **Entity Extraction**: Parses task titles, descriptions, and other details from natural language
- **Context Injection**: Uses conversation history for better understanding
- **Confidence Scoring**: Determines when the AI is uncertain about intent

### Data Models
- **Task**: User-owned tasks with title, description, completion status, and timestamps
- **Conversation**: User-owned conversation threads with timestamps
- **Message**: Individual messages within conversations with role-based access

## Technology Stack

- **Frontend**: OpenAI ChatKit
- **Backend**: Python FastAPI
- **AI Processing**: OpenAI Agents SDK
- **Protocol**: MCP (Model Context Protocol)
- **NLP**: Custom intent classifier with regex patterns and confidence scoring
- **ORM**: SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth
- **Testing**: PyTest for backend validation

## API Endpoints

### Chat Endpoint
- **POST** `/api/{user_id}/chat`
- Accepts user messages and returns AI-generated responses
- Supports conversation continuity with `conversation_id`
- Returns tool calls and structured responses

### Authentication
- JWT token validation for all endpoints
- User ID verification to prevent unauthorized access
- Automatic token refresh mechanisms

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL-compatible database (Neon recommended)
- OpenAI API key
- Better Auth account

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-name>
```

2. Set up the backend:
```bash
cd backend
# Activate virtual environment (if using one)
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

5. Run database migrations:
```bash
cd backend
python -m alembic upgrade head
```

6. Start both servers:
```bash
# Terminal 1: Start backend server
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload

# Terminal 2: Start frontend server
cd frontend
npm run dev
```

The backend API will be available at `http://localhost:8000` and the frontend will be available at `http://localhost:3000`.

## API Documentation

API documentation is available at `/docs` when running the server.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token validation
- `MCP_SERVER_URL`: URL for MCP server (if separate)
- `BETTER_AUTH_URL`: Better Auth instance URL
- `BETTER_AUTH_SECRET`: Better Auth secret
- `RATE_LIMIT_PER_MINUTE`: Rate limit for requests per user per minute

## Security Measures

- JWT token validation on all endpoints
- User ID verification to prevent cross-user data access
- Rate limiting to prevent abuse
- Input validation and sanitization
- Ownership validation for all data operations

## Testing

Comprehensive test suite covering:
- MCP tool functionality
- Database operations
- Authentication middleware
- Rate limiting
- API endpoints
- Intent classification

Run tests with: `pytest`

## Production Considerations

- Use of serverless PostgreSQL for scalability
- Stateless design for horizontal scaling
- Proper error handling and logging
- Rate limiting to prevent abuse
- 2-year data retention policy compliance
- Secure authentication with token expiration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.