from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-here")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_DELTA = int(os.getenv("JWT_EXPIRATION_DELTA", "86400"))  # 24 hours in seconds


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

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

    def verify_jwt(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id: str = payload.get("user_id")

            # Check if token is expired
            exp = payload.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                return None

            return user_id
        except JWTError:
            return None


def create_access_token(user_id: str) -> str:
    """Create a new access token for a user"""
    expiration = datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION_DELTA)

    payload = {
        "user_id": user_id,
        "exp": expiration.timestamp(),
        "iat": datetime.utcnow().timestamp()
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_token_owner(request: Request, target_user_id: str) -> bool:
    """Verify that the authenticated user is the owner of the target resource"""
    authenticated_user_id = getattr(request.state, 'user_id', None)
    return authenticated_user_id == target_user_id