from sqlmodel import SQLModel, Field, Column, DateTime
from typing import Optional
from datetime import datetime
import uuid


class User(SQLModel, table=True):
    __tablename__ = "users"

    # Fields for user model according to specification
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, nullable=False, max_length=255)
    username: Optional[str] = Field(default=None)
    hashed_password: str = Field(nullable=False)  # BCrypt hashed password
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow))
    is_active: bool = Field(default=True)
    email_verified: bool = Field(default=False)
    last_login_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))