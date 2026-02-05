from fastapi import HTTPException, Request, status, Response
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
            payload, error_msg = JWTValidator.validate_token_claims(token)
            if payload is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=error_msg or "Invalid token or expired token."
                )

            # Extract user_id from validated payload
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing required subject (sub) claim"
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
            payload, error_msg = JWTValidator.validate_token_claims(token)
            if payload is None:
                return None

            # Use 'sub' field for user UUID as per spec, fallback to 'user_id' for backward compatibility
            user_uuid: str = payload.get("sub") or payload.get("user_id")
            return user_uuid
        except Exception:
            return None


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

        payload, error_msg = JWTValidator.validate_token_claims(token)
        if payload is None:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=error_msg or "Invalid token or expired token."
                )
            return None

        # Extract user_id from validated payload
        user_id = payload.get("sub")
        if not user_id:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing required subject (sub) claim"
                )
            return None

        request.state.user_id = user_id
        return token



def set_auth_cookies(response: Response, access_token: str, refresh_token: str = None):
    """
    Set authentication cookies with secure settings
    """
    # Set access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=os.getenv("ENVIRONMENT", "development") == "production",  # Secure in production
        samesite="lax",  # Lax same-site policy for CSRF protection
        max_age=JWT_EXPIRATION_DELTA  # Match token expiration
    )

    # Set refresh token cookie if provided
    if refresh_token:
        REFRESH_EXPIRATION_DELTA = int(os.getenv("REFRESH_EXPIRATION_DELTA", "604800"))  # 7 days default
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=os.getenv("ENVIRONMENT", "development") == "production",  # Secure in production
            samesite="lax",  # Lax same-site policy for CSRF protection
            max_age=REFRESH_EXPIRATION_DELTA
        )


def clear_auth_cookies(response: Response):
    """
    Clear authentication cookies
    """
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")



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


def validate_jwt_claims(payload: dict) -> tuple[bool, str]:
    """
    Validate required JWT claims according to security specifications

    Args:
        payload: JWT payload dictionary

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check required claims
    required_claims = ['sub', 'exp', 'iat']

    for claim in required_claims:
        if claim not in payload:
            return False, f"Missing required claim: {claim}"

    # Validate expiration
    exp = payload.get('exp')
    if exp:
        try:
            exp_timestamp = float(exp)
            if exp_timestamp < datetime.utcnow().timestamp():
                return False, "Token has expired"
        except (TypeError, ValueError):
            return False, "Invalid expiration timestamp"

    # Validate issued at time (should not be in the future)
    iat = payload.get('iat')
    if iat:
        try:
            iat_timestamp = float(iat)
            if iat_timestamp > datetime.utcnow().timestamp() + 300:  # 5 minutes leeway
                return False, "Token was issued in the future"
        except (TypeError, ValueError):
            return False, "Invalid issued-at timestamp"

    # Validate token type if present
    token_type = payload.get('type')
    if token_type and token_type not in ['access', 'refresh']:
        return False, f"Invalid token type: {token_type}"

    # Validate subject is a valid UUID format
    sub = payload.get('sub')
    if sub:
        try:
            UUID(sub)
        except ValueError:
            return False, "Invalid subject format - must be a valid UUID"

    return True, ""


class JWTValidator:
    """Class to encapsulate JWT validation functionality"""

    @staticmethod
    def validate_token_claims(token: str) -> tuple[Optional[dict], str]:
        """
        Decode and validate a JWT token according to security specifications

        Args:
            token: JWT token string

        Returns:
            Tuple of (payload, error_message)
        """
        try:
            # Decode the token without verification first to check structure
            unverified_payload = jwt.get_unverified_claims(token)

            # Validate basic JWT structure
            is_valid, error_msg = validate_jwt_claims(unverified_payload)
            if not is_valid:
                return None, error_msg

            # Now verify the signature
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

            # Final validation after decoding
            is_valid, error_msg = validate_jwt_claims(payload)
            if not is_valid:
                return None, error_msg

            return payload, ""
        except JWTError as e:
            return None, f"Token validation failed: {str(e)}"
        except Exception as e:
            return None, f"Unexpected error during token validation: {str(e)}"