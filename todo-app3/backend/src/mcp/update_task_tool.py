from typing import Dict, Any, Optional
from uuid import UUID
from ..services.database_service import DatabaseService
from ..models import Task


class UpdateTaskTool:
    """
    MCP tool for updating tasks as specified in the requirements:
    update_task(user_id, task_id, title?, description?)
    - Must accept a user ID, task ID, and optional fields to update
    - Must validate that the user owns the specified task
    - Must update only the provided fields, leaving others unchanged
    - Must return the updated task details
    - Must handle cases where the task does not exist
    """

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    def run(self, user_id: str, task_id: str, title: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute the update_task operation

        Args:
            user_id: The ID of the user making the request
            task_id: The ID of the task to update
            title: Optional new title for the task
            description: Optional new description for the task

        Returns:
            Dictionary containing the updated task details
        """
        # Validate inputs
        if not user_id:
            raise ValueError("user_id is required")

        if not task_id:
            raise ValueError("task_id is required")

        # At least one field must be provided for update
        if title is None and description is None:
            raise ValueError("At least one field (title or description) must be provided for update")

        # Validate field lengths if provided
        if title and len(title) > 255:
            raise ValueError("title cannot exceed 255 characters")

        if description and len(description) > 1000:
            raise ValueError("description cannot exceed 1000 characters")

        # Convert user_id and task_id to UUIDs
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

        try:
            task_uuid = UUID(task_id)
        except ValueError:
            raise ValueError("task_id must be a valid UUID")

        # Attempt to update the task
        updated_task = self.db_service.update_task(
            user_id=user_uuid,
            task_id=task_uuid,
            title=title.strip() if title else None,
            description=description.strip() if description else None
        )

        if not updated_task:
            raise ValueError("Task not found or user does not have permission to access this task")

        # Prepare response data
        return {
            "success": True,
            "task": {
                "id": str(updated_task.id),
                "user_id": str(updated_task.user_id),
                "title": updated_task.title,
                "description": updated_task.description,
                "completed": updated_task.completed,
                "created_at": updated_task.created_at.isoformat(),
                "updated_at": updated_task.updated_at.isoformat()
            },
            "message": "Task updated successfully"
        }