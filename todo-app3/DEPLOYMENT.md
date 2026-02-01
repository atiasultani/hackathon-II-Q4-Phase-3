# AI-Powered Todo Chatbot - Deployment Guide

## Deployment Overview

This application consists of:
- **Backend**: FastAPI server with AI-powered task management
- **Frontend**: React-based chat interface

## Deploying Backend to Hugging Face Spaces

### Prerequisites
- Hugging Face account
- Git repository with the backend code

### Steps
1. Create a new Space on Hugging Face
2. Choose "Docker" as the SDK
3. Point to your repository containing the backend code
4. Set the required environment variables in Space Secrets:

```
DATABASE_URL=postgresql://username:password@host:port/database_name
SECRET_KEY=your-super-secret-jwt-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### Required Secrets
- `DATABASE_URL`: PostgreSQL database connection string
- `SECRET_KEY`: JWT secret for authentication
- `OPENAI_API_KEY`: OpenAI API key for AI features

### Optional Secrets
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration (default: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS`: Refresh token expiration (default: 7)
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-3.5-turbo)

## Deploying Frontend to Vercel

### Prerequisites
- Vercel account
- Git repository with the frontend code

### Steps
1. Fork the repository containing the frontend code
2. Import the project into Vercel
3. Set environment variables in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-hf-space-username.hf.space
```

### Environment Variables
- `NEXT_PUBLIC_API_URL`: URL of your deployed Hugging Face backend

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python -c "import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Authentication
- `POST /api/token?user_id={user_id}` - Get authentication token
- `POST /api/auth/login` - Login endpoint

### Chat Operations
- `POST /api/{user_id}/chat` - Chat with the AI assistant

## Troubleshooting

### Common Issues
- Ensure CORS settings allow your frontend domain
- Verify database connection in production
- Check JWT secret consistency between frontend and backend
- Confirm API URLs are properly configured

### Health Check
- `GET /health` - Check server health
- `GET /` - Root endpoint

## Architecture

The application follows the spec-driven development approach with:
- AI-powered intent classification
- MCP (Model Context Protocol) tools for task operations
- Secure JWT-based authentication
- PostgreSQL database for persistence
- React frontend with chat interface