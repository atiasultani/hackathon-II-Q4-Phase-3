from sqlmodel import SQLModel, Field, Column, DateTime
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .message import Message  # Forward reference for type checking


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    # Fields as specified in the requirements
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)  # Assuming user management exists
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow))
    updated_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow))

    # Indexes would be handled by the database configuration
    # Foreign key relationship to user is enforced by user_id field