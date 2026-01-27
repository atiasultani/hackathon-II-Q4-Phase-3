# API Contract: Chat Endpoint for Todo App

## Endpoint: POST /api/{user_id}/chat

### Description
Main chat endpoint that accepts user messages, processes them through the AI agent, and executes MCP tools as needed for task management operations.

### Request Parameters
Path Parameters:
- `user_id` (string, required): The ID of the authenticated user

### Request Body
```json
{
  "conversation_id": "string (optional)",
  "message": "string (required, 1-10000 characters)",
  "metadata": {
    "client_timestamp": "ISO 8601 timestamp",
    "device_info": "string (optional)"
  }
}
```

### Response Body
```json
{
  "conversation_id": "string",
  "response": "string",
  "tool_calls": [
    {
      "tool_name": "string",
      "arguments": "object",
      "result": "object (if executed)"
    }
  ],
  "tasks_updated": [
    {
      "id": "string",
      "title": "string",
      "completed": "boolean",
      "status": "created|updated|deleted"
    }
  ],
  "timestamp": "ISO 8601 timestamp"
}
```

### Error Responses
- `400 Bad Request`: Invalid input (malformed JSON, missing required fields)
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: User attempting to access another user's data
- `422 Unprocessable Entity`: Semantic validation errors
- `500 Internal Server Error`: Unexpected server errors

### Authentication
- All requests must include valid authentication token
- User ID in path must match authenticated user

### Performance Requirements
- Response time: <200ms p95
- Endpoint must be stateless and idempotent
- Must handle concurrent requests appropriately

## Endpoint: GET /api/tasks

### Description
Retrieve user's tasks with optional filtering and sorting.

### Request Parameters
Query Parameters:
- `user_id` (string, required): The ID of the authenticated user
- `completed` (boolean, optional): Filter by completion status
- `sort_by` (string, optional): Field to sort by (created_at, updated_at, title)
- `order` (string, optional): Sort order (asc, desc)

### Response Body
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string (optional)",
      "completed": "boolean",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp",
      "due_date": "ISO 8601 timestamp (optional)",
      "priority": "string (low|medium|high)"
    }
  ],
  "total_count": "number",
  "filters_applied": "object"
}
```

### Error Responses
- `401 Unauthorized`: Invalid or missing authentication
- `403 Forbidden`: User attempting to access another user's data
- `500 Internal Server Error`: Unexpected server errors