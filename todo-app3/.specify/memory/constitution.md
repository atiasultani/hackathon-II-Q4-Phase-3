<!--
Sync Impact Report:
Version change: 1.0.0 → 1.0.1
Modified principles: None (new constitution created)
Added sections: Core Principles for AI-Powered Todo Chatbot
Removed sections: None
Templates requiring updates: ✅ Updated /specs/agent-behavior/spec.md, ✅ Updated /specs/mcp-tools/spec.md, ✅ Updated /specs/api-contracts/spec.md, ✅ Updated /specs/database-schema/spec.md, ✅ Updated /specs/ui-behavior/spec.md
Follow-up TODOs: None
-->
# Evolution of Todo Constitution

## Core Principles

### I. Agentic Dev Stack Discipline
All development must follow the strict sequence: Write spec → Generate plan → Break into tasks → Implement via Claude Code. No manual coding is allowed. All behavior must originate from approved specifications. Specifications are the single source of truth for all system behavior.

### II. AI-Powered Conversational Interface
The system must provide a natural language interface for all todo operations. Users interact through OpenAI ChatKit frontend with natural language understanding. The AI agent must detect intent and map to correct MCP tools for all operations.

### III. Model Context Protocol (MCP) Architecture
All task operations must be exposed as MCP tools. The AI agent must invoke MCP tools to perform all task actions. MCP tools must remain stateless and persist state only in the database. Tools include: add_task, list_tasks, complete_task, delete_task, update_task.

### IV. Stateless and Scalable Design
The system must be stateless at the server level. The server holds no in-memory session state between requests. The chat endpoint must be stateless and idempotent. The system must be horizontally scalable and production-grade.

### V. Data Persistence and Ownership
All state must be persisted in the database. The system must maintain conversation context from database storage. All task and conversation operations must be user-isolated with ownership validation. No cross-user data leakage is allowed.

### VI. Specification-Driven Development
Specifications are the single source of truth. All specs must exist under /specs for: agent behavior, MCP tools, API contracts, database schema, and UI behavior. Claude Code must always reference specs before implementation. All spec changes must be versioned.

## Technology Stack Requirements

### Frontend Architecture
- OpenAI ChatKit must be used for the conversational interface
- Frontend communicates with a single chat endpoint
- UI must support natural language task management

### Backend Architecture
- Python FastAPI for the backend server
- OpenAI Agents SDK for natural language understanding
- Official MCP SDK for tool exposure
- SQLModel ORM for database interactions
- Neon Serverless PostgreSQL for persistence
- Better Auth for authentication

## Database Schema Requirements

### Required Models
The following database models must exist:
- Task(user_id, id, title, description, completed, created_at, updated_at)
- Conversation(user_id, id, created_at, updated_at)
- Message(user_id, id, conversation_id, role, content, created_at)

### Data Integrity
- All models must enforce proper relationships
- Foreign key constraints must validate ownership
- Timestamps must be automatically managed
- User isolation must be enforced at the database level

## API Contract Standards

### Chat Endpoint Specification
POST /api/{user_id}/chat
- Input: conversation_id (optional), message (required)
- Output: conversation_id, response, tool_calls
- Endpoint must be stateless and idempotent
- Authentication must be verified for every request

### Response Format
- Responses must include structured output
- Tool calls must be properly formatted
- Error handling must follow consistent patterns
- Conversation continuity must be maintained

## Agent Behavioral Rules

### Intent Detection
- Agent must detect user intent accurately
- Correct MCP tool must be mapped to each intent
- Tool chaining must occur when necessary (e.g., resolve task before delete)
- Ambiguous requests must be clarified with user

### Error Handling
- Always confirm successful actions
- Gracefully handle errors and missing tasks
- Provide helpful error messages to users
- Maintain conversational context during errors

### Response Quality
- Responses must be natural and conversational
- Action confirmations must be clear and informative
- Status updates must be timely and accurate
- User experience must be smooth and intuitive

## Security Requirements

### Authentication
- Better Auth must be enforced for every request
- User identity must be verified for every operation
- Session management must be secure
- Token validation must occur on each request

### Data Protection
- All operations must validate user ownership
- Cross-user data access must be prevented
- Sensitive data must be properly protected
- Audit trails must be maintained for critical operations

## Governance

### Amendment Process
Changes to this constitution require:
1. Formal proposal with justification
2. Technical review and approval
3. Update to all dependent specifications
4. Version increment with proper changelog

### Versioning Policy
- MAJOR: Backward incompatible governance/principle removals
- MINOR: New principles or materially expanded guidance
- PATCH: Clarifications, wording, or non-semantic refinements

### Compliance Review
All implementations must verify compliance with these principles:
- Code reviews must validate constitutional adherence
- Specifications must align with constitutional requirements
- Testing must cover constitutional compliance
- Documentation must reflect constitutional principles

**Version**: 1.0.1 | **Ratified**: 2026-01-19 | **Last Amended**: 2026-01-19