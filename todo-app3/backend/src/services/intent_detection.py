from typing import Dict, Any
import openai
from openai import OpenAI
import os
import json
from enum import Enum


class IntentType(Enum):
    ADD = "ADD_TASK"
    LIST = "LIST_TASKS"
    COMPLETE = "COMPLETE_TASK"
    DELETE = "DELETE_TASK"
    UPDATE = "UPDATE_TASK"
    UNKNOWN = "UNKNOWN"


class IntentDetectionService:
    """
    Service to detect user intent from natural language input.
    Uses OpenAI API to classify user input into specific task operation intents.
    """

    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.supported_intents = [intent.value for intent in IntentType if intent != IntentType.UNKNOWN]

    def detect_intent(self, user_input: str) -> Dict[str, Any]:
        """
        Detect the intent from user input using OpenAI's language model.

        Args:
            user_input: Natural language input from the user

        Returns:
            Dictionary containing the detected intent, confidence, and extracted entities
        """
        # Define the function schema for intent detection
        functions = [
            {
                "name": "detect_intent_and_extract_entities",
                "description": "Detect the intent from user input and extract relevant entities",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "intent_type": {
                            "type": "string",
                            "enum": self.supported_intents,
                            "description": "The detected intent type (ADD_TASK, LIST_TASKS, COMPLETE_TASK, DELETE_TASK, UPDATE_TASK)"
                        },
                        "confidence": {
                            "type": "number",
                            "minimum": 0.0,
                            "maximum": 1.0,
                            "description": "Confidence level in the detected intent (0.0 to 1.0)"
                        },
                        "extracted_entities": {
                            "type": "object",
                            "description": "Structured data extracted from the natural language input",
                            "properties": {
                                "title": {"type": "string", "description": "Task title if applicable"},
                                "description": {"type": "string", "description": "Task description if applicable"},
                                "due_time": {"type": "string", "description": "Due time if specified"},
                                "status": {"type": "string", "description": "Task status for filtering"},
                                "category": {"type": "string", "description": "Task category for filtering"},
                                "task_reference": {"type": "string", "description": "Reference to a specific task"},
                                "updated_fields": {
                                    "type": "object",
                                    "description": "Fields to update in a task update operation"
                                }
                            },
                            "additionalProperties": True
                        }
                    },
                    "required": ["intent_type", "confidence"]
                }
            }
        ]

        # Create the prompt for intent detection
        prompt = f"""
        Analyze the following user input and detect the intent. The possible intents are:
        - ADD_TASK: Adding a new task
        - LIST_TASKS: Listing existing tasks
        - COMPLETE_TASK: Marking a task as completed
        - DELETE_TASK: Removing a task
        - UPDATE_TASK: Modifying an existing task

        User input: "{user_input}"

        Identify the intent, assess your confidence in this classification (0.0-1.0), and extract any relevant entities from the input.
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that detects user intent from natural language input for a todo management system. Identify the user's intent and extract relevant information."},
                    {"role": "user", "content": prompt}
                ],
                functions=functions,
                function_call={"name": "detect_intent_and_extract_entities"},
                temperature=0.1  # Lower temperature for more consistent results
            )

            # Extract the function arguments from the response
            if response.choices and response.choices[0].message.function_call:
                function_args = json.loads(response.choices[0].message.function_call.arguments)

                # Validate the intent type
                intent_type = function_args.get("intent_type", IntentType.UNKNOWN.value)
                if intent_type not in self.supported_intents:
                    intent_type = IntentType.UNKNOWN.value

                # Set default values if not provided
                confidence = function_args.get("confidence", 0.5)
                extracted_entities = function_args.get("extracted_entities", {})

                return {
                    "intent_type": intent_type,
                    "confidence": confidence,
                    "extracted_entities": extracted_entities,
                    "raw_input": user_input
                }
            else:
                # If the function call wasn't made properly, return unknown intent
                return {
                    "intent_type": IntentType.UNKNOWN.value,
                    "confidence": 0.0,
                    "extracted_entities": {},
                    "raw_input": user_input
                }

        except Exception as e:
            # In case of error, return unknown intent with low confidence
            print(f"Error detecting intent: {str(e)}")
            return {
                "intent_type": IntentType.UNKNOWN.value,
                "confidence": 0.0,
                "extracted_entities": {},
                "raw_input": user_input
            }

    def handle_synonyms_and_variations(self, user_input: str) -> str:
        """
        Normalize user input to handle synonyms and natural language variations.

        Args:
            user_input: Original user input

        Returns:
            Normalized input that maps to standard operations
        """
        # In a more sophisticated implementation, this would handle various
        # synonyms and variations. For now, just return the original input
        # as the AI model should handle this as part of intent detection.
        return user_input.strip()

    def get_supported_intents(self) -> list:
        """
        Get the list of supported intents.

        Returns:
            List of supported intent types
        """
        return self.supported_intents

    def get_supported_reference_types(self) -> list:
        """
        Get the list of supported reference types for task identification.

        Returns:
            List of supported reference types
        """
        return ["BY_TITLE", "BY_POSITION", "BY_PARTIAL_MATCH", "BY_ID", "BY_CONTEXT"]

    def handle_synonyms_and_variations(self, user_input: str) -> str:
        """
        Normalize user input to handle synonyms and natural language variations.

        Args:
            user_input: Original user input

        Returns:
            Normalized input that maps to standard operations
        """
        # This is a simplified implementation
        # In a more sophisticated implementation, this would handle various
        # synonyms and variations more comprehensively
        synonym_map = {
            "create": "add",
            "make": "add",
            "start": "add",
            "show": "list",
            "display": "list",
            "view": "list",
            "finish": "complete",
            "done": "complete",
            "accomplish": "complete",
            "remove": "delete",
            "eliminate": "delete",
            "cancel": "delete",
            "modify": "update",
            "change": "update",
            "alter": "update"
        }

        normalized_input = user_input.lower()
        for synonym, standard in synonym_map.items():
            normalized_input = normalized_input.replace(synonym, standard)

        return normalized_input.strip()

    def identify_task_attributes(self, text: str) -> Dict[str, Any]:
        """
        Identify potential task attributes from user input (title, due date, priority, etc.).

        Args:
            text: User input text

        Returns:
            Dictionary of identified attributes
        """
        return extract_keywords(text)  # Using the utility function from nlp_utils

    def is_ambiguous(self, intent_result: Dict[str, Any]) -> bool:
        """
        Determine if the detected intent is ambiguous and requires clarification.

        Args:
            intent_result: Result from detect_intent method

        Returns:
            Boolean indicating if clarification is needed
        """
        # Consider it ambiguous if confidence is below threshold
        # or if entities are missing crucial information
        confidence_threshold = 0.7
        if intent_result.get("confidence", 0) < confidence_threshold:
            return True

        # For specific intents, check if required entities are present
        intent_type = intent_result.get("intent_type", "")
        extracted_entities = intent_result.get("extracted_entities", {})

        if intent_type in [IntentType.COMPLETE.value, IntentType.DELETE.value, IntentType.UPDATE.value]:
            # These intents typically require specific task identification
            if not extracted_entities.get("task_reference"):
                # Check if we have other ways to identify the task
                required_identifiers = ["title", "id", "position"]
                has_identifier = any(key in extracted_entities for key in required_identifiers)
                return not has_identifier

        return False

    def suggest_clarification_question(self, intent_result: Dict[str, Any]) -> str:
        """
        Generate a clarification question when intent is ambiguous.

        Args:
            intent_result: Result from detect_intent method

        Returns:
            A question to ask the user for clarification
        """
        intent_type = intent_result.get("intent_type", IntentType.UNKNOWN.value)
        user_input = intent_result.get("raw_input", "")

        if intent_type == IntentType.COMPLETE.value or intent_type == IntentType.DELETE.value:
            return "Could you please specify which task you want to complete/delete? You can mention the task title or position (e.g., 'first', 'last')."
        elif intent_type == IntentType.UPDATE.value:
            return "Could you please specify which task you want to update and what changes you'd like to make?"
        elif intent_type == IntentType.ADD.value:
            return f"I heard you want to add something. Did you mean: {user_input}?"
        else:
            return f"I'm not sure what you mean by '{user_input}'. I can help you add, list, complete, update, or delete tasks."