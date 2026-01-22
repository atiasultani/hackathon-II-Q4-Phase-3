from typing import Dict, List, Optional, Set
from datetime import datetime
import asyncio
import json
from enum import Enum
from dataclasses import dataclass, asdict
from fastapi import WebSocket
from .websocket_manager import WebSocketManager

# Enums for animation types
class AnimationEventType(str, Enum):
    AVATAR_EXPRESSION_UPDATE = "avatar_expression_update"
    AGENT_ACTIVITY_UPDATE = "agent_activity_update"
    ANIMATION_STATE_UPDATE = "animation_state_update"
    PROCESSING_START = "processing_start"
    PROCESSING_END = "processing_end"
    SKILL_ACTIVATION = "skill_activation"
    CONNECTION_STATUS = "connection_status"

class AnimationExpression(str, Enum):
    NEUTRAL = "neutral"
    HAPPY = "happy"
    THINKING = "thinking"
    LISTENING = "listening"
    PROCESSING = "processing"
    SURPRISED = "surprised"
    EXCITED = "excited"
    CONFUSED = "confused"
    WAITING = "waiting"
    GREETING = "greeting"

class AgentStatus(str, Enum):
    IDLE = "idle"
    ACTIVATING = "activating"
    ACTIVE = "active"
    DEACTIVATING = "deactivating"
    ERROR = "error"
    SUCCESS = "success"
    WARNING = "warning"

# Data models
@dataclass
class AnimationState:
    avatarExpression: str
    animationSequence: List[str]
    isActive: bool
    triggerEvent: str
    duration: int
    intensity: int

@dataclass
class AgentActivity:
    agentName: str
    status: str
    visualIndicator: str
    priority: int

@dataclass
class AnimationUpdate:
    event_type: str
    conversation_id: str
    data: dict
    timestamp: str

# WebSocket Manager for animation updates
class AnimationWebSocketManager:
    def __init__(self):
        self.manager = WebSocketManager()
        self.active_animations: Dict[str, AnimationState] = {}
        self.agent_activities: Dict[str, AgentActivity] = {}
        self.connection_stats: Dict[str, dict] = {}

    async def broadcast_animation_update(self, conversation_id: str, update: AnimationUpdate):
        """Broadcast animation update to all connected clients in a conversation"""
        try:
            await self.manager.broadcast_to_conversation(conversation_id, update.data)
        except Exception as e:
            print(f"Error broadcasting animation update: {e}")

    async def send_animation_update(self, websocket: WebSocket, update: AnimationUpdate):
        """Send animation update to a specific client"""
        try:
            await self.manager.send_personal_message(json.dumps(update.data), websocket)
        except Exception as e:
            print(f"Error sending animation update: {e}")

    async def update_avatar_expression(
        self,
        conversation_id: str,
        expression: AnimationExpression,
        trigger_event: str = "manual",
        intensity: int = 5,
        duration: int = 300
    ):
        """Update avatar expression for a conversation"""
        animation_state = AnimationState(
            avatarExpression=expression,
            animationSequence=[trigger_event],
            isActive=True,
            triggerEvent=trigger_event,
            duration=duration,
            intensity=intensity
        )

        self.active_animations[conversation_id] = animation_state

        update_data = {
            "event_type": AnimationEventType.AVATAR_EXPRESSION_UPDATE,
            "conversation_id": conversation_id,
            "animation_state": asdict(animation_state),
            "timestamp": datetime.utcnow().isoformat()
        }

        update = AnimationUpdate(
            event_type=AnimationEventType.AVATAR_EXPRESSION_UPDATE,
            conversation_id=conversation_id,
            data=update_data,
            timestamp=datetime.utcnow().isoformat()
        )

        await self.broadcast_animation_update(conversation_id, update)

    async def update_agent_activity(
        self,
        conversation_id: str,
        agent_name: str,
        status: AgentStatus,
        visual_indicator: str = "badge",
        priority: int = 3
    ):
        """Update agent activity for a conversation"""
        agent_activity = AgentActivity(
            agentName=agent_name,
            status=status,
            visualIndicator=visual_indicator,
            priority=priority
        )

        self.agent_activities[f"{conversation_id}:{agent_name}"] = agent_activity

        update_data = {
            "event_type": AnimationEventType.AGENT_ACTIVITY_UPDATE,
            "conversation_id": conversation_id,
            "agent_activity": asdict(agent_activity),
            "timestamp": datetime.utcnow().isoformat()
        }

        update = AnimationUpdate(
            event_type=AnimationEventType.AGENT_ACTIVITY_UPDATE,
            conversation_id=conversation_id,
            data=update_data,
            timestamp=datetime.utcnow().isoformat()
        )

        await self.broadcast_animation_update(conversation_id, update)

    async def trigger_processing_animation(
        self,
        conversation_id: str,
        agent_name: str,
        processing_steps: List[str] = None
    ):
        """Trigger processing animations for a specific agent"""
        if processing_steps is None:
            processing_steps = ["activating", "processing", "completing"]

        # Start with activating state
        await self.update_agent_activity(
            conversation_id,
            agent_name,
            AgentStatus.ACTIVATING,
            "pulse",
            4
        )

        await self.update_avatar_expression(
            conversation_id,
            AnimationExpression.PROCESSING,
            f"skill_activation_{agent_name}",
            intensity=7
        )

        # Simulate processing steps
        for step in processing_steps:
            await asyncio.sleep(0.5)  # Simulate processing time

            await self.update_avatar_expression(
                conversation_id,
                AnimationExpression.THINKING,
                f"data_processing_{step}",
                intensity=6
            )

            await self.update_agent_activity(
                conversation_id,
                agent_name,
                AgentStatus.ACTIVE,
                "progress",
                4
            )

        # Complete the process
        await self.update_agent_activity(
            conversation_id,
            agent_name,
            AgentStatus.SUCCESS,
            "notification",
            5
        )

        await self.update_avatar_expression(
            conversation_id,
            AnimationExpression.HAPPY,
            "process_complete",
            intensity=6
        )

    async def broadcast_processing_start(
        self,
        conversation_id: str,
        user_message: str
    ):
        """Broadcast that processing has started"""
        await self.update_avatar_expression(
            conversation_id,
            AnimationExpression.LISTENING,
            "user_message_received",
            intensity=5
        )

        update_data = {
            "event_type": AnimationEventType.PROCESSING_START,
            "conversation_id": conversation_id,
            "user_message": user_message,
            "timestamp": datetime.utcnow().isoformat()
        }

        update = AnimationUpdate(
            event_type=AnimationEventType.PROCESSING_START,
            conversation_id=conversation_id,
            data=update_data,
            timestamp=datetime.utcnow().isoformat()
        )

        await self.broadcast_animation_update(conversation_id, update)

    async def broadcast_processing_end(
        self,
        conversation_id: str,
        response: str,
        success: bool = True
    ):
        """Broadcast that processing has ended"""
        expression = AnimationExpression.HAPPY if success else AnimationExpression.CONFUSED
        intensity = 6 if success else 8

        await self.update_avatar_expression(
            conversation_id,
            expression,
            "response_generated" if success else "error_occurred",
            intensity=intensity
        )

        update_data = {
            "event_type": AnimationEventType.PROCESSING_END,
            "conversation_id": conversation_id,
            "response": response,
            "success": success,
            "timestamp": datetime.utcnow().isoformat()
        }

        update = AnimationUpdate(
            event_type=AnimationEventType.PROCESSING_END,
            conversation_id=conversation_id,
            data=update_data,
            timestamp=datetime.utcnow().isoformat()
        )

        await self.broadcast_animation_update(conversation_id, update)

    async def handle_skill_activation(
        self,
        conversation_id: str,
        skill_name: str,
        parameters: dict = None
    ):
        """Handle skill activation and related animations"""
        if parameters is None:
            parameters = {}

        # Update avatar to indicate skill activation
        await self.update_avatar_expression(
            conversation_id,
            AnimationExpression.THINKING,
            f"skill_activation_{skill_name}",
            intensity=6
        )

        # Update agent activity
        await self.update_agent_activity(
            conversation_id,
            skill_name,
            AgentStatus.ACTIVATING,
            "pulse",
            4
        )

        # Broadcast skill activation
        update_data = {
            "event_type": AnimationEventType.SKILL_ACTIVATION,
            "conversation_id": conversation_id,
            "skill_name": skill_name,
            "parameters": parameters,
            "timestamp": datetime.utcnow().isoformat()
        }

        update = AnimationUpdate(
            event_type=AnimationEventType.SKILL_ACTIVATION,
            conversation_id=conversation_id,
            data=update_data,
            timestamp=datetime.utcnow().isoformat()
        )

        await self.broadcast_animation_update(conversation_id, update)

        # Simulate skill processing
        await self.trigger_processing_animation(
            conversation_id,
            skill_name,
            ["validating", "executing", "finalizing"]
        )

    async def handle_connection_status(
        self,
        conversation_id: str,
        client_id: str,
        status: str
    ):
        """Handle connection status updates"""
        update_data = {
            "event_type": AnimationEventType.CONNECTION_STATUS,
            "conversation_id": conversation_id,
            "client_id": client_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }

        update = AnimationUpdate(
            event_type=AnimationEventType.CONNECTION_STATUS,
            conversation_id=conversation_id,
            data=update_data,
            timestamp=datetime.utcnow().isoformat()
        )

        await self.broadcast_animation_update(conversation_id, update)

        # Update connection stats
        if conversation_id not in self.connection_stats:
            self.connection_stats[conversation_id] = {}
        self.connection_stats[conversation_id][client_id] = {
            "status": status,
            "last_update": datetime.utcnow().isoformat()
        }

    def get_active_animations_for_conversation(self, conversation_id: str) -> dict:
        """Get all active animations for a conversation"""
        conversation_animations = {}

        # Find animations for this conversation
        for conv_id, state in self.active_animations.items():
            if conv_id == conversation_id:
                conversation_animations[conv_id] = asdict(state)

        # Find agent activities for this conversation
        conversation_agents = {}
        for key, activity in self.agent_activities.items():
            if key.startswith(f"{conversation_id}:"):
                agent_name = key.split(":")[1]
                conversation_agents[agent_name] = asdict(activity)

        return {
            "conversation_id": conversation_id,
            "animations": conversation_animations,
            "agent_activities": conversation_agents,
            "connection_stats": self.connection_stats.get(conversation_id, {})
        }

    async def cleanup_conversation(self, conversation_id: str):
        """Clean up animation data for a conversation"""
        # Remove animation states
        keys_to_remove = [key for key in self.active_animations.keys() if key.startswith(conversation_id)]
        for key in keys_to_remove:
            del self.active_animations[key]

        # Remove agent activities
        keys_to_remove = [key for key in self.agent_activities.keys() if key.startswith(conversation_id)]
        for key in keys_to_remove:
            del self.agent_activities[key]

        # Remove connection stats
        if conversation_id in self.connection_stats:
            del self.connection_stats[conversation_id]

# Global animation service instance
animation_service = AnimationWebSocketManager()

# Convenience functions for other parts of the application
async def trigger_animation_for_conversation(conversation_id: str, expression: AnimationExpression, event: str = "manual", intensity: int = 5):
    """Convenience function to trigger an animation for a conversation"""
    await animation_service.update_avatar_expression(conversation_id, expression, event, intensity)

async def trigger_agent_activity(conversation_id: str, agent_name: str, status: AgentStatus):
    """Convenience function to trigger agent activity update"""
    await animation_service.update_agent_activity(conversation_id, agent_name, status)

async def broadcast_processing_start(conversation_id: str, user_message: str):
    """Convenience function to broadcast processing start"""
    await animation_service.broadcast_processing_start(conversation_id, user_message)

async def broadcast_processing_end(conversation_id: str, response: str, success: bool = True):
    """Convenience function to broadcast processing end"""
    await animation_service.broadcast_processing_end(conversation_id, response, success)