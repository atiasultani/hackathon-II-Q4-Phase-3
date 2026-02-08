"""
Authentication Module Generator Skill
Generates comprehensive authentication modules with JWT, OAuth2, password hashing, and RBAC
"""
import os
import json
from typing import Dict, Any, List
from jinja2 import Template

class AuthenticationSkill:
    def __init__(self):
        self.skill_dir = os.path.dirname(__file__)
        self.templates_dir = os.path.join(self.skill_dir, "templates")

    def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the authentication skill to generate authentication modules
        """
        try:
            # Extract parameters
            auth_type = params.get('auth_type', 'jwt')
            language = params.get('language', 'python')
            include_rbac = params.get('include_rbac', True)
            include_password_hashing = params.get('include_password_hashing', True)

            # Validate parameters
            if auth_type not in ['jwt', 'oauth2', 'both']:
                raise ValueError(f"Invalid auth_type: {auth_type}. Must be one of: jwt, oauth2, both")

            if language not in ['python', 'javascript', 'typescript', 'go', 'rust']:
                raise ValueError(f"Invalid language: {language}")

            # Generate authentication components based on parameters
            generated_files = []

            # Generate models/schemas
            if language == 'python':
                models_content = self._generate_python_models(include_rbac, include_password_hashing)
                generated_files.append({
                    'path': 'models/auth_models.py',
                    'content': models_content
                })

                schemas_content = self._generate_python_schemas(include_rbac)
                generated_files.append({
                    'path': 'schemas/auth_schemas.py',
                    'content': schemas_content
                })

            # Generate authentication core functionality
            if auth_type in ['jwt', 'both']:
                if language == 'python':
                    jwt_content = self._generate_python_jwt_auth(include_rbac)
                    generated_files.append({
                        'path': 'auth/jwt_auth.py',
                        'content': jwt_content
                    })

            if auth_type in ['oauth2', 'both']:
                if language == 'python':
                    oauth2_content = self._generate_python_oauth2_flow()
                    generated_files.append({
                        'path': 'auth/oauth2_flow.py',
                        'content': oauth2_content
                    })

            # Generate password utilities
            if include_password_hashing and language == 'python':
                password_utils_content = self._generate_python_password_utils()
                generated_files.append({
                    'path': 'utils/password_utils.py',
                    'content': password_utils_content
                })

            # Generate role-based access control
            if include_rbac and language == 'python':
                rbac_content = self._generate_python_rbac()
                generated_files.append({
                    'path': 'auth/rbac.py',
                    'content': rbac_content
                })

            # Generate routes/endpoints
            if language == 'python':
                routes_content = self._generate_python_auth_routes(auth_type, include_rbac)
                generated_files.append({
                    'path': 'routes/auth_routes.py',
                    'content': routes_content
                })

            return {
                'status': 'success',
                'message': f'Generated authentication module with {auth_type} authentication',
                'files': generated_files
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }

    def _generate_python_models(self, include_rbac: bool, include_password_hashing: bool) -> str:
        """Generate Python authentication models"""
        template_content = '''from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import bcrypt
import jwt
from typing import Optional

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    {% if include_rbac %}
    role = Column(String, default="user")  # user, admin, moderator, etc.
    {% endif %}

    def verify_password(self, plain_password: str) -> bool:
        """Verify a plain password against the hashed password"""
        return bcrypt.checkpw(plain_password.encode('utf-8'), self.hashed_password.encode('utf-8'))

    def set_password(self, password: str):
        """Hash and set the password"""
        self.hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

{% if include_rbac %}
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)  # admin, user, moderator
    description = Column(String)
    permissions = Column(String)  # JSON string of permissions
{% endif %}'''

        template = Template(template_content)
        return template.render(include_rbac=include_rbac, include_password_hashing=include_password_hashing)

    def _generate_python_schemas(self, include_rbac: bool) -> str:
        """Generate Python authentication schemas"""
        template_content = '''from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    {% if include_rbac %}
    role: Optional[str] = "user"
    {% endif %}

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    {% if include_rbac %}
    role: Optional[str] = None
    {% endif %}

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    {% if include_rbac %}
    role: str
    {% endif %}

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    {% if include_rbac %}
    role: Optional[str] = None
    {% endif %}

class LoginRequest(BaseModel):
    username: str
    password: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str'''

        template = Template(template_content)
        return template.render(include_rbac=include_rbac)

    def _generate_python_jwt_auth(self, include_rbac: bool) -> str:
        """Generate Python JWT authentication utilities"""
        template_content = '''import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .models import User
from .schemas import TokenData
import os

# Security scheme for API documentation
security = HTTPBearer()

# Secret key and algorithm from environment
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a new access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create a new refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception):
    """Verify a token and return token data"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")

        if username is None:
            raise credentials_exception
        if token_type != "access":
            raise credentials_exception

        token_data = TokenData(username=username{% if include_rbac %}, role=payload.get("role", "user"){% endif %})
        return token_data
    except jwt.PyJWTError:
        raise credentials_exception

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user from token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token, credentials_exception)

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.verify_password(password):
        return None
    return user

def login_user(db: Session, username: str, password: str) -> Optional[dict]:
    """Login user and return tokens"""
    user = authenticate_user(db, username, password)
    if not user:
        return None

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username{% if include_rbac %}, "role": user.role{% endif %}},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "user_id": user.id
    }

{% if include_rbac %}
def require_role(required_role: str):
    """Dependency to check if user has required role"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

def require_any_role(*required_roles: str):
    """Dependency to check if user has any of the required roles"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker
{% endif %}'''

        template = Template(template_content)
        return template.render(include_rbac=include_rbac)

    def _generate_python_oauth2_flow(self) -> str:
        """Generate Python OAuth2 flow"""
        template_content = '''from fastapi import HTTPException, status, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.authentication import requires
import os

# OAuth configuration
oauth = OAuth()

# Google OAuth
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# GitHub OAuth
oauth.register(
    name='github',
    client_id=os.getenv('GITHUB_CLIENT_ID'),
    client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

async def google_login(request: Request):
    """Initiate Google OAuth login"""
    redirect_uri = request.url_for('google_auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

async def google_auth_callback(request: Request):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        if user_info:
            # Process user info and create/login user
            user = await get_or_create_oauth_user(
                provider='google',
                provider_id=user_info['sub'],
                email=user_info['email'],
                name=user_info.get('name', user_info.get('given_name', ''))
            )
            # Generate JWT tokens for the user
            tokens = await generate_auth_tokens(user)
            # Redirect to frontend with tokens
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            return RedirectResponse(f"{frontend_url}/auth/callback?token={tokens['access_token']}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth authentication failed: {str(e)}")

async def github_login(request: Request):
    """Initiate GitHub OAuth login"""
    redirect_uri = request.url_for('github_auth_callback')
    return await oauth.github.authorize_redirect(request, redirect_uri)

async def github_auth_callback(request: Request):
    """Handle GitHub OAuth callback"""
    try:
        token = await oauth.github.authorize_access_token(request)
        user_info = await oauth.github.parse_id_token(request, token)

        # Get user profile from GitHub API
        github_user = await oauth.github.get('user', token=token)
        github_data = github_user.json()

        email = github_data.get('email')
        if not email:
            # Get user emails from GitHub API
            emails_response = await oauth.github.get('user/emails', token=token)
            emails = emails_response.json()
            for email_obj in emails:
                if email_obj.get('primary') and email_obj.get('verified'):
                    email = email_obj['email']
                    break

        if email:
            user = await get_or_create_oauth_user(
                provider='github',
                provider_id=str(github_data['id']),
                email=email,
                name=github_data.get('name', github_data.get('login', ''))
            )
            # Generate JWT tokens for the user
            tokens = await generate_auth_tokens(user)
            # Redirect to frontend with tokens
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            return RedirectResponse(f"{frontend_url}/auth/callback?token={tokens['access_token']}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth authentication failed: {str(e)}")

async def get_or_create_oauth_user(provider: str, provider_id: str, email: str, name: str):
    """Get existing user by OAuth provider or create new user"""
    from .models import User
    from .database import get_db

    db = next(get_db())

    # Check if user already exists with this provider
    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        # Create new user
        user = User(
            username=name.replace(" ", "_").lower(),
            email=email,
            hashed_password="",  # No password for OAuth users
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

async def generate_auth_tokens(user):
    """Generate JWT tokens for OAuth user"""
    from .jwt_auth import create_access_token, create_refresh_token
    from datetime import timedelta

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    refresh_token = create_refresh_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token
    }'''

        template = Template(template_content)
        return template.render()

    def _generate_python_password_utils(self) -> str:
        """Generate Python password utilities"""
        template_content = '''import bcrypt
from typing import Union
import re

def hash_password(password: str) -> str:
    """Hash a password with bcrypt"""
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed password"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    Returns (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit"

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"

    return True, ""

def generate_random_password(length: int = 12) -> str:
    """Generate a random password with specified length"""
    import secrets
    import string

    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

def sanitize_password_input(password: str) -> str:
    """Sanitize password input to prevent injection attacks"""
    # Remove null bytes and other potentially dangerous characters
    sanitized = password.replace('\x00', '').strip()
    return sanitized'''

        template = Template(template_content)
        return template.render()

    def _generate_python_rbac(self) -> str:
        """Generate Python role-based access control"""
        template_content = '''from enum import Enum
from typing import List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from .models import User, Role

class Permission(str, Enum):
    """Define available permissions"""
    READ_USERS = "read:users"
    WRITE_USERS = "write:users"
    DELETE_USERS = "delete:users"
    READ_PROFILE = "read:profile"
    WRITE_PROFILE = "write:profile"
    ADMIN_ACCESS = "admin:access"
    READ_ALL = "read:all"
    WRITE_ALL = "write:all"

class RolePermissions:
    """Define permissions for each role"""

    PERMISSIONS = {
        "admin": [
            Permission.READ_USERS,
            Permission.WRITE_USERS,
            Permission.DELETE_USERS,
            Permission.READ_PROFILE,
            Permission.WRITE_PROFILE,
            Permission.ADMIN_ACCESS,
            Permission.READ_ALL,
            Permission.WRITE_ALL
        ],
        "moderator": [
            Permission.READ_USERS,
            Permission.WRITE_USERS,
            Permission.READ_PROFILE,
            Permission.WRITE_PROFILE,
            Permission.READ_ALL
        ],
        "user": [
            Permission.READ_PROFILE,
            Permission.WRITE_PROFILE
        ],
        "guest": [
            Permission.READ_PROFILE
        ]
    }

    @classmethod
    def get_permissions_for_role(cls, role: str) -> List[Permission]:
        """Get permissions for a specific role"""
        return cls.PERMISSIONS.get(role, [])

    @classmethod
    def has_permission(cls, role: str, permission: Permission) -> bool:
        """Check if a role has a specific permission"""
        role_permissions = cls.get_permissions_for_role(role)
        return permission in role_permissions

    @classmethod
    def can_access_resource(cls, user_role: str, required_permission: Permission,
                           resource_owner_id: int = None, user_id: int = None) -> bool:
        """Check if user can access a resource"""
        # Admins can access everything
        if user_role == "admin":
            return True

        # Check basic permission
        if not cls.has_permission(user_role, required_permission):
            return False

        # For profile-specific permissions, check ownership
        if required_permission in [Permission.WRITE_PROFILE, Permission.READ_PROFILE]:
            if resource_owner_id and user_id:
                return resource_owner_id == user_id

        return True

def check_user_permissions(
    db: Session,
    user: User,
    required_permission: Permission,
    resource_owner_id: int = None
) -> bool:
    """Check if user has required permissions"""
    return RolePermissions.can_access_resource(
        user_role=user.role,
        required_permission=required_permission,
        resource_owner_id=resource_owner_id,
        user_id=user.id
    )

def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def permission_checker(current_user: User = Depends(get_current_user)):
        if not RolePermissions.has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return permission_checker

def get_user_roles_and_permissions(user: User) -> Dict[str, Any]:
    """Get user's role and associated permissions"""
    return {
        "role": user.role,
        "permissions": [perm.value for perm in RolePermissions.get_permissions_for_role(user.role)]
    }'''

        template = Template(template_content)
        return template.render()

    def _generate_python_auth_routes(self, auth_type: str, include_rbac: bool) -> str:
        """Generate Python authentication routes"""
        template_content = '''from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .models import User
from .schemas import UserCreate, UserResponse, Token, LoginRequest
from .jwt_auth import authenticate_user, login_user, get_current_user
from .password_utils import hash_password, validate_password_strength
from . import password_utils

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Create new user
    hashed_password = hash_password(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        {% if include_rbac %}
        role=user_data.role,
        {% endif %}
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return access token"""
    result = login_user(db, form_data.username, form_data.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Token(
        access_token=result["access_token"],
        token_type="bearer",
        refresh_token=result.get("refresh_token")
    )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client-side token invalidation)"""
    # In a real implementation, you might add the token to a blacklist
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    update_data = user_update.dict(exclude_unset=True)

    # Prevent changing username/email to one that already exists
    if "username" in update_data:
        existing_user = db.query(User).filter(
            User.username == update_data["username"],
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    if "email" in update_data:
        existing_user = db.query(User).filter(
            User.email == update_data["email"],
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    # Update user fields
    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user's password"""
    # Verify current password
    if not current_user.verify_password(request.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Validate new password strength
    is_valid, error_msg = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Update password
    current_user.set_password(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}

{% if auth_type in ['oauth2', 'both'] %}
# OAuth2 routes
@router.get("/oauth/google")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    from .oauth2_flow import google_login as google_auth
    return await google_auth(request)

@router.get("/oauth/google/callback")
async def google_auth_callback(request: Request):
    """Handle Google OAuth callback"""
    from .oauth2_flow import google_auth_callback
    return await google_auth_callback(request)

@router.get("/oauth/github")
async def github_login(request: Request):
    """Initiate GitHub OAuth login"""
    from .oauth2_flow import github_login as github_auth
    return await github_auth(request)

@router.get("/oauth/github/callback")
async def github_auth_callback(request: Request):
    """Handle GitHub OAuth callback"""
    from .oauth2_flow import github_auth_callback
    return await github_auth_callback(request)
{% endif %}'''

        template = Template(template_content)
        return template.render(auth_type=auth_type, include_rbac=include_rbac)

# For direct execution
if __name__ == "__main__":
    import sys
    import json

    # Read parameters from command line or stdin
    if len(sys.argv) > 1:
        params_str = sys.argv[1]
        params = json.loads(params_str)
    else:
        params_str = sys.stdin.read()
        params = json.loads(params_str)

    skill = AuthenticationSkill()
    result = skill.execute(params)
    print(json.dumps(result))