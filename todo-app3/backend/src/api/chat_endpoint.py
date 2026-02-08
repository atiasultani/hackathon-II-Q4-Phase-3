from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, Any, Optional
from uuid import UUID
import json
from datetime import datetime

from ..middleware.auth_middleware import JWTBearer, verify_token_owner, JWTBearerCookie
from ..middleware.rate_limit_middleware import rate_limit_middleware
from ..services.database_service import DatabaseService
from ..utils.database import get_session
from sqlmodel import Session
from ..models import Conversation, Message
from ..mcp import AddTaskTool, ListTasksTool, CompleteTaskTool, UpdateTaskTool, DeleteTaskTool
from ..nlp.intent_classifier import IntentClassifier, IntentType, get_intent_and_entities

router = APIRouter()


@router.post("/chat")
async def chat_endpoint(
    request: Request,
    message_data: Dict[str, Any],
    token: str = Depends(JWTBearerCookie(auto_error=True)),  # Updated to use cookie-based auth
    session: Session = Depends(get_session)
):
    """
    Chat endpoint that handles user messages and returns AI-generated responses with tool calls

    Args:
        message_data: Dictionary containing conversation_id (optional) and message (required)

    Returns:
        Dictionary containing conversation_id, response, and tool_calls
    """
    # Get the authenticated user ID from the JWT token (no need to verify against path parameter anymore)
    authenticated_user_id = getattr(request.state, 'user_id', None)

    if not authenticated_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Apply rate limiting
    rate_limit_middleware(request)

    # Extract message and optional conversation_id from request
    message = message_data.get("message")
    conversation_id = message_data.get("conversation_id")

    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required"
        )

    # Convert the authenticated user_id to UUID for database operations
    try:
        user_uuid = UUID(authenticated_user_id)
    except (ValueError, TypeError, AttributeError):
        # If the authenticated user_id is not a UUID or is None, handle string IDs
        # For demo purposes with string user IDs like "user123", we'll create a deterministic UUID
        import hashlib
        user_uuid = UUID(bytes=hashlib.md5(authenticated_user_id.encode()).digest()[:16] if authenticated_user_id else b'default_user')

    # Initialize database service
    db_service = DatabaseService(session)

    # Ensure user exists in the database (get or create) using the authenticated user_id string
    user_record = db_service.get_or_create_user(authenticated_user_id)

    # Load conversation history if conversation_id is provided
    conversation = None
    conversation_history = []

    if conversation_id:
        try:
            conversation_uuid = UUID(conversation_id)
            conversation = db_service.get_conversation_by_id(user_uuid, conversation_uuid)

            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )

            # Load recent conversation history for context
            conversation_history = db_service.get_recent_messages_for_conversation(conversation_uuid, limit=10)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid conversation ID format"
            )
    else:
        # Create a new conversation if none provided
        conversation = db_service.create_conversation(user_uuid)

    # Create message in the conversation
    user_message = db_service.create_message(
        user_id=user_uuid,
        conversation_id=conversation.id,
        role="user",
        content=message
    )

    # Initialize MCP tools with database service
    add_task_tool = AddTaskTool(db_service)
    list_tasks_tool = ListTasksTool(db_service)
    complete_task_tool = CompleteTaskTool(db_service)
    update_task_tool = UpdateTaskTool(db_service)
    delete_task_tool = DeleteTaskTool(db_service)


    # Initialize intent classifier
    intent_classifier = IntentClassifier()

    # Classify intent and extract entities
    intent, confidence, entities = get_intent_and_entities(message)

    # Set minimum confidence threshold
    MIN_CONFIDENCE = 0.3

    response_text = ""
    tool_calls = []

    # Process the user's message based on classified intent
    if intent == IntentType.ADD_TASK and confidence >= MIN_CONFIDENCE:
        try:
            # Parse task details
            task_details = intent_classifier.parse_add_task_request(message)

            if task_details.get("title"):
                result = add_task_tool.run(
                    user_id=str(user_uuid),  # Use the converted UUID
                    title=task_details["title"],
                    description=task_details.get("description")
                )
                response_text = f"I've added the task: {result['task']['title']}"

                args = {"user_id": str(user_uuid), "title": task_details["title"]}  # Use the converted UUID
                if task_details.get("description"):
                    args["description"] = task_details["description"]

                tool_calls.append({
                    "tool_name": "add_task",
                    "arguments": args,
                    "result": result
                })
            else:
                response_text = "I can help you add a task. Try saying something like 'Add a task to buy groceries'"
        except Exception as e:
            response_text = f"Sorry, I couldn't add that task: {str(e)}"

    elif intent == IntentType.LIST_TASKS and confidence >= MIN_CONFIDENCE:
        try:
            result = list_tasks_tool.run(user_id=str(user_uuid))  # Use the converted UUID
            tasks = result['tasks']

            if tasks:
                task_list_str = ", ".join([f"'{task['title']}'" for task in tasks])
                response_text = f"Here are your tasks: {task_list_str}"
            else:
                response_text = "You don't have any tasks right now."

            tool_calls.append({
                "tool_name": "list_tasks",
                "arguments": {"user_id": str(user_uuid)},  # Use the converted UUID
                "result": result
            })
        except Exception as e:
            response_text = f"Sorry, I couldn't list your tasks: {str(e)}"

    elif intent == IntentType.COMPLETE_TASK and confidence >= MIN_CONFIDENCE:
        try:
            list_result = list_tasks_tool.run(user_id=str(user_uuid))  # Use the converted UUID
            tasks = list_result['tasks']

            if tasks:
                # Find a task that's not already completed
                incomplete_task = next((t for t in tasks if not t['completed']), None)

                if incomplete_task:
                    complete_result = complete_task_tool.run(user_id=str(user_uuid), task_id=incomplete_task['id'])  # Use the converted UUID
                    response_text = f"I've marked the task '{incomplete_task['title']}' as completed."

                    tool_calls.extend([
                        {
                            "tool_name": "list_tasks",
                            "arguments": {"user_id": str(user_uuid)},  # Use the converted UUID
                            "result": list_result
                        },
                        {
                            "tool_name": "complete_task",
                            "arguments": {"user_id": str(user_uuid), "task_id": incomplete_task['id']},  # Use the converted UUID
                            "result": complete_result
                        }
                    ])
                else:
                    response_text = "All your tasks are already completed!"
            else:
                response_text = "You don't have any tasks to complete."
        except Exception as e:
            response_text = f"Sorry, I couldn't complete that task: {str(e)}"

    elif intent == IntentType.UPDATE_TASK and confidence >= MIN_CONFIDENCE:
        try:
            list_result = list_tasks_tool.run(user_id=str(user_uuid))  # Use the converted UUID
            tasks = list_result['tasks']

            if tasks:
                # Get the first task to update
                task_to_update = tasks[0]

                # Extract potential update content from entities
                extracted_titles = entities.get('task_title', [])
                new_content = extracted_titles[0] if extracted_titles else None

                if not new_content:
                    # Try to extract from the original message
                    import re
                    match = re.search(r"(?:update|change|modify|edit)\s+(?:task|the task|to)\s+(.+)", message.lower())
                    if match:
                        new_content = match.group(1).strip()

                if new_content:
                    # Determine if this is a title or description update
                    update_result = update_task_tool.run(
                        user_id=str(user_uuid),  # Use the converted UUID
                        task_id=task_to_update['id'],
                        title=new_content.capitalize() if new_content else None
                    )

                    response_text = f"I've updated the task '{task_to_update['title']}' to '{update_result['task']['title']}'"

                    tool_calls.extend([
                        {
                            "tool_name": "list_tasks",
                            "arguments": {"user_id": str(user_uuid)},  # Use the converted UUID
                            "result": list_result
                        },
                        {
                            "tool_name": "update_task",
                            "arguments": {"user_id": str(user_uuid), "task_id": task_to_update['id'], "title": new_content.capitalize()},  # Use the converted UUID
                            "result": update_result
                        }
                    ])
                else:
                    response_text = "I can help you update a task. Try saying something like 'Update the task to buy groceries' or 'Change the task to walk the dog'."
            else:
                response_text = "You don't have any tasks to update."
        except Exception as e:
            response_text = f"Sorry, I couldn't update that task: {str(e)}"

    elif intent == IntentType.DELETE_TASK and confidence >= MIN_CONFIDENCE:
        try:
            list_result = list_tasks_tool.run(user_id=str(user_uuid))  # Use the converted UUID
            tasks = list_result['tasks']

            if tasks:
                # Get the first task to delete
                task_to_delete = tasks[0]

                # Try to identify specific task to delete from entities or message
                extracted_titles = entities.get('task_title', [])
                target_task = task_to_delete  # Default to first task

                if extracted_titles:
                    # Try to find a task that matches the description
                    task_description = extracted_titles[0].lower()
                    matched_task = next((t for t in tasks if task_description in t['title'].lower()), None)
                    if matched_task:
                        target_task = matched_task

                # Delete the task
                delete_result = delete_task_tool.run(
                    user_id=str(user_uuid),  # Use the converted UUID
                    task_id=target_task['id']
                )

                response_text = f"I've deleted the task '{target_task['title']}'."

                tool_calls.extend([
                    {
                        "tool_name": "list_tasks",
                        "arguments": {"user_id": str(user_uuid)},  # Use the converted UUID
                        "result": list_result
                    },
                    {
                        "tool_name": "delete_task",
                        "arguments": {"user_id": str(user_uuid), "task_id": target_task['id']},  # Use the converted UUID
                        "result": delete_result
                    }
                ])
            else:
                response_text = "You don't have any tasks to delete."
        except Exception as e:
            response_text = f"Sorry, I couldn't delete that task: {str(e)}"

    else:
        response_text = f"I'm not sure how to help with that. (Detected intent: {intent.value}, confidence: {confidence:.2f}). You can ask me to add, list, complete, update, or delete tasks."    # Create assistant message in the conversation
    assistant_message = db_service.create_message(
        user_id=user_uuid,  # The system acts on behalf of the user
        conversation_id=conversation.id,
        role="assistant",
        content=response_text
    )

    # Update conversation's updated_at timestamp
    conversation.updated_at = datetime.utcnow()
    session.add(conversation)
    session.commit()

    # Return the response with conversation_id, response, and tool_calls
    result = {
        "conversation_id": str(conversation.id),
        "response": response_text,
        "tool_calls": tool_calls
    }

    # Include conversation history info if needed for debugging/monitoring
    if conversation_history:
        result["previous_messages_count"] = len(conversation_history)

    return result