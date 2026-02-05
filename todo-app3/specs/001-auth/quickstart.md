# Quickstart: Authentication and Security Implementation

## Overview
This guide provides the essential information needed to implement and test the authentication and security system.

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
pip install fastapi python-jose[cryptography] passlib[bcrypt] python-multipart python-dotenv
```

### Database Models
Create the User model with required fields:
```python
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class UserBase(SQLModel):
    email: str = Field(unique=True, nullable=False)

class User(UserBase, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, nullable=False)
    username: Optional[str] = Field(default=None)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    email_verified: bool = False
    last_login_at: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
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

### Authentication Router
Create auth endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## Frontend Setup

### Create Auth Components
- Login form component
- Registration form component
- Protected route wrapper
- Auth context/provider

### Authentication Service
Create service for API communication:
```javascript
export const authService = {
  register: async (email, password, username) => {
    // Call POST /api/auth/register
  },

  login: async (email, password) => {
    // Call POST /api/auth/login
  },

  logout: async () => {
    // Call POST /api/auth/logout
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
JWT_SECRET_KEY=your-jwt-secret-key
```

### Frontend (environment)
Configure API base URL and handle token storage

## User Data Isolation Implementation

### Database Level
- Ensure all user-related tables have user_id foreign keys
- Create database constraints to enforce ownership
- Add indexes on user_id columns for performance

### Application Level
- Middleware to verify user_id in token matches requested resource
- Service layer to validate ownership before operations
- Error responses that don't leak other users' information

### API Implementation
- Add user_id filters to all queries
- Validate user_id in all endpoints that access user data
- Return appropriate errors for unauthorized access attempts

## Testing the Implementation

### Unit Tests
- Test password hashing functions
- Test JWT token creation and verification
- Test user registration validation
- Test user authentication
- Test data isolation controls

### Integration Tests
- Test registration flow with valid data
- Test registration flow with invalid data
- Test login with correct credentials
- Test login with incorrect credentials
- Test protected route access without authentication
- Test attempts to access other users' data

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
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePassword123!", "username": "testuser"}'
```

Login:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePassword123!"}'
```

Access protected endpoint:
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```