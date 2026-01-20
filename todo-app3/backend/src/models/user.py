from sqlmodel import SQLModel, Field, Column, DateTime
from typing import Optional
from datetime import datetime
import uuid


class User(SQLModel, table=True):
    __tablename__ = "users"

    # Fields for user model
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, nullable=False)
    username: Optional[str] = Field(default=None)
    password_hash: str = Field(nullable=False)  # Hashed password
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow))
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)