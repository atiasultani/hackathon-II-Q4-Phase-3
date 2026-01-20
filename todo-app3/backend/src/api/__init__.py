from fastapi import APIRouter
from .chat_endpoint import router as chat_router

api_router = APIRouter()
api_router.include_router(chat_router, prefix="/api", tags=["chat"])

__all__ = ["api_router"]