from typing import Dict, Any, Optional, List
from uuid import UUID
from ..services.database_service import DatabaseService
from ..models import Task
from ..decorators.authz import require_user_ownership, authorize_user_action


class ListTasksTool:
    """
    MCP tool for listing tasks as specified in the requirements:
    list_tasks(user_id, status?)
    - Must accept a user ID and optional status filter (all, active, completed)
    - Must validate that the user ID is valid and belongs to the requesting user
    - Must return tasks owned by the specified user
    - Must filter by status if provided
    - Must return paginated results if the user has many tasks
    """

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    @require_user_ownership
    def run(self, user_id: str, status: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute the list_tasks operation

        Args:
            user_id: The ID of the user making the request
            status: Optional status filter (all, active, completed)

        Returns:
            Dictionary containing the list of tasks
        """
        # Validate inputs
        if not user_id:
            raise ValueError("user_id is required")

        # Validate status parameter if provided
        if status and status not in ["all", "active", "completed"]:
            raise ValueError("status must be one of: all, active, completed")

        # Convert user_id to UUID
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

        # Get tasks for the user with optional status filter
        tasks = self.db_service.get_user_tasks(user_uuid, status)

        # Prepare response data
        task_list = []
        for task in tasks:
            task_dict = {
                "id": str(task.id),
                "user_id": str(task.user_id),
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            }
            task_list.append(task_dict)

        # For pagination, we could implement limits if needed
        # For now, returning all tasks for the user
        return {
            "success": True,
            "tasks": task_list,
            "count": len(task_list),
            "filters": {
                "status": status
            }
        }