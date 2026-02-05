from typing import Dict, Any, List, Optional
from sqlmodel import Session, select
from backend.src.models.conversation import Conversation, Message
from backend.src.utils.database import get_session
from uuid import uuid4
from datetime import datetime, timedelta


class ContextManagerService:
    """
    Service to manage conversation context, history, and state across exchanges.
    Handles retrieving, constructing, and maintaining conversation context for the AI agent.
    """

    def __init__(self):
        pass

    def create_conversation(self, user_id: str) -> str:
        """
        Create a new conversation and return its ID.

        Args:
            user_id: The ID of the user creating the conversation

        Returns:
            ID of the newly created conversation
        """
        with get_session() as session:
            conversation = Conversation(
                user_id=user_id,
                title="New Conversation"
            )
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
            return str(conversation.id)

    def get_conversation_context(self, user_id: str, conversation_id: str) -> Dict[str, Any]:
        """
        Retrieve and construct the conversation context for a specific conversation.

        Args:
            user_id: The ID of the user
            conversation_id: The ID of the conversation

        Returns:
            Dictionary containing the conversation context including history and state
        """
        with get_session() as session:
            # Get the conversation
            conversation_statement = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            conversation = session.exec(conversation_statement).first()

            if not conversation:
                raise ValueError("Conversation not found or user unauthorized")

            # Get the conversation messages, ordered by sequence number
            messages_statement = select(Message).where(
                Message.conversation_id == conversation_id
            ).order_by(Message.sequence_number)
            messages = session.exec(messages_statement).all()

            # Format the context data
            context_data = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "previous_messages": [
                    {
                        "role": msg.message_type,
                        "content": msg.content,
                        "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                    } for msg in messages
                ],
                "active_tasks": [],  # This would come from conversation.context_data
                "recent_intents": [],  # This would come from conversation.context_data
                "context_summary": conversation.title  # Placeholder for actual context summary
            }

            return context_data

    def add_message_to_conversation(
        self,
        user_id: str,
        conversation_id: str,
        role: str,
        content: str
    ) -> None:
        """
        Add a message to the conversation history.

        Args:
            user_id: The ID of the user
            conversation_id: The ID of the conversation
            role: The role of the message sender ('user' or 'assistant')
            content: The content of the message
        """
        with get_session() as session:
            # Verify that the conversation belongs to the user
            conversation_statement = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            conversation = session.exec(conversation_statement).first()

            if not conversation:
                raise ValueError("Conversation not found or user unauthorized")

            # Get the next sequence number
            last_message_statement = select(Message).where(
                Message.conversation_id == conversation_id
            ).order_by(Message.sequence_number.desc()).limit(1)
            last_message = session.exec(last_message_statement).first()
            next_sequence = (last_message.sequence_number + 1) if last_message else 1

            # Create and add the message
            message = Message(
                conversation_id=conversation_id,
                message_type=role,
                content=content,
                sequence_number=next_sequence
            )
            session.add(message)

            # Update conversation activity
            conversation.last_activity_at = datetime.utcnow()
            session.add(conversation)

            session.commit()

    def get_conversation_history(
        self,
        user_id: str,
        conversation_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieve message history from a specific conversation.

        Args:
            user_id: The ID of the user
            conversation_id: The ID of the conversation
            limit: Number of messages to return (default: 10)

        Returns:
            List of message dictionaries
        """
        with get_session() as session:
            # Verify that the conversation belongs to the user
            conversation_statement = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            conversation = session.exec(conversation_statement).first()

            if not conversation:
                raise ValueError("Conversation not found or user unauthorized")

            # Get the messages, ordered by sequence number, limited by the specified count
            messages_statement = select(Message).where(
                Message.conversation_id == conversation_id
            ).order_by(Message.sequence_number.desc()).limit(limit)
            messages = session.exec(messages_statement).all()

            # Reverse the list to maintain chronological order (since we fetched in descending order)
            messages.reverse()

            return [
                {
                    "id": str(msg.id),
                    "role": msg.message_type,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                } for msg in messages
            ]

    def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve list of conversations for a user.

        Args:
            user_id: The ID of the user

        Returns:
            List of conversation summary dictionaries
        """
        with get_session() as session:
            # Get conversations for the user
            conversations_statement = select(Conversation).where(
                Conversation.user_id == user_id
            ).order_by(Conversation.last_activity_at.desc())
            conversations = session.exec(conversations_statement).all()

            return [
                {
                    "id": str(conv.id),
                    "title": conv.title,
                    "last_activity": conv.last_activity_at.isoformat() if conv.last_activity_at else None,
                    "message_count": conv.context_size,  # Placeholder - would need to count actual messages
                    "context_summary": f"Discussed {conv.context_size} items" if conv.context_size > 0 else "New conversation"
                } for conv in conversations
            ]

    def update_conversation_context(
        self,
        user_id: str,
        conversation_id: str,
        context_updates: Dict[str, Any]
    ) -> None:
        """
        Update specific aspects of the conversation context.

        Args:
            user_id: The ID of the user
            conversation_id: The ID of the conversation
            context_updates: Dictionary of context fields to update
        """
        with get_session() as session:
            # Get the conversation
            conversation_statement = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
            conversation = session.exec(conversation_statement).first()

            if not conversation:
                raise ValueError("Conversation not found or user unauthorized")

            # Update the context data with the provided updates
            current_context = conversation.context_data or {}
            current_context.update(context_updates)
            conversation.context_data = current_context

            session.add(conversation)
            session.commit()

    def cleanup_old_conversations(self, days_old: int = 30) -> int:
        """
        Clean up conversations older than the specified number of days.

        Args:
            days_old: Number of days old for a conversation to be considered for cleanup

        Returns:
            Number of conversations cleaned up
        """
        from datetime import datetime, timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        with get_session() as session:
            # Get old conversations to delete their associated messages first
            old_conv_statement = select(Conversation).where(
                Conversation.last_activity_at < cutoff_date
            )
            old_conversations = session.exec(old_conv_statement).all()

            # Delete associated messages first (due to foreign key constraint)
            deleted_count = 0
            for conv in old_conversations:
                # Delete messages for this conversation
                messages_to_delete = select(Message).where(Message.conversation_id == conv.id)
                messages = session.exec(messages_to_delete).all()

                for msg in messages:
                    session.delete(msg)

                # Delete the conversation itself
                session.delete(conv)
                deleted_count += 1

            session.commit()
            return deleted_count