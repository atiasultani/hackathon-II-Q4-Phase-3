from typing import Dict, Any, Optional
from uuid import UUID
from ..services.database_service import DatabaseService
from ..models import Task


class AddTaskTool:
    """
    MCP tool for adding tasks as specified in the requirements:
    add_task(user_id, title, description?)
    - Must accept a user ID, task title, and optional description
    - Must validate that the user ID is valid and belongs to the requesting user
    - Must create a new task with the provided details
    - Must return the created task details including ID and timestamps
    - Must handle duplicate titles appropriately
    """

    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    def run(self, user_id: str, title: str, description: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute the add_task operation

        Args:
            user_id: The ID of the user making the request
            title: The title of the task to create
            description: Optional description of the task

        Returns:
            Dictionary containing the created task details
        """
        # Validate inputs
        if not user_id:
            raise ValueError("user_id is required")

        if not title or not title.strip():
            raise ValueError("title is required and cannot be empty")

        if len(title) > 255:
            raise ValueError("title cannot exceed 255 characters")

        if description and len(description) > 1000:
            raise ValueError("description cannot exceed 1000 characters")

        # Convert user_id to UUID
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")

        # Check for duplicate titles (optional handling as specified)
        # For now, we'll allow duplicate titles but in a real system,
        # we might want to implement duplicate detection logic
        existing_tasks = self.db_service.get_user_tasks(user_uuid)
        duplicate_exists = any(task.title == title for task in existing_tasks)

        # Create the task
        task = self.db_service.create_task(
            user_id=user_uuid,
            title=title.strip(),
            description=description.strip() if description else None
        )

        # Return the created task details
        return {
            "success": True,
            "task": {
                "id": str(task.id),
                "user_id": str(task.user_id),
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            },
            "message": "Task created successfully",
            "duplicate_warning": "A task with this title already exists" if duplicate_exists else None
        }