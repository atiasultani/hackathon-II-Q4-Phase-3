from typing import Dict, Any, List, Optional
from sqlmodel import Session, select
from backend.src.models.task import Task
from backend.src.utils.database import get_session


class TaskResolverService:
    """
    Service to resolve natural language references to specific tasks.
    Handles identifying tasks by title, position, partial match, ID, or context.
    """

    def __init__(self):
        pass

    def resolve_task_reference(
        self,
        task_reference: str,
        user_id: str,
        conversation_context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Resolve a natural language task reference to a specific task.

        Args:
            task_reference: Natural language reference to a task
            user_id: ID of the user making the reference
            conversation_context: Current conversation context with history

        Returns:
            Dictionary containing the resolved task details or None if not found
        """
        # First, try to identify the reference type
        reference_type = self._identify_reference_type(task_reference)

        # Get all tasks for the user
        user_tasks = self._get_user_tasks(user_id)

        if not user_tasks:
            return None

        # Resolve based on the reference type
        if reference_type == "POSITION":
            return self._resolve_by_position(task_reference, user_tasks)
        elif reference_type == "TITLE":
            return self._resolve_by_title(task_reference, user_tasks)
        elif reference_type == "ID":
            return self._resolve_by_id(task_reference, user_tasks)
        elif reference_type == "CONTEXTUAL":
            return self._resolve_by_context(task_reference, user_tasks, conversation_context)
        elif reference_type == "PARTIAL_MATCH":
            return self._resolve_by_partial_match(task_reference, user_tasks)
        else:
            # Try all approaches and return the best match
            # 1. Try contextual first
            result = self._resolve_by_context(task_reference, user_tasks, conversation_context)
            if result:
                return result

            # 2. Try title match
            result = self._resolve_by_title(task_reference, user_tasks)
            if result:
                return result

            # 3. Try partial match
            result = self._resolve_by_partial_match(task_reference, user_tasks)
            if result:
                return result

            # 4. Try position (if reference is numeric)
            result = self._resolve_by_position(task_reference, user_tasks)
            if result:
                return result

        return None

    def _identify_reference_type(self, reference: str) -> str:
        """
        Identify the type of task reference.

        Args:
            reference: The task reference string

        Returns:
            Reference type (POSITION, TITLE, ID, CONTEXTUAL, PARTIAL_MATCH)
        """
        reference_lower = reference.lower().strip()

        # Check for position references
        position_words = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth",
                          "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
                          "last", "previous", "next", "one", "that", "the"]

        if any(word in reference_lower for word in position_words):
            return "POSITION"

        # Check for contextual references
        contextual_words = ["that", "the", "it", "this", "mentioned", "previous", "above", "last one", "first one"]
        if any(word in reference_lower for word in contextual_words):
            return "CONTEXTUAL"

        # Check if it's an ID (usually UUID-like)
        if self._is_uuid_like(reference):
            return "ID"

        # If it's just a simple word or phrase, it's likely a title or partial match
        return "TITLE"

    def _is_uuid_like(self, text: str) -> bool:
        """
        Check if a string looks like a UUID.

        Args:
            text: String to check

        Returns:
            Boolean indicating if string resembles a UUID
        """
        import re
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        return bool(re.match(uuid_pattern, text))

    def _get_user_tasks(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all tasks for a user.

        Args:
            user_id: ID of the user

        Returns:
            List of user tasks with relevant details
        """
        with get_session() as session:
            statement = select(Task).where(Task.user_id == user_id)
            tasks = session.exec(statement).all()

            return [
                {
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description or "",
                    "completed": task.completed,
                    "created_at": task.created_at,
                    "updated_at": task.updated_at
                } for task in tasks
            ]

    def _resolve_by_position(self, reference: str, tasks: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Resolve a task by position (first, second, last, etc.).

        Args:
            reference: Position reference
            tasks: List of available tasks

        Returns:
            Resolved task or None
        """
        if not tasks:
            return None

        reference_lower = reference.lower()

        # Map position words to indices
        if "first" in reference_lower or "1st" in reference_lower:
            return tasks[0] if tasks else None
        elif "second" in reference_lower or "2nd" in reference_lower:
            return tasks[1] if len(tasks) > 1 else None
        elif "third" in reference_lower or "3rd" in reference_lower:
            return tasks[2] if len(tasks) > 2 else None
        elif "last" in reference_lower:
            return tasks[-1] if tasks else None
        elif "next" in reference_lower and len(tasks) > 1:
            # If "next" is mentioned, might refer to last task in context or first incomplete
            incomplete_tasks = [t for t in tasks if not t["completed"]]
            return incomplete_tasks[0] if incomplete_tasks else tasks[0]
        else:
            # Check for numeric positions (e.g., "second one", "number 2")
            import re
            numbers = re.findall(r'\d+', reference)
            if numbers:
                try:
                    pos = int(numbers[0])
                    # Convert to 0-based index
                    idx = pos - 1
                    return tasks[idx] if 0 <= idx < len(tasks) else None
                except (ValueError, IndexError):
                    pass

        return None

    def _resolve_by_title(self, reference: str, tasks: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Resolve a task by exact title match.

        Args:
            reference: Title reference
            tasks: List of available tasks

        Returns:
            Resolved task or None
        """
        # Remove common phrases like "task to", "the task", etc.
        reference_clean = reference.lower().strip()
        common_phrases = ["the task ", "task ", "to ", "called ", "named "]
        for phrase in common_phrases:
            reference_clean = reference_clean.replace(phrase, "")

        for task in tasks:
            if task["title"].lower() == reference_clean:
                return task

        return None

    def _resolve_by_id(self, reference: str, tasks: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Resolve a task by ID.

        Args:
            reference: ID reference
            tasks: List of available tasks

        Returns:
            Resolved task or None
        """
        for task in tasks:
            if task["id"] == reference:
                return task

        return None

    def _resolve_by_context(
        self,
        reference: str,
        tasks: List[Dict[str, Any]],
        conversation_context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Resolve a task by context from the conversation history.

        Args:
            reference: Contextual reference
            tasks: List of available tasks
            conversation_context: Current conversation context

        Returns:
            Resolved task or None
        """
        # Look for recently mentioned tasks in the conversation context
        previous_messages = conversation_context.get("previous_messages", [])
        recent_task_mentions = []

        # Look for mentions of tasks in the recent conversation
        for msg in reversed(previous_messages[-5:]):  # Check last 5 messages
            content = msg.get("content", "").lower()

            # Look for tasks whose titles appear in the conversation
            for task in tasks:
                if task["title"].lower() in content:
                    recent_task_mentions.append(task)

        if recent_task_mentions:
            # If "that", "it", or "the one" is mentioned, likely refers to most recently mentioned
            if any(word in reference.lower() for word in ["that", "it", "the one", "the task", "above", "mentioned"]):
                # Return the most recently mentioned task
                return recent_task_mentions[0]

        return None

    def _resolve_by_partial_match(self, reference: str, tasks: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Resolve a task by partial title match.

        Args:
            reference: Reference string
            tasks: List of available tasks

        Returns:
            Resolved task or None
        """
        reference_lower = reference.lower()

        # First, try exact substring matches
        for task in tasks:
            if reference_lower in task["title"].lower() or task["title"].lower() in reference_lower:
                return task

        # If no exact substring match, try fuzzy matching
        best_match = None
        best_score = 0

        for task in tasks:
            # Simple scoring based on common words
            task_title_lower = task["title"].lower()
            reference_words = set(reference_lower.split())
            title_words = set(task_title_lower.split())

            # Count matching words
            common_words = reference_words.intersection(title_words)
            score = len(common_words)

            if score > best_score:
                best_score = score
                best_match = task

        # Only return if we have a decent match (at least 1 common word)
        if best_score > 0:
            return best_match

        return None

    def get_matching_tasks(self, reference: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all tasks that match a reference, useful for disambiguation.

        Args:
            reference: Task reference string
            user_id: ID of the user

        Returns:
            List of matching tasks
        """
        user_tasks = self._get_user_tasks(user_id)
        matching_tasks = []

        # Try different matching strategies
        for task in user_tasks:
            if (reference.lower() in task["title"].lower() or
                task["title"].lower() in reference.lower()):
                matching_tasks.append(task)

        # If no title matches, try context matching
        if not matching_tasks:
            # Just return all tasks as potential matches for user selection
            matching_tasks = user_tasks

        return matching_tasks

    def format_task_for_disambiguation(self, task: Dict[str, Any]) -> str:
        """
        Format a task for presentation during disambiguation.

        Args:
            task: Task dictionary

        Returns:
            Formatted string representation of the task
        """
        status = "✓" if task["completed"] else "○"
        return f"{status} [{task['title']}] (ID: {task['id']})"