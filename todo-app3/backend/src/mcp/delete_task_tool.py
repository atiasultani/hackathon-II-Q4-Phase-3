from typing import Dict, Any
from uuid import UUID
from ..services.database_service import DatabaseService


class DeleteTaskTool:
    """
    MCP tool for deleting tasks as specified in the requirements:
    delete_task(user_id, task_id)
    - Must accept a user ID and task ID
    - Must validate that the user owns the specified task
    - Must delete the specified task
    - Must return confirmation of deletion
    - Must handle cases where the task does not exist
    """

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    def run(self, user_id: str, task_id: str) -> Dict[str, Any]:
        """
        Execute the delete_task operation

        Args:
            user_id: The ID of the user making the request
            task_id: The ID of the task to delete

        Returns:
            Dictionary containing the deletion confirmation
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

        # Attempt to delete the task
        deletion_successful = self.db_service.delete_task(
            user_id=user_uuid,
            task_id=task_uuid
        )

        if not deletion_successful:
            raise ValueError("Task not found or user does not have permission to delete this task")

        # Prepare response data
        return {
            "success": True,
            "task_id": str(task_uuid),
            "message": "Task deleted successfully"
        }