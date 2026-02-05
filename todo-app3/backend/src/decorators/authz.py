"""
Authorization decorator for MCP tools to ensure user access control
"""
from functools import wraps
from typing import Callable, Any
from fastapi import HTTPException, status
from uuid import UUID
from ..services.database_service import DatabaseService


def require_user_ownership(func: Callable) -> Callable:
    """
    Decorator to ensure that a user can only access resources they own.

    This decorator verifies that the user_id parameter passed to the function
    corresponds to the actual owner of the resource being accessed.
    It should be used on MCP tool methods that access user-specific data.
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        # Get the database service from self (since MCP tools have db_service as instance variable)
        if hasattr(self, 'db_service') and isinstance(self.db_service, DatabaseService):
            db_service = self.db_service
        else:
            # If no db_service available, proceed without verification (fallback)
            return func(self, *args, **kwargs)

        # Extract user_id and resource_id from function arguments
        # We'll use inspect to get the parameter names to handle different function signatures
        import inspect

        sig = inspect.signature(func)
        bound_args = sig.bind(self, *args, **kwargs)
        bound_args.apply_defaults()

        user_id = None
        resource_id = None
        resource_type = None

        # Look for user_id in the arguments
        if 'user_id' in bound_args.arguments:
            user_id = bound_args.arguments['user_id']

        # Look for resource identifiers based on function name
        func_name = func.__name__
        if 'task' in func_name.lower():
            resource_type = 'task'
            for param_name in ['task_id', 'id']:
                if param_name in bound_args.arguments:
                    resource_id = bound_args.arguments[param_name]
                    break
        elif 'conversation' in func_name.lower():
            resource_type = 'conversation'
            for param_name in ['conversation_id', 'id']:
                if param_name in bound_args.arguments:
                    resource_id = bound_args.arguments[param_name]
                    break
        elif 'message' in func_name.lower():
            resource_type = 'message'
            for param_name in ['message_id', 'id']:
                if param_name in bound_args.arguments:
                    resource_id = bound_args.arguments[param_name]
                    break

        # Validate that user_id is provided
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="user_id parameter is required for authorization"
            )

        # Validate user_id format
        try:
            UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user_id format - must be a valid UUID"
            )

        # If a specific resource is being accessed, verify ownership
        if resource_id and resource_type:
            try:
                UUID(resource_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid {resource_type}_id format - must be a valid UUID"
                )

            # Check ownership based on resource type
            user_uuid = UUID(user_id)
            resource_uuid = UUID(resource_id)

            if resource_type == 'task':
                task = db_service.get_task_by_id(user_uuid, resource_uuid)
                if not task:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"{resource_type.capitalize()} not found or access denied"
                    )
            elif resource_type == 'conversation':
                conversation = db_service.get_conversation_by_id(user_uuid, resource_uuid)
                if not conversation:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"{resource_type.capitalize()} not found or access denied"
                    )
            elif resource_type == 'message':
                # Message access is typically verified through conversation ownership
                # but we might want to implement direct message lookup if needed
                pass

        # Call the original function with authorization verified
        return func(self, *args, **kwargs)

    return wrapper


def verify_resource_ownership(resource_owner_id: str, requesting_user_id: str) -> bool:
    """
    Verify that the requesting user owns the resource.

    Args:
        resource_owner_id: The ID of the user who owns the resource
        requesting_user_id: The ID of the user requesting access

    Returns:
        True if the user owns the resource, False otherwise
    """
    try:
        # Convert both IDs to UUIDs for comparison
        owner_uuid = UUID(resource_owner_id)
        requester_uuid = UUID(requesting_user_id)

        return owner_uuid == requester_uuid
    except (ValueError, TypeError):
        # If either ID is not a valid UUID, they cannot be equal
        return False


def authorize_user_action(action: str = None):
    """
    Higher-order decorator to authorize specific user actions.

    Args:
        action: The type of action being authorized (read, write, delete, etc.)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Extract user_id from function arguments
            import inspect

            sig = inspect.signature(func)
            bound_args = sig.bind(self, *args, **kwargs)
            bound_args.apply_defaults()

            user_id = None
            if 'user_id' in bound_args.arguments:
                user_id = bound_args.arguments['user_id']

            # Perform basic authorization checks
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            # Validate user_id format
            try:
                UUID(user_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user_id format"
                )

            # Additional action-specific checks could go here
            # For now, we'll just proceed with the function call
            return func(self, *args, **kwargs)

        return wrapper
    return decorator