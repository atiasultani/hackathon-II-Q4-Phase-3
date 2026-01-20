# MCP Tools Specification

## Purpose
The MCP (Model Context Protocol) tools provide the interface between the AI agent and the underlying todo management system. Each tool corresponds to a specific operation that can be performed on tasks.

## Tool Contracts

### add_task(user_id, title, description?)

**Inputs:**
- user_id (string, required): The ID of the user making the request
- title (string, required): The title of the task to create
- description (string, optional): The description of the task

**Validation Rules:**
- user_id must be a valid user identifier
- title must be provided and not empty (minimum 1 character)
- title must not exceed 255 characters
- description, if provided, must not exceed 1000 characters

**Ownership Enforcement:**
- Must verify that the user_id belongs to the authenticated user
- Must ensure the task is created with the correct user ownership

**Database Effects:**
- Creates a new record in the tasks table
- Sets completed status to false by default
- Sets created_at and updated_at to current timestamp
- Assigns a unique ID to the task

**Return Schema:**
```json
{
  "success": true,
  "task": {
    "id": "string",
    "user_id": "string",
    "title": "string",
    "description": "string",
    "completed": false,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "message": "Task created successfully"
}
```

**Error Scenarios:**
- Invalid user_id: Return error with code "INVALID_USER"
- Empty title: Return error with code "EMPTY_TITLE"
- Title too long: Return error with code "TITLE_TOO_LONG"
- Database error: Return error with code "DATABASE_ERROR"

**Idempotency Expectations:**
- This operation is not idempotent - multiple calls will create multiple tasks

### list_tasks(user_id, status?)

**Inputs:**
- user_id (string, required): The ID of the user making the request
- status (string, optional): Filter by task status ("all", "active", "completed"); defaults to "all"

**Validation Rules:**
- user_id must be a valid user identifier
- status, if provided, must be one of "all", "active", "completed"

**Ownership Enforcement:**
- Must verify that the user_id belongs to the authenticated user
- Must only return tasks owned by the specified user

**Database Effects:**
- Reads from the tasks table
- Applies filters based on user_id and status
- Orders results by creation date (most recent first)
- Limits results to prevent excessive data transfer

**Return Schema:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "string",
      "user_id": "string",
      "title": "string",
      "description": "string",
      "completed": boolean,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "count": integer,
  "filters": {
    "status": "string"
  }
}
```

**Error Scenarios:**
- Invalid user_id: Return error with code "INVALID_USER"
- Invalid status parameter: Return error with code "INVALID_STATUS"
- Database error: Return error with code "DATABASE_ERROR"

**Idempotency Expectations:**
- This operation is idempotent - multiple calls will return the same results (assuming no changes to tasks)

### complete_task(user_id, task_id)

**Inputs:**
- user_id (string, required): The ID of the user making the request
- task_id (string, required): The ID of the task to complete

**Validation Rules:**
- user_id must be a valid user identifier
- task_id must be a valid task identifier
- The task must exist in the database

**Ownership Enforcement:**
- Must verify that the user_id belongs to the authenticated user
- Must verify that the task belongs to the specified user

**Database Effects:**
- Updates the completed field to true in the tasks table
- Updates the updated_at timestamp to current time
- Does not modify other fields

**Return Schema:**
```json
{
  "success": true,
  "task": {
    "id": "string",
    "user_id": "string",
    "title": "string",
    "description": "string",
    "completed": true,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "message": "Task completed successfully"
}
```

**Error Scenarios:**
- Invalid user_id: Return error with code "INVALID_USER"
- Invalid task_id: Return error with code "INVALID_TASK"
- Task not found: Return error with code "TASK_NOT_FOUND"
- Task already completed: Return error with code "TASK_ALREADY_COMPLETED"
- Ownership mismatch: Return error with code "OWNERSHIP_MISMATCH"
- Database error: Return error with code "DATABASE_ERROR"

**Idempotency Expectations:**
- This operation is idempotent for the same state - multiple calls after the task is completed will return success

### delete_task(user_id, task_id)

**Inputs:**
- user_id (string, required): The ID of the user making the request
- task_id (string, required): The ID of the task to delete

**Validation Rules:**
- user_id must be a valid user identifier
- task_id must be a valid task identifier
- The task must exist in the database

**Ownership Enforcement:**
- Must verify that the user_id belongs to the authenticated user
- Must verify that the task belongs to the specified user

**Database Effects:**
- Deletes the record from the tasks table
- May cascade delete related records if any exist
- Does not affect other tasks or user data

**Return Schema:**
```json
{
  "success": true,
  "task_id": "string",
  "message": "Task deleted successfully"
}
```

**Error Scenarios:**
- Invalid user_id: Return error with code "INVALID_USER"
- Invalid task_id: Return error with code "INVALID_TASK"
- Task not found: Return error with code "TASK_NOT_FOUND"
- Ownership mismatch: Return error with code "OWNERSHIP_MISMATCH"
- Database error: Return error with code "DATABASE_ERROR"

**Idempotency Expectations:**
- This operation is idempotent for the same state - multiple calls after the task is deleted will return TASK_NOT_FOUND

### update_task(user_id, task_id, title?, description?)

**Inputs:**
- user_id (string, required): The ID of the user making the request
- task_id (string, required): The ID of the task to update
- title (string, optional): New title for the task
- description (string, optional): New description for the task

**Validation Rules:**
- user_id must be a valid user identifier
- task_id must be a valid task identifier
- If title is provided, it must not be empty and not exceed 255 characters
- If description is provided, it must not exceed 1000 characters
- At least one field (title or description) must be provided

**Ownership Enforcement:**
- Must verify that the user_id belongs to the authenticated user
- Must verify that the task belongs to the specified user

**Database Effects:**
- Updates specified fields in the tasks table
- Updates the updated_at timestamp to current time
- Leaves unspecified fields unchanged

**Return Schema:**
```json
{
  "success": true,
  "task": {
    "id": "string",
    "user_id": "string",
    "title": "string",
    "description": "string",
    "completed": boolean,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "message": "Task updated successfully"
}
```

**Error Scenarios:**
- Invalid user_id: Return error with code "INVALID_USER"
- Invalid task_id: Return error with code "INVALID_TASK"
- Task not found: Return error with code "TASK_NOT_FOUND"
- No update fields provided: Return error with code "NO_UPDATES"
- Title too long: Return error with code "TITLE_TOO_LONG"
- Ownership mismatch: Return error with code "OWNERSHIP_MISMATCH"
- Database error: Return error with code "DATABASE_ERROR"

**Idempotency Expectations:**
- This operation is idempotent for the same values - multiple calls with the same parameters will have the same effect