# Quickstart: Authentication Integration

## Overview
This guide provides the essential information needed to implement and test the authentication integration feature.

## Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed
- PostgreSQL-compatible database (Neon recommended)
- Better Auth account configured
- Git repository cloned and set up

## Backend Setup

### Install Dependencies
```bash
cd backend
pip install fastapi sqlmodel pydantic bcrypt python-jose[cryptography] python-multipart
```

### Database Models
Create the User model with required fields:
```python
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class UserBase(SQLModel):
    email: str = Field(unique=True, nullable=False)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, nullable=False)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
```

### Security Utilities
Create password hashing utilities:
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)
```

### Authentication Router
Create auth endpoints:
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout
- GET /api/auth/me

## Frontend Setup

### Create Auth Components
- Signup form component
- Signin form component
- Protected route wrapper
- Auth context/provider

### Authentication Service
Create service for API communication:
```javascript
export const authService = {
  signup: async (email, password) => {
    // Call POST /api/auth/signup
  },

  signin: async (email, password) => {
    // Call POST /api/auth/signin
  },

  signout: async () => {
    // Call POST /api/auth/signout
  },

  getCurrentUser: async (token) => {
    // Call GET /api/auth/me with Authorization header
  }
};
```

## Environment Configuration

### Backend (.env)
```
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://user:pass@localhost/dbname
```

### Frontend (environment)
Configure API base URL and handle token storage

## Testing the Implementation

### Unit Tests
- Test password hashing functions
- Test JWT token creation and verification
- Test user registration validation
- Test user authentication

### Integration Tests
- Test registration flow with valid data
- Test registration flow with invalid data
- Test sign-in with correct credentials
- Test sign-in with incorrect credentials
- Test protected route access without authentication

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
You can test the authentication endpoints using curl or a tool like Postman:

Register a new user:
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

Sign in:
```bash
curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```