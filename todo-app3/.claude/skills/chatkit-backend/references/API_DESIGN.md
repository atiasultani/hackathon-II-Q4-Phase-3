# API Design Reference

## RESTful Endpoints

### User Management
```
POST /api/v1/users/register
POST /api/v1/users/login
GET /api/v1/users/profile
PUT /api/v1/users/profile
DELETE /api/v1/users/account
```

### Conversation Management
```
GET /api/v1/conversations
POST /api/v1/conversations
GET /api/v1/conversations/{id}
PUT /api/v1/conversations/{id}
DELETE /api/v1/conversations/{id}
```

### Message Operations
```
GET /api/v1/conversations/{conversation_id}/messages
POST /api/v1/conversations/{conversation_id}/messages
GET /api/v1/messages/{id}
PUT /api/v1/messages/{id}  # For editing messages
DELETE /api/v1/messages/{id}
```

### File Attachments
```
POST /api/v1/upload
GET /api/v1/files/{file_id}
DELETE /api/v1/files/{file_id}
```

## Response Format

### Success Responses
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2023-01-01T00:00:00Z",
    "request_id": "unique-id"
  }
}
```

### Error Responses
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Pagination
```
GET /api/v1/conversations?page=1&limit=20
```

Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Filtering and Sorting
```
GET /api/v1/messages?conversation_id=123&sort=-created_at&status=read
```