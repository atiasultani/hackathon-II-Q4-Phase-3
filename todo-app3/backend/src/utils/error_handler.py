from typing import Dict, Any, Optional
from enum import Enum
import logging


class ErrorCategory(Enum):
    """
    Categories of errors that can occur in the AI agent system.
    """
    AUTHENTICATION = "AUTHENTICATION_ERROR"
    AUTHORIZATION = "AUTHORIZATION_ERROR"
    VALIDATION = "VALIDATION_ERROR"
    INTEGRATION = "INTEGRATION_ERROR"
    BUSINESS_LOGIC = "BUSINESS_LOGIC_ERROR"
    SYSTEM = "SYSTEM_ERROR"
    NETWORK = "NETWORK_ERROR"
    TIMEOUT = "TIMEOUT_ERROR"


class ErrorHandler:
    """
    Utility class for handling errors consistently across the AI agent system.
    Provides error categorization, logging, and user-friendly message generation.
    """

    def __init__(self):
        # Set up logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)

    def log_error(self, error: Exception, context: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None):
        """
        Log an error with context for debugging and monitoring.

        Args:
            error: The exception that occurred
            context: Additional context about the error situation
            user_id: ID of the user involved (for privacy-sensitive logging)
        """
        error_info = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {},
            "user_id": user_id
        }

        # Log the error at error level
        self.logger.error(f"Error occurred: {error_info}", exc_info=True)

    def categorize_error(self, error: Exception) -> ErrorCategory:
        """
        Categorize an error based on its type.

        Args:
            error: The exception to categorize

        Returns:
            The appropriate ErrorCategory
        """
        error_type = type(error).__name__

        if "Auth" in error_type or "auth" in error_type:
            return ErrorCategory.AUTHENTICATION
        elif "Validation" in error_type or "validation" in error_type:
            return ErrorCategory.VALIDATION
        elif "Timeout" in error_type or "timeout" in error_type:
            return ErrorCategory.TIMEOUT
        elif "Connection" in error_type or "connection" in error_type:
            return ErrorCategory.NETWORK
        else:
            # Default to system error for other types
            return ErrorCategory.SYSTEM

    def generate_user_friendly_message(self, error: Exception, category: ErrorCategory) -> str:
        """
        Generate a user-friendly error message based on the error category.

        Args:
            error: The exception that occurred
            category: The categorized error type

        Returns:
            User-friendly error message
        """
        error_msg = str(error)

        if category == ErrorCategory.AUTHENTICATION:
            return "I'm sorry, there seems to be an issue with your authentication. Please try logging in again."
        elif category == ErrorCategory.AUTHORIZATION:
            return "I'm sorry, but you don't have permission to perform this action."
        elif category == ErrorCategory.VALIDATION:
            # For validation errors, try to provide specific feedback
            if "invalid" in error_msg.lower():
                return f"I couldn't process your request: {error_msg}. Could you check the information you provided?"
            else:
                return f"I couldn't understand your request: {error_msg}. Please try rephrasing."
        elif category == ErrorCategory.NETWORK:
            return "I'm experiencing network issues. Please try your request again in a moment."
        elif category == ErrorCategory.TIMEOUT:
            return "It took too long to process your request. Please try again."
        elif category == ErrorCategory.INTEGRATION:
            return "I'm having trouble connecting to one of my services. Please try again in a moment."
        elif category == ErrorCategory.BUSINESS_LOGIC:
            return f"I couldn't complete your request: {error_msg}. This might be due to business rule constraints."
        else:  # System error
            return "I encountered an unexpected issue. My team has been notified. Please try again shortly."

    def handle_agent_error(self, error: Exception, user_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Handle an error that occurred during agent processing.

        Args:
            error: The exception that occurred
            user_id: ID of the user making the request
            context: Additional context about the error situation

        Returns:
            Dictionary with error information suitable for API response
        """
        # Log the error
        self.log_error(error, context, user_id)

        # Categorize the error
        category = self.categorize_error(error)

        # Generate user-friendly message
        user_message = self.generate_user_friendly_message(error, category)

        # Return error information
        return {
            "error": True,
            "user_message": user_message,
            "technical_details": str(error),
            "category": category.value,
            "retry_suggested": self.should_suggest_retry(category),
            "logged": True
        }

    def should_suggest_retry(self, category: ErrorCategory) -> bool:
        """
        Determine if the user should be suggested to retry the operation.

        Args:
            category: The error category

        Returns:
            Boolean indicating if retry is suggested
        """
        # Suggest retry for transient errors
        retry_categories = [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT, ErrorCategory.INTEGRATION, ErrorCategory.SYSTEM]
        return category in retry_categories

    def validate_input(self, data: Dict[str, Any], required_fields: list) -> tuple[bool, str]:
        """
        Validate input data and return validation result.

        Args:
            data: Input data to validate
            required_fields: List of required field names

        Returns:
            Tuple of (is_valid, error_message)
        """
        for field in required_fields:
            if field not in data or data[field] is None or (isinstance(data[field], str) and data[field].strip() == ""):
                return False, f"Missing required field: {field}"

        return True, ""

    def sanitize_error_response(self, response: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Sanitize error response to protect user privacy and system security.

        Args:
            response: Error response to sanitize
            user_id: ID of the user receiving the response

        Returns:
            Sanitized error response
        """
        # Remove any sensitive technical details that shouldn't be exposed to users
        sanitized = {
            "error": response.get("error", False),
            "user_message": response.get("user_message", "An error occurred"),
            "retry_suggested": response.get("retry_suggested", False),
            "category": response.get("category")
        }

        # Don't include technical details in sanitized response to prevent exposing system details
        return sanitized

    def handle_out_of_scope_request(self, user_input: str) -> Dict[str, Any]:
        """
        Handle requests that are outside the agent's operational scope.

        Args:
            user_input: The user's request that is out of scope

        Returns:
            Response dictionary with appropriate out-of-scope handling
        """
        # Log the out-of-scope request for analysis (without sensitive user data)
        self.logger.info(f"Out-of-scope request: {user_input[:50]}...")  # Truncate for privacy

        return {
            "error": False,  # Not technically an error
            "user_message": f"I'm sorry, I can't help with '{user_input}'. I can assist you with managing your tasks, like adding, listing, completing, updating, or deleting tasks.",
            "suggested_actions": [
                "Add a task (e.g., 'Add a task to call mom')",
                "List your tasks (e.g., 'Show me my tasks')",
                "Complete a task (e.g., 'Complete the first task')",
                "Update a task (e.g., 'Update the meeting task')",
                "Delete a task (e.g., 'Delete the old task')"
            ],
            "category": ErrorCategory.BUSINESS_LOGIC.value
        }

    def handle_privacy_violation(self, attempted_action: str, user_id: str) -> Dict[str, Any]:
        """
        Handle attempts to access data or perform actions that violate privacy.

        Args:
            attempted_action: The action that would violate privacy
            user_id: ID of the user attempting the action

        Returns:
            Response dictionary with privacy violation handling
        """
        # Log the privacy violation attempt (for security monitoring)
        self.logger.warning(f"Privacy violation attempt by user {user_id}: {attempted_action}")

        return {
            "error": True,
            "user_message": "I cannot perform that action as it would violate your privacy or security policies.",
            "category": ErrorCategory.AUTHORIZATION.value,
            "logged": True
        }


# Global error handler instance
error_handler = ErrorHandler()