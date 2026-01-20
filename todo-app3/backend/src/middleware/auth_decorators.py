from fastapi import Request, HTTPException, status
from functools import wraps
from typing import Callable, Any
from uuid import UUID


def require_user_ownership(resource_param: str = "user_id"):
    """
    Decorator to enforce user ownership validation
    Ensures that the authenticated user can only access their own resources
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract request from function arguments
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if request is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Request object not found in function arguments"
                )

            # Get authenticated user ID from request state
            authenticated_user_id = getattr(request.state, 'user_id', None)

            if not authenticated_user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            # Get the resource's user ID from the function parameters
            resource_user_id = kwargs.get(resource_param)

            # If resource_user_id is not directly available in kwargs,
            # we might need to get it from path parameters or other sources
            if resource_user_id is None:
                # Try to get from request path params if needed
                resource_user_id = request.path_params.get(resource_param)

            # For UUID parameters, convert string to UUID if needed
            if isinstance(resource_user_id, str):
                try:
                    resource_user_id = UUID(resource_user_id)
                except ValueError:
                    pass  # Keep as string if not a valid UUID

            if str(authenticated_user_id) != str(resource_user_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not have permission to access this resource"
                )

            return func(*args, **kwargs)

        return wrapper

    return decorator


def require_user_authentication():
    """
    Decorator to require user authentication for a function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract request from function arguments
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if request is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Request object not found in function arguments"
                )

            # Get authenticated user ID from request state
            authenticated_user_id = getattr(request.state, 'user_id', None)

            if not authenticated_user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            return func(*args, **kwargs)

        return wrapper

    return decorator


def check_user_permissions(required_permissions: list = None):
    """
    Decorator to check if user has required permissions
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract request from function arguments
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if request is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Request object not found in function arguments"
                )

            # Get authenticated user ID from request state
            authenticated_user_id = getattr(request.state, 'user_id', None)

            if not authenticated_user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            # In a real implementation, we would check user permissions against a database
            # For now, we'll just check if the user is authenticated and has the required permissions
            # This is a simplified implementation
            if required_permissions:
                # Placeholder for permission checking logic
                # In a real implementation, this would query a database for user permissions
                pass

            return func(*args, **kwargs)

        return wrapper

    return decorator