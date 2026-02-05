from typing import Dict, Any, List
import openai
from openai import OpenAI
from backend.src.services.intent_detection import IntentDetectionService
from backend.src.services.context_manager import ContextManagerService
from backend.src.services.task_resolver import TaskResolverService
from backend.src.utils.nlp_utils import construct_assistant_response
from backend.src.utils.database import get_session
from backend.src.utils.error_handler import ErrorHandler, error_handler
from sqlmodel import Session
import os
import json
from datetime import datetime
from enum import Enum


class IntentType(Enum):
    ADD = "ADD_TASK"
    LIST = "LIST_TASKS"
    COMPLETE = "COMPLETE_TASK"
    DELETE = "DELETE_TASK"
    UPDATE = "UPDATE_TASK"


class TodoAgent:
    """
    AI agent that interprets natural language input and maps user intents to appropriate MCP tools
    for todo management operations. The agent maintains conversation context, handles errors
    gracefully, and provides a natural, conversational interface for task management.
    """

    def __init__(self):
        # Initialize OpenAI client
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Initialize services
        self.intent_detection_service = IntentDetectionService()
        self.context_manager_service = ContextManagerService()
        self.task_resolver_service = TaskResolverService()
        self.error_handler = error_handler  # Use the global error handler instance

    def process_user_input(
        self,
        user_input: str,
        user_id: str,
        conversation_id: str = None
    ) -> Dict[str, Any]:
        """
        Process natural language input from user and return appropriate response
        with potential MCP tool calls.

        Args:
            user_input: Natural language input from the user
            user_id: Unique identifier for the user
            conversation_id: Unique identifier for the conversation (optional)

        Returns:
            Dictionary containing response and potential tool calls
        """
        # Get or create conversation ID
        if not conversation_id:
            conversation_id = self.context_manager_service.create_conversation(user_id)

        # Retrieve conversation context
        conversation_context = self.context_manager_service.get_conversation_context(
            user_id, conversation_id
        )

        # Detect intent from user input
        intent_result = self.intent_detection_service.detect_intent(user_input)

        # Process based on detected intent
        response_data = self._handle_intent(
            intent_result,
            user_input,
            user_id,
            conversation_id,
            conversation_context
        )

        # Save the user message and agent response to the conversation context
        self.context_manager_service.add_message_to_conversation(
            user_id,
            conversation_id,
            role="user",
            content=user_input
        )

        self.context_manager_service.add_message_to_conversation(
            user_id,
            conversation_id,
            role="assistant",
            content=response_data.get("response", "")
        )

        return {
            "conversation_id": conversation_id,
            **response_data
        }

    def _handle_intent(
        self,
        intent_result: Dict[str, Any],
        user_input: str,
        user_id: str,
        conversation_id: str,
        conversation_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle the detected intent and return appropriate response.
        """
        intent_type = intent_result.get("intent_type")
        confidence = intent_result.get("confidence", 0.0)
        extracted_entities = intent_result.get("extracted_entities", {})

        # If confidence is low, ask for clarification
        if confidence < 0.7:  # Threshold can be adjusted
            return {
                "response": "I'm not completely sure what you mean. Could you clarify?",
                "intent_detected": "UNKNOWN",
                "confidence": confidence,
                "tool_calls": []
            }

        # Handle different intent types
        try:
            if intent_type == IntentType.ADD.value:
                return self._handle_add_task(user_input, user_id, extracted_entities)
            elif intent_type == IntentType.LIST.value:
                return self._handle_list_tasks(user_input, user_id, extracted_entities)
            elif intent_type == IntentType.COMPLETE.value:
                return self._handle_complete_task(user_input, user_id, extracted_entities, conversation_context)
            elif intent_type == IntentType.DELETE.value:
                return self._handle_delete_task(user_input, user_id, extracted_entities, conversation_context)
            elif intent_type == IntentType.UPDATE.value:
                return self._handle_update_task(user_input, user_id, extracted_entities, conversation_context)
            else:
                # Unknown intent - provide helpful response
                return {
                    "response": f"I'm sorry, I don't understand how to '{user_input}'. I can help you add, list, complete, update, or delete tasks.",
                    "intent_detected": "UNKNOWN",
                    "confidence": confidence,
                    "tool_calls": []
                }
        except Exception as e:
            # Handle any errors during intent processing using the error handler
            return self._handle_error(e, user_input, user_id)

    def _handle_add_task(self, user_input: str, user_id: str, extracted_entities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle adding a new task.
        """
        # Extract task details from entities or parse from input
        title = extracted_entities.get("title") or self._extract_task_title(user_input)
        description = extracted_entities.get("description", "")
        due_time = extracted_entities.get("due_time")

        # Create tool call for adding task
        tool_call = {
            "tool_name": "add_task",
            "arguments": {
                "title": title,
                "description": description,
                "due_time": due_time
            }
        }

        response_text = f"I've added the task: '{title}'"
        if due_time:
            response_text += f" scheduled for {due_time}"
        response_text += "."

        return {
            "response": response_text,
            "intent_detected": IntentType.ADD.value,
            "confidence": 1.0,
            "tool_calls": [tool_call]
        }

    def _handle_list_tasks(self, user_input: str, user_id: str, extracted_entities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle listing tasks.
        """
        # Extract filters from entities
        status_filter = extracted_entities.get("status")
        category_filter = extracted_entities.get("category")

        # Create tool call for listing tasks
        arguments = {}
        if status_filter:
            arguments["status"] = status_filter
        if category_filter:
            arguments["category"] = category_filter

        tool_call = {
            "tool_name": "list_tasks",
            "arguments": arguments
        }

        status_text = f" that are {status_filter}" if status_filter else ""
        response_text = f"Here are your tasks{status_text}:"

        return {
            "response": response_text,
            "intent_detected": IntentType.LIST.value,
            "confidence": 1.0,
            "tool_calls": [tool_call]
        }

    def _handle_complete_task(self, user_input: str, user_id: str, extracted_entities: Dict[str, Any], conversation_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle completing a task.
        """
        # Resolve the task based on user input and context
        task_reference = extracted_entities.get("task_reference") or user_input
        resolved_task = self.task_resolver_service.resolve_task_reference(
            task_reference, user_id, conversation_context
        )

        if not resolved_task:
            # Task not found - ask for clarification
            return {
                "response": "I couldn't identify which task you want to complete. Could you be more specific?",
                "intent_detected": IntentType.COMPLETE.value,
                "confidence": 0.8,
                "tool_calls": []
            }

        # Create tool call for completing task
        tool_call = {
            "tool_name": "complete_task",
            "arguments": {
                "task_id": resolved_task["id"]
            }
        }

        response_text = f"I've marked the task '{resolved_task['title']}' as completed."

        return {
            "response": response_text,
            "intent_detected": IntentType.COMPLETE.value,
            "confidence": 1.0,
            "tool_calls": [tool_call]
        }

    def _handle_delete_task(self, user_input: str, user_id: str, extracted_entities: Dict[str, Any], conversation_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle deleting a task.
        """
        # Resolve the task based on user input and context
        task_reference = extracted_entities.get("task_reference") or user_input
        resolved_task = self.task_resolver_service.resolve_task_reference(
            task_reference, user_id, conversation_context
        )

        if not resolved_task:
            # Task not found - ask for clarification
            return {
                "response": "I couldn't identify which task you want to delete. Could you be more specific?",
                "intent_detected": IntentType.DELETE.value,
                "confidence": 0.8,
                "tool_calls": []
            }

        # Create tool call for deleting task
        tool_call = {
            "tool_name": "delete_task",
            "arguments": {
                "task_id": resolved_task["id"]
            }
        }

        response_text = f"I've deleted the task '{resolved_task['title']}'."

        return {
            "response": response_text,
            "intent_detected": IntentType.DELETE.value,
            "confidence": 1.0,
            "tool_calls": [tool_call]
        }

    def _handle_update_task(self, user_input: str, user_id: str, extracted_entities: Dict[str, Any], conversation_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle updating a task.
        """
        # Resolve the task based on user input and context
        task_reference = extracted_entities.get("task_reference") or user_input
        resolved_task = self.task_resolver_service.resolve_task_reference(
            task_reference, user_id, conversation_context
        )

        if not resolved_task:
            # Task not found - ask for clarification
            return {
                "response": "I couldn't identify which task you want to update. Could you be more specific?",
                "intent_detected": IntentType.UPDATE.value,
                "confidence": 0.8,
                "tool_calls": []
            }

        # Extract update details
        updated_fields = extracted_entities.get("updated_fields", {})

        # Create tool call for updating task
        tool_call = {
            "tool_name": "update_task",
            "arguments": {
                "task_id": resolved_task["id"],
                **updated_fields
            }
        }

        response_text = f"I've updated the task '{resolved_task['title']}' with the new details."

        return {
            "response": response_text,
            "intent_detected": IntentType.UPDATE.value,
            "confidence": 1.0,
            "tool_calls": [tool_call]
        }

    def _extract_task_title(self, user_input: str) -> str:
        """
        Simple method to extract task title from user input if not provided in entities.
        In a real implementation, this would use more sophisticated NLP.
        """
        # This is a simplified extraction - in reality, this would use more advanced NLP
        # Remove common task-related words/phrases
        cleaned_input = user_input.lower()
        for phrase in ["add a task", "create a task", "add task", "create task", "to"]:
            cleaned_input = cleaned_input.replace(phrase, "").strip()

        # Capitalize first letter
        if cleaned_input:
            cleaned_input = cleaned_input[0].upper() + cleaned_input[1:] if len(cleaned_input) > 1 else cleaned_input.upper()

        return cleaned_input or "New Task"

    def _handle_error(self, error: Exception, user_input: str, user_id: str) -> Dict[str, Any]:
        """
        Handle errors during intent processing using the error handler utility.

        Args:
            error: The exception that occurred
            user_input: The user input that caused the error
            user_id: The user ID for the request

        Returns:
            Dictionary with error response information
        """
        # Use the error handler to process the error
        error_response = self.error_handler.handle_agent_error(
            error=error,
            user_id=user_id,
            context={"user_input": user_input}
        )

        # Create response based on error handling result
        return {
            "response": error_response["user_message"],
            "intent_detected": "ERROR",
            "confidence": 0.0,
            "tool_calls": [],
            "error_details": {
                "original_input": user_input,
                "handled": True,
                "category": error_response["category"]
            }
        }