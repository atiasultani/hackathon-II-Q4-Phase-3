from fastapi import APIRouter, HTTPException, status, Request
from typing import Dict, Any
from ..middleware.auth_middleware import create_access_token
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str

class MockUser:
    def __init__(self, user_id: str, username: str, password_hash: str):
        self.id = user_id
        self.username = username
        self.password_hash = password_hash

# Mock user database - in a real application, this would be stored in a database
MOCK_USERS = {
    "user123": MockUser("user123", "demo_user", "mock_password_hash"),
    "admin": MockUser("admin", "admin", "admin_password_hash")
}

@router.post("/login")
async def login(login_request: LoginRequest) -> LoginResponse:
    """
    Authenticate a user and return an access token
    """
    # In a real application, this would involve checking the password hash
    # against the stored hash for the user
    username = login_request.username

    # Find user by username
    user_found = None
    for user_id, user in MOCK_USERS.items():
        if user.username == username or user_id == username:
            user_found = user
            break

    if not user_found:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    # For demo purposes, we'll accept any password for the mock users
    # In a real application, you'd verify the password hash here
    access_token = create_access_token(user_found.id)

    return LoginResponse(access_token=access_token, token_type="bearer")

@router.post("/token")
async def get_token_for_user_id(request: Request) -> LoginResponse:
    """
    Get a token for a specific user ID (for demo purposes)
    This endpoint allows getting a token directly by user ID without authentication
    """
    user_id = request.query_params.get("user_id", "user123")  # Default to user123

    # Validate that the user exists in our mock database
    if user_id not in MOCK_USERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    access_token = create_access_token(user_id)
    return LoginResponse(access_token=access_token, token_type="bearer")