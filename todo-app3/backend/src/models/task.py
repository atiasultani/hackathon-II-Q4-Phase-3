from sqlmodel import SQLModel, Field, Column, DateTime, Boolean, String
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .conversation import Conversation  # Forward reference for type checking


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    # Fields as specified in the requirements
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)  # Assuming user management exists
    title: str = Field(sa_column=Column(String(255), nullable=False))
    description: Optional[str] = Field(default=None)
    completed: bool = Field(default=False)
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow))

    # Indexes would be handled by the database configuration
    # Foreign key relationship to user is enforced by user_id field