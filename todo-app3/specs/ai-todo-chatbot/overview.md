# Overview of AI-Powered Todo Chatbot

## Purpose
This document provides a high-level overview of the AI-powered todo chatbot system, which represents Phase III of the "Evolution of Todo" project. The system transforms traditional todo list management into a natural language conversational interface.

## System Components
- **AI Agent**: Interprets natural language and maps to MCP tools
- **MCP Tools**: Provide the interface between AI and todo operations
- **Chat API**: Stateless endpoint for frontend communication
- **Database**: Persistent storage for tasks, conversations, and messages
- **Frontend UI**: ChatKit-based interface for user interaction
- **Authentication**: Better Auth-based user verification and authorization
- **System Architecture**: Stateless, scalable design with clear component separation

## Key Features
- Natural language task management (add, list, update, complete, delete)
- Persistent conversation history
- Multi-user support with proper isolation
- Tool-driven architecture using MCP
- Stateless, horizontally scalable design
- Real-time chat interface with streaming responses

## Technology Stack
- Frontend: OpenAI ChatKit
- Backend: Python FastAPI
- AI: OpenAI Agents SDK
- Protocol: MCP (Model Context Protocol)
- ORM: SQLModel
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth

## Architecture Principles
- Specification-driven development
- Agentic Dev Stack discipline
- Stateless server design
- MCP-first architecture
- Security-first approach with user isolation
- Scalable and resilient design