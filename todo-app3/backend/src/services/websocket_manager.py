from typing import Dict, List
from fastapi import WebSocket
import asyncio
import json


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: str):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)

    def disconnect(self, websocket: WebSocket, conversation_id: str):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            if isinstance(message, dict):
                message = json.dumps(message)
            await websocket.send_text(message)
        except Exception:
            # Client disconnected, handle gracefully
            pass

    async def broadcast_to_conversation(self, conversation_id: str, message: dict):
        if isinstance(message, dict):
            message = json.dumps(message)

        if conversation_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[conversation_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Client disconnected, mark for removal
                    disconnected.append(connection)

            # Remove disconnected clients
            for connection in disconnected:
                self.active_connections[conversation_id].remove(connection)

            # Clean up empty conversation groups
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]