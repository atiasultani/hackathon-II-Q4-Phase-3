from sqlmodel import Session, select
from backend.src.models.user import User
from backend.src.utils.security import get_password_hash, verify_password
from typing import Optional

class UserService:
    """
    Service class to handle user-related operations.
    """

    @staticmethod
    def create_user(*, session: Session, email: str, password: str) -> User:
        """
        Create a new user with the given email and password.
        """
        # Check if user with this email already exists
        existing_user = session.exec(select(User).where(User.email == email)).first()
        if existing_user:
            raise ValueError("Email already registered")

        # Hash the password
        hashed_password = get_password_hash(password)

        # Create the new user
        db_user = User(email=email, password_hash=hashed_password)
        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        return db_user

    @staticmethod
    def authenticate_user(*, session: Session, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user with the given email and password.
        Returns the user if credentials are valid, None otherwise.
        """
        user = session.exec(select(User).where(User.email == email)).first()

        if not user or not verify_password(password, user.password_hash):
            return None

        return user

    @staticmethod
    def get_user_by_email(*, session: Session, email: str) -> Optional[User]:
        """
        Retrieve a user by their email address.
        """
        return session.exec(select(User).where(User.email == email)).first()

    @staticmethod
    def get_user_by_id(*, session: Session, user_id: str) -> Optional[User]:
        """
        Retrieve a user by their ID.
        """
        statement = select(User).where(User.id == user_id)
        return session.exec(statement).first()

    @staticmethod
    def update_user(*, session: Session, user_id: str, **kwargs) -> Optional[User]:
        """
        Update a user with the given ID.
        """
        user = session.exec(select(User).where(User.id == user_id)).first()

        if not user:
            return None

        # Update user fields based on provided kwargs
        for field, value in kwargs.items():
            if hasattr(user, field):
                setattr(user, field, value)

        session.add(user)
        session.commit()
        session.refresh(user)

        return user