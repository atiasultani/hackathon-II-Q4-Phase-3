from typing import Dict, Any
from uuid import UUID
from ..services.database_service import DatabaseService
from ..models import Task
from ..decorators.authz import require_user_ownership, authorize_user_action


class CompleteTaskTool:
    """
    MCP tool for completing tasks as specified in the requirements:
    complete_task(user_id, task_id)
    - Must accept a user ID and task ID
    - Must validate that the user owns the specified task
    - Must update the task's completion status to true
    - Must return the updated task details
    - Must handle cases where the task is already completed
    """

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    @require_user_ownership
    def run(self, user_id: str, task_id: str) -> Dict[str, Any]:
        """
        Execute the complete_task operation

        Args:
            user_id: The ID of the user making the request
            task_id: The ID of the task to complete

        Returns:
            Dictionary containing the updated task details
        """
        # Validate inputs
        if not user_id:
            raise ValueError("user_id is required")

        if not task_id:
            raise ValueError("task_id is required")

        # Convert user_id and task_id to UUIDs
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

        try:
            task_uuid = UUID(task_id)
        except ValueError:
            raise ValueError("task_id must be a valid UUID")

        # Attempt to update the task completion status
        updated_task = self.db_service.update_task(
            user_id=user_uuid,
            task_id=task_uuid,
            completed=True
        )

        if not updated_task:
            raise ValueError("Task not found or user does not have permission to access this task")

        # Check if the task was already completed
        was_already_completed = updated_task.completed and updated_task.id == task_uuid

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
            "message": "Task completed successfully",
            "warning": "Task was already marked as completed" if was_already_completed else None
        }