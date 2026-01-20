---
id: 1
title: update-constitution-todo-evolution
stage: constitution
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: todo-evolution
branch: main
user: USER
command: sp.constitution
labels: ["constitution", "todo-app", "ai-chatbot", "spec-driven-development"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - ".specify/memory/constitution.md"
tests: []
outcome: "Updated project constitution to reflect AI-powered todo chatbot requirements with MCP, OpenAI Agents SDK, and stateless architecture principles"
evaluation: "Constitution successfully updated with all required principles for the Evolution of Todo project, including agentic dev stack discipline, AI-powered interface, MCP architecture, stateless design, data persistence, and spec-driven development"
---

# Prompt History Record

## Command
sp.constitution

## Prompt
You are governing the project "Evolution of Todo".

Current Phase: Phase III – AI-Powered Todo Chatbot.
Theme: From CLI to Distributed Cloud-Native AI Systems.

Mission:
Evolve the full-stack Todo system into an AI-powered conversational interface using MCP (Model Context Protocol), OpenAI Agents SDK, Claude Code, and Spec-Kit Plus. Users must manage todos through natural language. The system must be stateless, scalable, and production-grade.

Development Philosophy:
- Follow Agentic Dev Stack strictly: Write spec → Generate plan → Break into tasks → Implement via Claude Code.
- No manual coding is allowed.
- All behavior must originate from approved specifications.
- Specs are the single source of truth.
- Agents and skills must be reusable and composable.
- System must be horizontally scalable and stateless at the server level.

Functional Scope (Must Implement):
- Conversational interface for all basic Todo operations:
  - Add task
  - List tasks
  - Update task
  - Complete task
  - Delete task
- Natural language understanding using OpenAI Agents SDK.
- MCP server exposing task operations as tools.
- Stateless chat endpoint with persistent conversation storage.
- AI agents must invoke MCP tools to perform all task actions.
- MCP tools must also remain stateless and persist state only in the database.

Technology Constraints:
Frontend:
- OpenAI ChatKit

Backend:
- Python FastAPI
- OpenAI Agents SDK
- Official MCP SDK
- SQLModel ORM
- Neon Serverless PostgreSQL
- Better Auth for authentication

Architecture Rules:
- Frontend communicates with a single chat endpoint.
- Backend chat endpoint builds conversation context from database.
- OpenAI Agent processes user input and selects MCP tools.
- MCP server executes tools and persists state.
- Server holds no in-memory session state between requests.

Database Models Must Exist:
- Task(user_id, id, title, description, completed, created_at, updated_at)
- Conversation(user_id, id, created_at, updated_at)
- Message(user_id, id, conversation_id, role, content, created_at)

API Contract:
POST /api/{user_id}/chat
- Input: conversation_id (optional), message (required)
- Output: conversation_id, response, tool_calls
- Endpoint must be stateless and idempotent.

MCP Tools Must Be Exposed:
- add_task(user_id, title, description?)
- list_tasks(user_id, status?)
- complete_task(user_id, task_id)
- delete_task(user_id, task_id)
- update_task(user_id, task_id, title?, description?)

Each tool:
- Must validate ownership
- Must persist state in database
- Must return structured output

Agent Behavioral Rules:
- Detect intent and map to correct MCP tool.
- Chain tools when necessary (e.g., resolve task before delete).
- Always confirm successful actions.
- Gracefully handle errors and missing tasks.
- Maintain conversational continuity via stored history.

Conversation Flow Rules:
1. Receive request
2. Load conversation + messages from database
3. Append new user message
4. Run agent with MCP tools
5. Persist assistant response
6. Return response
7. Server must retain no runtime memory

Security Rules:
- Authentication enforced using Better Auth.
- User identity must be verified for every request.
- All task and conversation operations must be user-isolated.
- No cross-user data leakage allowed.

Repository & Spec Governance:
- Monorepo structure required.
- Specs must exist under /specs for:
  - agent behavior
  - MCP tools
  - API contracts
  - database schema
  - UI behavior
- Claude Code must always reference specs before implementation.
- All spec changes must be versioned.

Deliverables:
- /frontend ChatKit UI
- /backend FastAPI + Agents SDK + MCP server
- /specs with complete agent and tool specifications
- Database migrations
- README with setup instructions
- Fully working chatbot demonstrating:
  - Natural language task management
  - Persistent conversations
  - Stateless scalability
  - Tool-driven execution
  - Error resilience

Success Criteria:
- Users can manage tasks entirely through chat.
- Conversations persist across server restarts.
- MCP tools correctly control all task operations.
- Server remains stateless and horizontally scalable.
- Specs accurately govern all behavior.
- System is ready for distributed and AI-native evolution.

## Response
Updated project constitution to reflect AI-powered todo chatbot requirements with MCP, OpenAI Agents SDK, and stateless architecture principles