# API Contract: Authentication System

## Authentication Endpoints

### POST /api/auth/signup
**Description**: Register a new user with email and password
**Authentication**: None (public endpoint)

**Request**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK)**:
```json
{
  "message": "User registered successfully"
}
```

**Error Responses**:
- 400: Invalid request parameters or weak password
- 409: User already exists
- 500: Internal server error

### POST /api/auth/login
**Description**: Authenticate user with email and password
**Authentication**: None (public endpoint)

**Request**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK)**:
```json
{
  "message": "Login successful"
}
```

**Error Responses**:
- 401: Incorrect email or password
- 401: Account is deactivated

### POST /api/auth/logout
**Description**: Logout the user and clear authentication cookies
**Authentication**: JWT token in HttpOnly cookie

**Request**: Empty body

**Response (200 OK)**:
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/auth/me
**Description**: Get the current authenticated user's information
**Authentication**: JWT token in HttpOnly cookie

**Response (200 OK)**:
```json
{
  "user_id": "string",
  "email": "string"
}
```

**Error Responses**:
- 401: Not authenticated or user not found

## Security Requirements

1. Authentication tokens are stored in HttpOnly cookies for security
2. JWT tokens in cookies are validated for signature and expiration
3. All sensitive data must be encrypted in transit (HTTPS)
4. Passwords are hashed using secure hashing algorithms
5. Authentication state is maintained through cookie-based sessions