from sqlmodel import Session, select
from typing import List, Optional
from ..models import Task, Conversation, Message
from uuid import UUID


class DatabaseService:
    """
    Service class for database operations following the requirements
    """

    def __init__(self, session: Session):
        self.session = session

    # Task operations
    def create_task(self, user_id: UUID, title: str, description: Optional[str] = None) -> Task:
        """Create a new task with the provided details"""
        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            completed=False
        )
        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task

    def get_user_tasks(self, user_id: UUID, status: Optional[str] = None) -> List[Task]:
        """Get tasks for a specific user with optional status filter"""
        query = select(Task).where(Task.user_id == user_id)

        if status:
            if status == "active":
                query = query.where(Task.completed == False)
            elif status == "completed":
                query = query.where(Task.completed == True)

        return self.session.exec(query).all()

    def get_task_by_id(self, user_id: UUID, task_id: UUID) -> Optional[Task]:
        """Get a specific task by ID for a user (ensures ownership)"""
        query = select(Task).where(Task.user_id == user_id, Task.id == task_id)
        return self.session.exec(query).first()

    def update_task(self, user_id: UUID, task_id: UUID, title: Optional[str] = None,
                   description: Optional[str] = None, completed: Optional[bool] = None) -> Optional[Task]:
        """Update a specific task for a user"""
        task = self.get_task_by_id(user_id, task_id)
        if not task:
            return None

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if completed is not None:
            task.completed = completed

        self.session.add(task)
        self.session.commit()
        self.session.refresh(task)
        return task

    def delete_task(self, user_id: UUID, task_id: UUID) -> bool:
        """Delete a specific task for a user"""
        task = self.get_task_by_id(user_id, task_id)
        if not task:
            return False

        self.session.delete(task)
        self.session.commit()
        return True

    # Conversation operations
    def create_conversation(self, user_id: UUID) -> Conversation:
        """Create a new conversation for a user"""
        conversation = Conversation(user_id=user_id)
        self.session.add(conversation)
        self.session.commit()
        self.session.refresh(conversation)
        return conversation

    def get_conversation_by_id(self, user_id: UUID, conversation_id: UUID) -> Optional[Conversation]:
        """Get a specific conversation by ID for a user (ensures ownership)"""
        query = select(Conversation).where(
            Conversation.user_id == user_id,
            Conversation.id == conversation_id
        )
        return self.session.exec(query).first()

    # Message operations
    def create_message(self, user_id: UUID, conversation_id: UUID, role: str, content: str) -> Message:
        """Create a new message in a conversation"""
        message = Message(
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    def get_messages_for_conversation(self, conversation_id: UUID) -> List[Message]:
        """Get all messages for a conversation ordered chronologically"""
        query = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc())
        return self.session.exec(query).all()

    def get_conversations_for_user(self, user_id: UUID) -> List[Conversation]:
        """Get all conversations for a user ordered by last activity"""
        query = select(Conversation).where(
            Conversation.user_id == user_id
        ).order_by(Conversation.updated_at.desc())
        return self.session.exec(query).all()

    def get_recent_messages_for_conversation(self, conversation_id: UUID, limit: int = 10) -> List[Message]:
        """Get recent messages for a conversation (useful for context)"""
        query = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).limit(limit)
        return self.session.exec(query).all()

    def cleanup_old_conversations(self, days_old: int = 730) -> int:  # 730 days = 2 years
        """Clean up conversations older than specified days (retention policy)"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        # First, get old conversations to delete their associated messages
        old_conv_query = select(Conversation).where(
            Conversation.updated_at < cutoff_date
        )
        old_conversations = self.session.exec(old_conv_query).all()

        # Delete associated messages first (due to foreign key constraint)
        for conv in old_conversations:
            msg_delete_query = select(Message).where(Message.conversation_id == conv.id)
            messages = self.session.exec(msg_delete_query).all()
            for msg in messages:
                self.session.delete(msg)

        # Then delete the conversations
        deleted_count = 0
        for conv in old_conversations:
            self.session.delete(conv)
            deleted_count += 1

        self.session.commit()
        return deleted_count