from fastapi import HTTPException, Request, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from datetime import datetime, timedelta
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import JWTError

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-here")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_DELTA = int(os.getenv("JWT_EXPIRATION_DELTA", "86400"))  # 24 hours in seconds


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    def verify_jwt(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

            # Use 'sub' field for user UUID as per spec, fallback to 'user_id' for backward compatibility
            user_uuid: str = payload.get("sub") or payload.get("user_id")

            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                return None

            return user_uuid
        except JWTError:
            return None

    async def __call__(self, request: Request):
        credentials: Optional[HTTPAuthorizationCredentials] = await super(JWTBearer, self).__call__(request)

        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication scheme."
                )
            token = credentials.credentials
            user_id = self.verify_jwt(token)
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token or expired token."
                )
            request.state.user_id = user_id
            return credentials.credentials
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization code."
            )


class JWTBearerCookie:
    """
    Custom authentication class to extract JWT token from HttpOnly cookies
    """
    def __init__(self, token_name: str = "access_token", auto_error: bool = True):
        self.token_name = token_name
        self.auto_error = auto_error

    async def __call__(self, request: Request):
        token = request.cookies.get(self.token_name)

        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated"
                )
            return None

        user_id = self.verify_jwt(token)
        if not user_id:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token or expired token."
                )
            return None

        request.state.user_id = user_id
        return token

    def verify_jwt(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

            # Use 'sub' field for user UUID as per spec, fallback to 'user_id' for backward compatibility
            user_uuid: str = payload.get("sub") or payload.get("user_id")

            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                return None

            return user_uuid
        except JWTError:
            return None


def set_auth_cookies(response: Response, access_token: str, refresh_token: str = None):
    """
    Set authentication cookies with secure settings
    """
    # Calculate expiration time based on JWT settings
    expiration_seconds = int(os.getenv("JWT_EXPIRATION_DELTA", "86400"))  # 24 hours default

    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=os.getenv("ENVIRONMENT", "development") == "production",  # Secure in production
        samesite="lax",  # Lax same-site policy for CSRF protection
        max_age=expiration_seconds,  # Match token expiration
        path="/"
    )

    # Set refresh token cookie if provided
    if refresh_token:
        refresh_expiration_seconds = int(os.getenv("REFRESH_EXPIRATION_DELTA", "604800"))  # 7 days default
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=os.getenv("ENVIRONMENT", "development") == "production",  # Secure in production
            samesite="lax",  # Lax same-site policy for CSRF protection
            max_age=refresh_expiration_seconds,  # Refresh token expiration
            path="/"
        )


def clear_auth_cookies(response: Response):
    """
    Clear authentication cookies
    """
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


def create_access_token(user_uuid: str) -> str:
    """Create a new access token for a user following JWT spec"""
    expiration = datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION_DELTA)

    payload = {
        "sub": user_uuid,  # Use 'sub' field for user UUID as per spec
        "exp": expiration.timestamp(),
        "iat": datetime.utcnow().timestamp(),
        "type": "access"  # Specify token type as per spec
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def create_refresh_token(user_uuid: str) -> str:
    """Create a new refresh token for a user following JWT spec"""
    # Refresh tokens might have longer expiration - configurable
    REFRESH_EXPIRATION_DELTA = int(os.getenv("REFRESH_EXPIRATION_DELTA", "604800"))  # 7 days default
    expiration = datetime.utcnow() + timedelta(seconds=REFRESH_EXPIRATION_DELTA)

    payload = {
        "sub": user_uuid,  # Use 'sub' field for user UUID as per spec
        "exp": expiration.timestamp(),
        "iat": datetime.utcnow().timestamp(),
        "type": "refresh"  # Specify token type as per spec
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token_owner(request: Request, target_user_id: str) -> bool:
    """Verify that the authenticated user is the owner of the target resource"""
    authenticated_user_id = getattr(request.state, 'user_id', None)
    return authenticated_user_id == target_user_id