# Professional Setup Guide: AI-Powered Todo Chatbot

## Overview
This document provides a comprehensive guide to setting up and running the AI-powered Todo Chatbot application with both frontend and backend servers working together professionally.

## Architecture
- **Backend**: Python/FastAPI server with PostgreSQL database using SQLModel ORM
- **Frontend**: Next.js/React application with TypeScript
- **Authentication**: JWT-based with HttpOnly cookies
- **AI/ML Integration**: Natural language processing for task management

## Prerequisites
- Python 3.9+
- Node.js 18+ (with npm)
- Poetry (dependency manager for Python)
- PostgreSQL (optional, can use SQLite for development)

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

3. Install additional email validation dependency:
   ```bash
   poetry add "pydantic[email]"
   ```

4. Set up environment variables:
   Copy the `.env.example` file to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

   At minimum, configure:
   - `JWT_SECRET`: A secure random string for JWT signing
   - `DATABASE_URL`: Database connection string (use SQLite for simplicity: `sqlite:///./todo_chatbot.db`)
   - `OPENAI_API_KEY`: Your OpenAI API key (optional for basic functionality)

5. Start the backend server:
   ```bash
   poetry run python main.py
   ```
   Or use uvicorn directly:
   ```bash
   poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

6. The backend will be available at `http://localhost:8000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create `.env.local` file with:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

4. Start the frontend server:
   ```bash
   npm run dev
   ```

5. The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Chat & Tasks
- `POST /api/chat` - Main chat interface with AI processing
- `GET /api/health` - Health check endpoint

## Security Features
- HttpOnly cookies for JWT storage (prevents XSS attacks)
- CSRF protection with SameSite=Lax policy
- Bcrypt password hashing
- Input validation and sanitization
- Rate limiting middleware

## Integration Details
- Frontend communicates with backend via REST API
- Authentication tokens stored in HttpOnly cookies
- CORS configured to allow local development origins
- Proper error handling and response formatting

## Running Both Servers Simultaneously
For development, you can use the provided script:
```bash
./start-dev.sh
```

This will start both servers in the background and provide their respective URLs.

## Troubleshooting

### Common Issues:
1. **Port conflicts**: Make sure ports 8000 (backend) and 3000 (frontend) are free
2. **Environment variables**: Ensure all required environment variables are set
3. **Dependency conflicts**: Use Poetry for Python dependencies and npm for frontend
4. **Database connection**: Verify DATABASE_URL is properly configured

### Frontend Build Issues:
- If you encounter issues with Next.js configuration, ensure you're using the correct export syntax for ES modules

### Backend Startup Issues:
- Ensure Python environment is activated when using Poetry
- Check that all environment variables are properly set

## Production Considerations
- Restrict CORS origins in production
- Use secure, long JWT secrets
- Implement proper SSL certificates
- Configure proper database connections
- Set up proper logging and monitoring
- Disable debug/reload modes in production

## Testing the Integration
1. Start both servers
2. Visit `http://localhost:3000` in your browser
3. Register a new account using the signup form
4. Verify that authentication works properly
5. Test the chat functionality to ensure AI integration is working

## Monitoring
- Backend server provides health check at `/health`
- Monitor logs for both servers during development
- Check browser developer tools for frontend network requests