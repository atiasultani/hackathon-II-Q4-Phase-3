from fastapi import APIRouter, HTTPException, status, Request, Response, Depends
from typing import Dict, Any
from ..middleware.auth_middleware import create_access_token, create_refresh_token, set_auth_cookies, clear_auth_cookies, JWTBearerCookie
from ..utils.database import get_session
from ..services.database_service import DatabaseService
from sqlmodel import Session
from pydantic import BaseModel, EmailStr
from ..utils.password_utils import hash_password, validate_password_strength

router = APIRouter()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr  # Changed from username to email
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str

class MeResponse(BaseModel):
    user_id: str
    email: str

@router.post("/signup")
async def signup(
    signup_request: SignupRequest,
    response: Response,
    session: Session = Depends(get_session)
) -> Dict[str, str]:
    """
    Register a new user with email and password
    """
    # Validate password strength
    is_valid, error_msg = validate_password_strength(signup_request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Create database service
    db_service = DatabaseService(session)

    try:
        # Create user in the database
        user = db_service.create_user(
            email=signup_request.email,
            password=signup_request.password
        )

        # Create access and refresh tokens
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        # Set tokens in HttpOnly cookies
        set_auth_cookies(response, access_token, refresh_token)

        return {"message": "User registered successfully"}

    except ValueError as e:
        # User already exists
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )


@router.post("/login")
async def login(
    login_request: LoginRequest,
    response: Response,
    session: Session = Depends(get_session)
) -> Dict[str, str]:
    """
    Authenticate a user with email and password
    """
    # Create database service
    db_service = DatabaseService(session)

    # Authenticate user against database
    user = db_service.authenticate_user(login_request.email, login_request.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Create access and refresh tokens
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    # Set tokens in HttpOnly cookies
    set_auth_cookies(response, access_token, refresh_token)

    return {"message": "Login successful"}


@router.post("/logout")
async def logout(response: Response) -> Dict[str, str]:
    """
    Logout the user and clear authentication cookies
    """
    # Clear authentication cookies
    clear_auth_cookies(response)

    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(
    request: Request,
    token: str = Depends(JWTBearerCookie(auto_error=True)),
    session: Session = Depends(get_session)
) -> MeResponse:
    """
    Get the current authenticated user's information
    """
    # Get user ID from request state (set by auth middleware)
    user_id = getattr(request.state, 'user_id', None)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Create database service
    db_service = DatabaseService(session)

    # Get user from database
    user = db_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    return MeResponse(user_id=str(user.id), email=user.email)

