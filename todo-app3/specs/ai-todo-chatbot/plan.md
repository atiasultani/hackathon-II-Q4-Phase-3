# AI-Powered Todo Chatbot Implementation Plan

## Technical Context

### Architecture Overview
The system implements a stateless, scalable AI-powered todo chatbot using the Agentic Dev Stack discipline. The architecture follows a clear separation between the AI agent, MCP tools, API layer, and data persistence layer.

### Technology Stack
- **Frontend**: OpenAI ChatKit for conversational interface
- **Backend**: Python FastAPI for API server
- **AI Processing**: OpenAI Agents SDK for natural language understanding
- **Protocol**: MCP (Model Context Protocol) for tool exposure
- **ORM**: SQLModel for database interactions
- **Database**: Neon Serverless PostgreSQL for persistence
- **Authentication**: Better Auth for user management

### System Components
1. **AI Agent**: Interprets natural language and maps to MCP tools
2. **MCP Tools**: Provides interfaces for task operations
3. **API Layer**: Stateless chat endpoint
4. **Database Layer**: Persistent storage for tasks, conversations, messages
5. **Authentication Layer**: User verification and authorization

### Known Unknowns
- Specific OpenAI model selection for the agent
- MCP server deployment strategy
- Exact rate limiting implementation details
- Database connection pooling configuration
- Frontend deployment strategy

## Constitution Check

### Agentic Dev Stack Discipline
- [x] Following sequence: Write spec → Generate plan → Break into tasks → Implement
- [x] No manual coding allowed - all implementation through Claude Code
- [x] All behavior originates from approved specifications
- [x] Specifications are single source of truth

### AI-Powered Conversational Interface
- [x] Natural language interface for all todo operations
- [x] OpenAI ChatKit frontend implementation
- [x] AI agent detects intent and maps to MCP tools

### Model Context Protocol (MCP) Architecture
- [x] All task operations exposed as MCP tools
- [x] AI agent invokes MCP tools for all actions
- [x] MCP tools remain stateless and persist state only in database

### Stateless and Scalable Design
- [x] Server holds no in-memory session state between requests
- [x] Chat endpoint is stateless and idempotent
- [x] System is horizontally scalable

### Data Persistence and Ownership
- [x] All state persisted in database
- [x] Conversation context from database storage
- [x] User isolation with ownership validation
- [x] No cross-user data leakage

### Specification-Driven Development
- [x] Specifications exist under /specs
- [x] Claude Code references specs before implementation
- [x] All spec changes are versioned

## Phase 0: Research and Unknown Resolution

### research.md

#### Decision: OpenAI Model Selection
- **Rationale**: Using GPT-4 Turbo for optimal balance of capability and cost for natural language understanding in a todo application
- **Alternatives considered**: GPT-3.5 Turbo (lower cost but less capable), GPT-4 (higher cost), custom models (higher complexity)

#### Decision: MCP Server Deployment
- **Rationale**: Embedding MCP server within the main FastAPI application for simplicity and reduced operational overhead
- **Alternatives considered**: Separate MCP server process (better isolation but more complex), Lambda functions (more scalable but higher latency)

#### Decision: Rate Limiting Implementation
- **Rationale**: Using FastAPI middleware with in-memory storage for simplicity, with option to switch to Redis for production clustering
- **Alternatives considered**: Application-level rate limiting (less efficient), API Gateway rate limiting (less flexible), external services

#### Decision: Database Connection Pooling
- **Rationale**: Using SQLModel with standard connection pooling configuration appropriate for expected load
- **Alternatives considered**: Custom connection management, different ORM frameworks, direct database connectors

#### Decision: Frontend Deployment Strategy
- **Rationale**: Deploying ChatKit frontend as static assets served from CDN with API calls to backend
- **Alternatives considered**: SSR solution, mobile app, desktop application

## Phase 1: Design and Contracts

### data-model.md

#### Task Entity
- **Fields**: user_id (UUID, FK), id (UUID, PK), title (VARCHAR(255)), description (TEXT), completed (BOOLEAN), created_at (TIMESTAMP), updated_at (TIMESTAMP)
- **Relationships**: Belongs to User, belongs to zero-or-more Messages (via conversations)
- **Validation**: Title required, length constraints, user ownership validation
- **Indexes**: user_id, user_id+completed, created_at

#### Conversation Entity
- **Fields**: user_id (UUID, FK), id (UUID, PK), created_at (TIMESTAMP), updated_at (TIMESTAMP)
- **Relationships**: Belongs to User, has-many Messages
- **Validation**: User ownership validation
- **Indexes**: user_id, created_at

#### Message Entity
- **Fields**: user_id (UUID, FK), id (UUID, PK), conversation_id (UUID, FK), role (ENUM: user/assistant), content (TEXT), created_at (TIMESTAMP)
- **Relationships**: Belongs to User, Belongs to Conversation
- **Validation**: Role must be valid, content not empty, user ownership
- **Indexes**: conversation_id, conversation_id+created_at, user_id

### API Contracts

#### Chat Endpoint
```yaml
openapi: 3.0.0
info:
  title: AI Todo Chatbot API
  version: 1.0.0
paths:
  /api/{user_id}/chat:
    post:
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                conversation_id:
                  type: string
                message:
                  type: string
              required:
                - message
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  conversation_id:
                    type: string
                  response:
                    type: string
                  tool_calls:
                    type: array
                    items:
                      type: object
        '400':
          description: Bad request
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Rate limited
        '500':
          description: Internal server error
      security:
        - bearerAuth: []
```

### quickstart.md

# Quick Start Guide

## Prerequisites
- Python 3.9+
- PostgreSQL-compatible database (Neon recommended)
- OpenAI API key
- Better Auth account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-name>
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
python -m alembic upgrade head
```

5. Start the development server:
```bash
uvicorn main:app --reload
```

6. Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token validation
- `MCP_SERVER_URL`: URL for MCP server (if separate)

## Testing
Run the test suite:
```bash
pytest
```

## API Documentation
API documentation available at `/docs` when running the server.

## Next Steps
1. Customize the agent behavior in the configuration
2. Add additional MCP tools as needed
3. Extend the UI components for additional functionality

## Agent Context Update

The following technology-specific information has been added to the agent context:

- OpenAI Agents SDK integration patterns
- MCP (Model Context Protocol) implementation guidelines
- SQLModel ORM usage for PostgreSQL
- FastAPI middleware for authentication and rate limiting
- Better Auth JWT validation patterns
- ChatKit frontend integration approaches
- Neon Serverless PostgreSQL connection strategies

## Post-Design Constitution Check

All constitutional principles have been validated in the design:
- [x] Architecture maintains stateless design
- [x] MCP tools follow required contracts
- [x] Authentication is enforced at all levels
- [x] User isolation is maintained in data models
- [x] All components align with specification requirements