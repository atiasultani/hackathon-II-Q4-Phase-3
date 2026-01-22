from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List, Optional
from pydantic import BaseModel
import asyncio
import json
from datetime import datetime
from ..models import User
from ..services.websocket_manager import WebSocketManager

router = APIRouter()

# Models for animation state
class AnimationState(BaseModel):
    avatarExpression: str
    animationSequence: List[str]
    isActive: bool
    triggerEvent: str
    duration: int
    intensity: int

class AnimationStateUpdate(BaseModel):
    event_type: str = "animation_state_update"
    conversation_id: str
    animation_state: AnimationState
    timestamp: str

class AgentActivity(BaseModel):
    agentName: str
    status: str
    visualIndicator: str
    priority: int

class AgentActivityUpdate(BaseModel):
    event_type: str = "agent_activity_update"
    conversation_id: str
    agent_activity: AgentActivity
    timestamp: str

class AnimationPerformanceMetrics(BaseModel):
    device_info: Dict[str, any]
    performance_metrics: Dict[str, float]
    timestamp: str

# WebSocket Manager for animation updates
manager = WebSocketManager()

# Store for animation states
animation_states: Dict[str, AnimationState] = {}
agent_activities: Dict[str, AgentActivity] = {}

@router.websocket("/ws/animation/{conversation_id}")
async def websocket_animation_endpoint(websocket: WebSocket, conversation_id: str):
    """
    WebSocket endpoint for real-time animation state updates
    """
    await manager.connect(websocket, conversation_id)
    try:
        while True:
            # Listen for messages from frontend (if needed)
            try:
                data = await websocket.receive_text()
                # Process any commands from frontend
                message = json.loads(data)

                if message.get("type") == "ping":
                    # Respond to ping
                    await manager.send_personal_message(json.dumps({"type": "pong"}), websocket)

            except:
                # Continue the loop even if no message is received
                await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)

@router.post("/animation/state/{conversation_id}")
async def update_animation_state(
    conversation_id: str,
    animation_state: AnimationState,
    current_user: User = Depends(get_current_user)
):
    """
    Update animation state for a specific conversation
    """
    # Store the animation state
    animation_states[conversation_id] = animation_state

    # Broadcast the update to all connected clients
    update_data = AnimationStateUpdate(
        conversation_id=conversation_id,
        animation_state=animation_state,
        timestamp=datetime.utcnow().isoformat()
    )

    await manager.broadcast_to_conversation(conversation_id, update_data.dict())

    return {
        "success": True,
        "conversation_id": conversation_id,
        "animation_state": animation_state.dict()
    }

@router.get("/animation/state/{conversation_id}")
async def get_animation_state(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get current animation state for a conversation
    """
    state = animation_states.get(conversation_id)
    if not state:
        return {
            "conversation_id": conversation_id,
            "animation_state": None,
            "message": "No animation state found for this conversation"
        }

    return {
        "conversation_id": conversation_id,
        "animation_state": state.dict()
    }

@router.post("/agent/activity/{conversation_id}")
async def update_agent_activity(
    conversation_id: str,
    agent_activity: AgentActivity,
    current_user: User = Depends(get_current_user)
):
    """
    Update agent activity for a specific conversation
    """
    # Store the agent activity
    agent_activities[conversation_id] = agent_activity

    # Broadcast the update to all connected clients
    update_data = AgentActivityUpdate(
        conversation_id=conversation_id,
        agent_activity=agent_activity,
        timestamp=datetime.utcnow().isoformat()
    )

    await manager.broadcast_to_conversation(conversation_id, update_data.dict())

    return {
        "success": True,
        "conversation_id": conversation_id,
        "agent_activity": agent_activity.dict()
    }

@router.get("/agent/activity/{conversation_id}")
async def get_agent_activity(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get current agent activity for a conversation
    """
    activity = agent_activities.get(conversation_id)
    if not activity:
        return {
            "conversation_id": conversation_id,
            "agent_activity": None,
            "message": "No agent activity found for this conversation"
        }

    return {
        "conversation_id": conversation_id,
        "agent_activity": activity.dict()
    }

@router.post("/animation/trigger/{conversation_id}")
async def trigger_animation_event(
    conversation_id: str,
    trigger_data: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Trigger a specific animation event for a conversation
    """
    event_type = trigger_data.get("event_type", "custom")
    context = trigger_data.get("context", {})

    # Create an animation state based on the event
    new_state = AnimationState(
        avatarExpression=context.get("avatar_expression", "neutral"),
        animationSequence=[event_type],
        isActive=True,
        triggerEvent=event_type,
        duration=context.get("duration", 300),
        intensity=context.get("intensity", 5)
    )

    # Store and broadcast
    animation_states[conversation_id] = new_state

    update_data = AnimationStateUpdate(
        conversation_id=conversation_id,
        animation_state=new_state,
        timestamp=datetime.utcnow().isoformat()
    )

    await manager.broadcast_to_conversation(conversation_id, update_data.dict())

    return {
        "success": True,
        "animation_triggered": True,
        "animation_id": f"{conversation_id}_{event_type}_{datetime.utcnow().timestamp()}",
        "event_type": event_type
    }

@router.get("/animation/active-conversations")
async def get_active_animations(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of conversations with active animations
    """
    active_conversations = []
    for conv_id, state in animation_states.items():
        if state.isActive:
            active_conversations.append({
                "conversation_id": conv_id,
                "avatar_expression": state.avatarExpression,
                "active_agents": len([aid for aid, act in agent_activities.items() if aid.startswith(conv_id)])
            })

    return {
        "active_conversations": active_conversations,
        "total_active": len(active_conversations)
    }

# Dependency to get current user (would be implemented based on your auth system)
async def get_current_user():
    # Placeholder - implement based on your authentication system
    # This should extract user from token/cookie/header
    return User(id="placeholder_user_id", email="user@example.com")

# Additional utility endpoints
@router.delete("/animation/reset/{conversation_id}")
async def reset_animation_state(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Reset animation state for a conversation
    """
    if conversation_id in animation_states:
        del animation_states[conversation_id]

    if conversation_id in agent_activities:
        del agent_activities[conversation_id]

    # Broadcast reset to all clients
    reset_data = {
        "event_type": "animation_reset",
        "conversation_id": conversation_id,
        "timestamp": datetime.utcnow().isoformat()
    }

    await manager.broadcast_to_conversation(conversation_id, reset_data)

    return {
        "success": True,
        "conversation_id": conversation_id,
        "message": "Animation state reset"
    }