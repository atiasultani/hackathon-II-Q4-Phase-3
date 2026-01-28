# Todo App Backend - Hugging Face Deployment

This is the backend for the AI-Powered Todo Chatbot System, designed for deployment on Hugging Face Spaces using Docker.

## Features

- FastAPI-based REST API
- PostgreSQL database integration
- JWT-based authentication
- AI-powered chat functionality
- Real-time task management

## Deployment on Hugging Face Spaces

To deploy this backend on Hugging Face Spaces:

1. Create a new Space with Docker Container option
2. Point the repository to this backend folder
3. Make sure to set the required environment variables in the Space settings

## Required Environment Variables

Add these as Secrets in your Hugging Face Space settings:

```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-super-secret-jwt-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
```

## Architecture

- The application runs on port 7860 (as required by Hugging Face Spaces)
- Uses Uvicorn as the ASGI server
- Implements proper CORS handling for frontend integration
- Includes health check endpoints

## Endpoints

- `GET /health` - Health check
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/tasks` - Get user tasks
- `POST /api/v1/tasks` - Create new task
- `POST /api/v1/chat` - AI-powered chat functionality
- And more API endpoints...

## Local Development

For local development, use the provided start-dev.sh script:

```bash
./start-dev.sh
```

## Database Migrations

The application uses Alembic for database migrations. When deployed, you may need to run migrations manually or set up an init script to run migrations on startup.