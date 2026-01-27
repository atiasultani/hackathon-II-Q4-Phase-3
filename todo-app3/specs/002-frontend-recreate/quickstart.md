# Quickstart: Frontend Recreation for Professional Todo App

## Prerequisites
- Node.js 18+ installed
- Python 3.11+ installed
- PostgreSQL (or access to Neon Serverless PostgreSQL)

## Setup

### 1. Clone and Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Environment Configuration
Create `.env` files for both frontend and backend:

Frontend (frontend/.env):
```
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_OPENAI_API_KEY=your_openai_key_here
```

Backend (backend/.env):
```
DATABASE_URL=postgresql://username:password@localhost:5432/todo_app
OPENAI_API_KEY=your_openai_key_here
SECRET_KEY=your_secret_key_here
```

### 3. Database Setup
```bash
# Navigate to backend directory
cd backend

# Run database migrations
python -m alembic upgrade head
```

### 4. Start Services

Start backend:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Start frontend:
```bash
cd frontend
npm start
```

## Development Commands

### Frontend
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

### Backend
```bash
uvicorn main:app --reload    # Start development server
pytest                       # Run tests
```

## Architecture Overview

### Frontend Structure
```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ChatInterface/  # Main chat interface
│   │   ├── TaskList/       # Task visualization
│   │   └── common/         # Shared components
│   ├── services/           # API clients and utilities
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles
│   └── App.jsx             # Main application component
└── package.json
```

### Backend Structure
```
backend/
├── src/
│   ├── models/             # Database models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic
│   ├── api/                # API endpoints
│   ├── tools/              # MCP tools
│   └── main.py             # Application entry point
├── alembic/                # Database migrations
└── requirements.txt
```

## Key Endpoints
- POST /api/{user_id}/chat - Main chat endpoint with MCP tool integration
- GET /api/tasks - Retrieve user tasks
- POST /api/tasks - Create new task
- PUT /api/tasks/{id} - Update task
- DELETE /api/tasks/{id} - Delete task