# API Contract: Authentication System

## Authentication Endpoints

### POST /api/token
**Description**: Obtain authentication token for a user
**Authentication**: None (public endpoint)

**Request**:
```json
{
  "user_id": "string"
}
```

**Query Parameters**:
- user_id: String identifier for the user requesting a token

**Response (200 OK)**:
```json
{
  "access_token": "string",
  "token_type": "string"
}
```

**Error Responses**:
- 400: Invalid request parameters
- 404: User not found

### POST /api/login
**Description**: Authenticate user with credentials
**Authentication**: None (public endpoint)

**Request**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK)**:
```json
{
  "access_token": "string",
  "token_type": "string"
}
```

## Protected Endpoints

### POST /api/{user_id}/chat
**Description**: Send chat message (requires authentication)
**Authentication**: Bearer token required

**Headers**:
- Authorization: "Bearer {token}"

**Path Parameters**:
- user_id: String identifier for the user (must match token)

**Request**:
```json
{
  "message": "string",
  "conversation_id": "string"
}
```

**Response (200 OK)**:
```json
{
  "conversation_id": "string",
  "response": "string",
  "tool_calls": "array"
}
```

**Error Responses**:
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden (user mismatch or insufficient permissions)
- 400: Bad request (invalid message format)

### GET /api/users/{user_id}/tasks
**Description**: Get user's tasks (requires authentication)
**Authentication**: Bearer token required

**Headers**:
- Authorization: "Bearer {token}"

**Path Parameters**:
- user_id: String identifier for the user (must match token)

**Response (200 OK)**:
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "completed": "boolean"
    }
  ]
}
```

### PUT /api/tasks/{task_id}
**Description**: Update a task (requires authentication)
**Authentication**: Bearer token required

**Headers**:
- Authorization: "Bearer {token}"

**Path Parameters**:
- task_id: String identifier for the task

**Request**:
```json
{
  "title": "string",
  "description": "string",
  "completed": "boolean"
}
```

### DELETE /api/tasks/{task_id}
**Description**: Delete a task (requires authentication)
**Authentication**: Bearer token required

**Headers**:
- Authorization: "Bearer {token}"

**Path Parameters**:
- task_id: String identifier for the task

**Response (200 OK)**:
```json
{
  "success": "boolean"
}
```

## Security Requirements

1. All protected endpoints must validate the Authorization header
2. The user_id in the path must match the user_id in the JWT token
3. JWT tokens must be validated for signature and expiration
4. All sensitive data must be encrypted in transit (HTTPS)