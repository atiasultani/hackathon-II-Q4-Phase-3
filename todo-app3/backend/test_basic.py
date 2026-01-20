"""
Basic tests to validate the implementation of the AI-Powered Todo Chatbot
"""
import unittest
from uuid import UUID
from src.models import Task, Conversation, Message
from src.services.database_service import DatabaseService
from src.mcp.add_task_tool import AddTaskTool
from src.mcp.list_tasks_tool import ListTasksTool
from src.mcp.complete_task_tool import CompleteTaskTool
from src.mcp.update_task_tool import UpdateTaskTool
from src.mcp.delete_task_tool import DeleteTaskTool
from src.utils.database import get_session, engine
from sqlmodel import Session, select


class TestTodoChatbot(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create a test session
        self.session = Session(engine)
        self.db_service = DatabaseService(self.session)

        # Initialize tools
        self.add_task_tool = AddTaskTool(self.db_service)
        self.list_tasks_tool = ListTasksTool(self.db_service)
        self.complete_task_tool = CompleteTaskTool(self.db_service)
        self.update_task_tool = UpdateTaskTool(self.db_service)
        self.delete_task_tool = DeleteTaskTool(self.db_service)

    def tearDown(self):
        """Clean up after each test method."""
        # Clean up any test data
        self.session.rollback()
        self.session.close()

    def test_create_and_retrieve_task(self):
        """Test creating a task and retrieving it."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"  # Example UUID

        # Create a task
        result = self.add_task_tool.run(
            user_id=user_id,
            title="Test task",
            description="This is a test task"
        )

        self.assertTrue(result["success"])
        self.assertEqual(result["task"]["title"], "Test task")
        self.assertEqual(result["task"]["description"], "This is a test task")
        self.assertFalse(result["task"]["completed"])

        # Verify the task was created with correct user
        task_uuid = UUID(result["task"]["id"])
        user_uuid = UUID(user_id)

        # Retrieve the task using the database service
        retrieved_task = self.db_service.get_task_by_id(user_uuid, task_uuid)
        self.assertIsNotNone(retrieved_task)
        self.assertEqual(retrieved_task.title, "Test task")
        self.assertEqual(retrieved_task.description, "This is a test task")
        self.assertFalse(retrieved_task.completed)

    def test_list_tasks(self):
        """Test listing tasks for a user."""
        user_id = "123e4567-e89b-12d3-a456-426614174001"  # Different UUID

        # Create multiple tasks
        task1_result = self.add_task_tool.run(
            user_id=user_id,
            title="First task",
            description="Description for first task"
        )

        task2_result = self.add_task_tool.run(
            user_id=user_id,
            title="Second task",
            description="Description for second task"
        )

        # List tasks
        list_result = self.list_tasks_tool.run(user_id=user_id)

        self.assertTrue(list_result["success"])
        self.assertEqual(len(list_result["tasks"]), 2)
        self.assertEqual(list_result["count"], 2)

        # Verify both tasks are in the list
        titles = [task["title"] for task in list_result["tasks"]]
        self.assertIn("First task", titles)
        self.assertIn("Second task", titles)

    def test_complete_task(self):
        """Test completing a task."""
        user_id = "123e4567-e89b-12d3-a456-426614174002"

        # Create a task
        create_result = self.add_task_tool.run(
            user_id=user_id,
            title="Task to complete",
            description="This task will be completed"
        )

        task_id = create_result["task"]["id"]

        # Verify task is initially not completed
        self.assertFalse(create_result["task"]["completed"])

        # Complete the task
        complete_result = self.complete_task_tool.run(
            user_id=user_id,
            task_id=task_id
        )

        self.assertTrue(complete_result["success"])
        self.assertTrue(complete_result["task"]["completed"])
        self.assertEqual(complete_result["task"]["title"], "Task to complete")

    def test_update_task(self):
        """Test updating a task."""
        user_id = "123e4567-e89b-12d3-a456-426614174003"

        # Create a task
        create_result = self.add_task_tool.run(
            user_id=user_id,
            title="Original title",
            description="Original description"
        )

        task_id = create_result["task"]["id"]

        # Update the task
        update_result = self.update_task_tool.run(
            user_id=user_id,
            task_id=task_id,
            title="Updated title",
            description="Updated description"
        )

        self.assertTrue(update_result["success"])
        self.assertEqual(update_result["task"]["title"], "Updated title")
        self.assertEqual(update_result["task"]["description"], "Updated description")

    def test_update_task_partial_fields(self):
        """Test updating only specific fields of a task."""
        user_id = "123e4567-e89b-12d3-a456-426614174006"

        # Create a task
        create_result = self.add_task_tool.run(
            user_id=user_id,
            title="Original title",
            description="Original description"
        )

        task_id = create_result["task"]["id"]

        # Update only the title
        update_result = self.update_task_tool.run(
            user_id=user_id,
            task_id=task_id,
            title="Updated title only"
        )

        self.assertTrue(update_result["success"])
        self.assertEqual(update_result["task"]["title"], "Updated title only")
        self.assertEqual(update_result["task"]["description"], "Original description")  # Should remain unchanged

        # Update only the description
        update_result2 = self.update_task_tool.run(
            user_id=user_id,
            task_id=task_id,
            description="Updated description only"
        )

        self.assertTrue(update_result2["success"])
        self.assertEqual(update_result2["task"]["title"], "Updated title only")  # Should remain unchanged
        self.assertEqual(update_result2["task"]["description"], "Updated description only")

    def test_update_nonexistent_task(self):
        """Test updating a non-existent task."""
        user_id = "123e4567-e89b-12d3-a456-426614174007"
        nonexistent_task_id = "123e4567-e89b-12d3-a456-426614174999"

        # Attempt to update a non-existent task
        with self.assertRaises(ValueError) as context:
            self.update_task_tool.run(
                user_id=user_id,
                task_id=nonexistent_task_id,
                title="Should not work"
            )

        self.assertIn("Task not found", str(context.exception))

    def test_delete_task(self):
        """Test deleting a task."""
        user_id = "123e4567-e89b-12d3-a456-426614174004"

        # Create a task
        create_result = self.add_task_tool.run(
            user_id=user_id,
            title="Task to delete",
            description="This task will be deleted"
        )

        task_id = create_result["task"]["id"]

        # Verify task exists
        list_before = self.list_tasks_tool.run(user_id=user_id)
        self.assertEqual(len(list_before["tasks"]), 1)

        # Delete the task
        delete_result = self.delete_task_tool.run(
            user_id=user_id,
            task_id=task_id
        )

        self.assertTrue(delete_result["success"])

        # Verify task no longer exists
        list_after = self.list_tasks_tool.run(user_id=user_id)
        self.assertEqual(len(list_after["tasks"]), 0)

    def test_delete_nonexistent_task(self):
        """Test deleting a non-existent task."""
        user_id = "123e4567-e89b-12d3-a456-426614174008"
        nonexistent_task_id = "123e4567-e89b-12d3-a456-426614174999"

        # Attempt to delete a non-existent task
        with self.assertRaises(ValueError) as context:
            self.delete_task_tool.run(
                user_id=user_id,
                task_id=nonexistent_task_id
            )

        self.assertIn("Task not found", str(context.exception))

    def test_delete_task_invalid_uuid(self):
        """Test deleting a task with invalid UUID."""
        user_id = "invalid-uuid"
        task_id = "also-invalid"

        # Attempt to delete with invalid UUIDs
        with self.assertRaises(ValueError) as context:
            self.delete_task_tool.run(
                user_id=user_id,
                task_id=task_id
            )

        self.assertIn("UUID", str(context.exception))

    def test_invalid_inputs(self):
        """Test that invalid inputs are properly handled."""
        # Test creating task without title
        with self.assertRaises(ValueError):
            self.add_task_tool.run(
                user_id="123e4567-e89b-12d3-a456-426614174005",
                title="",  # Empty title should fail
                description="Test description"
            )

        # Test updating with invalid UUID
        with self.assertRaises(ValueError):
            self.update_task_tool.run(
                user_id="invalid-uuid",
                task_id="another-invalid-uuid",
                title="New title"
            )


if __name__ == '__main__':
    unittest.main()