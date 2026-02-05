from typing import Dict, Any


def construct_assistant_response(intent_result: Dict[str, Any], tool_results: list = None) -> str:
    """
    Construct a natural language response from the AI agent based on the detected intent
    and results from any MCP tool calls.

    Args:
        intent_result: Result from intent detection service
        tool_results: Results from any executed MCP tools

    Returns:
        Natural language response string
    """
    intent_type = intent_result.get("intent_type", "UNKNOWN")
    extracted_entities = intent_result.get("extracted_entities", {})

    if tool_results and len(tool_results) > 0:
        # If there were tool results, craft response based on those
        if intent_type == "ADD_TASK":
            if tool_results[0].get("success"):
                title = extracted_entities.get("title", "the task")
                return f"I've added the task: '{title}' to your list."
            else:
                return "I couldn't add that task. Perhaps it already exists or there was an error."

        elif intent_type == "LIST_TASKS":
            tasks = tool_results[0].get("tasks", [])
            if tasks:
                task_list = [task.get("title", "Unnamed task") for task in tasks]
                task_str = ", ".join(task_list)
                return f"Here are your tasks: {task_str}"
            else:
                return "You don't have any tasks on your list right now."

        elif intent_type == "COMPLETE_TASK":
            if tool_results[0].get("success"):
                return "I've marked that task as completed!"
            else:
                return "I couldn't complete that task. It may not exist."

        elif intent_type == "DELETE_TASK":
            if tool_results[0].get("success"):
                return "I've removed that task from your list."
            else:
                return "I couldn't delete that task. It may not exist."

        elif intent_type == "UPDATE_TASK":
            if tool_results[0].get("success"):
                return "I've updated your task."
            else:
                return "I couldn't update that task. It may not exist."

    # Default responses when no tool results available
    if intent_type == "ADD_TASK":
        title = extracted_entities.get("title", "a new task")
        return f"I will add {title} to your task list."
    elif intent_type == "LIST_TASKS":
        return "I'll retrieve your tasks for you."
    elif intent_type == "COMPLETE_TASK":
        return "I'll mark the task as completed."
    elif intent_type == "DELETE_TASK":
        return "I'll remove that task from your list."
    elif intent_type == "UPDATE_TASK":
        return "I'll update the task for you."
    else:
        return "I'm not sure how to help with that. You can ask me to add, list, complete, update, or delete tasks."


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent injection attacks and remove inappropriate content.

    Args:
        text: Raw user input

    Returns:
        Sanitized text
    """
    # Remove potentially dangerous sequences
    sanitized = text

    # Remove potential code injection patterns (basic)
    dangerous_patterns = [
        "<script", "</script>", "javascript:", "onerror=", "onload=",
        "SELECT ", "INSERT ", "UPDATE ", "DELETE ", "DROP ", "CREATE ",
        "ALTER ", "EXEC(", "EXEC ", "UNION", "UNION ", "--", "/*", "*/"
    ]

    for pattern in dangerous_patterns:
        sanitized = sanitized.replace(pattern, "")

    # Limit length to prevent very long inputs
    if len(sanitized) > 1000:
        sanitized = sanitized[:1000]

    return sanitized.strip()


def extract_keywords(text: str) -> list:
    """
    Extract important keywords from user input for better intent classification.

    Args:
        text: User input text

    Returns:
        List of important keywords
    """
    # Basic keyword extraction - in practice, you might use NLTK or spaCy for more sophisticated extraction
    import re

    # Convert to lowercase and split into words
    words = re.findall(r'\b\w+\b', text.lower())

    # Remove common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    }

    # Filter out stop words and return significant keywords
    keywords = [word for word in words if word not in stop_words and len(word) > 2]

    return list(set(keywords))  # Return unique keywords


def calculate_similarity(text1: str, text2: str) -> float:
    """
    Calculate similarity between two text strings (simple implementation).

    Args:
        text1: First text string
        text2: Second text string

    Returns:
        Similarity score between 0 and 1
    """
    # Simple similarity calculation based on common words
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())

    intersection = words1.intersection(words2)
    union = words1.union(words2)

    if len(union) == 0:
        return 0.0

    return len(intersection) / len(union)


def format_task_details(task: Dict[str, Any]) -> str:
    """
    Format task details for natural language presentation.

    Args:
        task: Task dictionary

    Returns:
        Formatted string with task details
    """
    title = task.get("title", "Unnamed task")
    description = task.get("description", "")
    completed = task.get("completed", False)
    created_at = task.get("created_at", "")

    status = "Completed" if completed else "Pending"

    details = f"Task: {title} ({status})"
    if description:
        details += f" - {description}"
    if created_at:
        details += f" | Created: {created_at}"

    return details


def identify_task_attributes(text: str) -> Dict[str, Any]:
    """
    Identify potential task attributes from user input (title, due date, priority, etc.).

    Args:
        text: User input text

    Returns:
        Dictionary of identified attributes
    """
    import re
    from datetime import datetime

    attributes = {}

    # Extract potential task title (usually everything after action words)
    action_words = ["add", "create", "make", "remember", "remind", "schedule"]
    lower_text = text.lower()

    for word in action_words:
        if word in lower_text:
            # Take the part after the action word
            parts = lower_text.split(word, 1)
            if len(parts) > 1:
                potential_title = parts[1].strip()
                # Clean up potential title
                title = potential_title.replace("to", "", 1).replace("that", "").strip()
                if title:
                    attributes["title"] = title
                break

    # If no title was extracted, use the original text
    if "title" not in attributes:
        attributes["title"] = text

    # Look for time references
    time_patterns = [
        r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)',  # Matches 12:30 PM, 9:00 am
        r'(at\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)',  # Matches "at 3 PM", "at 15:00"
        r'(in\s+\d+\s+(minutes|hours|days|weeks|months))',  # Matches "in 30 minutes", "in 2 days"
    ]

    for pattern in time_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            attributes["due_time"] = matches[0]
            break

    # Look for date references
    date_patterns = [
        r'(today|tomorrow)',  # Matches "today", "tomorrow"
        r'(on\s+\w+\s+\d{1,2}(?:st|nd|rd|th)?\b)',  # Matches "on Monday 15th", "on March 3rd"
        r'(by\s+\w+\s+\d{1,2}(?:st|nd|rd|th)?\b)',  # Matches "by Friday 21st"
    ]

    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            attributes["due_date"] = matches[0]
            break

    # Look for priority indicators
    high_priority_indicators = ["urgent", "asap", "important", "critical", "high priority"]
    medium_priority_indicators = ["normal", "regular", "standard"]
    low_priority_indicators = ["whenever", "whenever possible", "low priority", "take your time"]

    text_lower = text.lower()
    if any(indicator in text_lower for indicator in high_priority_indicators):
        attributes["priority"] = "high"
    elif any(indicator in text_lower for indicator in low_priority_indicators):
        attributes["priority"] = "low"
    else:
        attributes["priority"] = "medium"

    return attributes