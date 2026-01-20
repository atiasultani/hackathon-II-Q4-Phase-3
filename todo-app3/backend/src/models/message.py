from sqlmodel import SQLModel, Field, Column, DateTime, String
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .conversation import Conversation  # Forward reference for type checking


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    # Fields as specified in the requirements
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)  # Assuming user management exists
    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False)
    role: str = Field(sa_column=Column(String(20), nullable=False))  # 'user' or 'assistant'
    content: str = Field(nullable=False)
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), default=datetime.utcnow))

    # Indexes would be handled by the database configuration
    # Foreign key relationships to user and conversation are enforced by fields