# Quickstart: MCP Tools Implementation

## Overview
This guide provides the essential information needed to implement and test the MCP (Model Context Protocol) tools for the AI-powered todo chatbot system.

## Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed
- PostgreSQL-compatible database (Neon recommended)
- Git repository cloned and set up

## Backend Setup

### Install Dependencies
```bash
cd backend
pip install fastapi sqlmodel python-jose[cryptography] passlib[bcrypt] python-multipart python-dotenv
```

### MCP Tools Structure
The MCP tools are located in `backend/src/mcp/` and include:

1. `add_task_tool.py` - Creates new tasks based on user requests
2. `list_tasks_tool.py` - Retrieves user's tasks
3. `complete_task_tool.py` - Marks tasks as completed
4. `update_task_tool.py` - Modifies existing tasks
5. `delete_task_tool.py` - Removes tasks

### Database Models
Ensure the Task model includes all required fields:

```python
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    title: str = Field(nullable=False, max_length=255)
    description: Optional[str] = Field(default=None)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Security Utilities
Create JWT and password utilities:

```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### MCP Tool Implementation Pattern
Each MCP tool should follow this pattern:

```python
from typing import Dict, Any, Optional
from uuid import UUID
from ..services.database_service import DatabaseService
from ..decorators.authz import require_user_ownership

class AddTaskTool:
    """
    MCP tool for adding tasks:
    add_task(user_id, title, description?)
    """

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    @require_user_ownership
    def run(self, user_id: str, title: str, description: Optional[str] = None) -> Dict[str, Any]:
        # Implementation here
        pass
```

## Frontend Setup

### MCP Tool Integration
The chat interface should be able to recognize user intents and call appropriate MCP tools:

1. Parse user input to identify intent (add, list, complete, update, delete)
2. Call appropriate MCP tool with proper authentication
3. Format results back to natural language response

### Authentication Integration
Ensure all MCP tool calls are properly authenticated:

```javascript
// Example of how MCP tools might be called from the frontend
const callMcpTool = async (toolName, params) => {
  const response = await fetch(`/api/mcp/${toolName}`, {
    method: 'POST',
    credentials: 'include', // Include authentication cookies
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });

  return response.json();
};
```

## Environment Configuration

### Backend (.env)
```
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://user:pass@localhost/dbname
JWT_SECRET_KEY=your-jwt-secret-key
```

## MCP Tool Authorization Implementation

### Authorization Decorator
All MCP tools should use the authorization decorator to ensure users can only operate on their own data:

```python
from functools import wraps
from fastapi import HTTPException, status
from uuid import UUID

def require_user_ownership(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        # Implementation to verify user owns the resource
        pass
    return wrapper
```

## Testing the Implementation

### Unit Tests
- Test MCP tool functions individually
- Test authorization checks
- Test error handling
- Test data validation

### Integration Tests
- Test MCP tools with database service
- Test end-to-end chat flow with MCP tool calls
- Test authentication and authorization flows
- Test edge cases and error conditions

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
MCP tools are integrated into the chat endpoint and called automatically when the AI system detects appropriate user intents. The tools will execute with proper user context and return structured responses that can be translated back to natural language for the user.