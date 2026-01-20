from fastapi import Request, HTTPException, status
from datetime import datetime, timedelta
from collections import defaultdict
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Rate limit configuration from environment
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

# In-memory storage for rate limiting (would use Redis in production)
request_counts = defaultdict(list)


def rate_limit_middleware(request: Request):
    """
    Rate limiting middleware to enforce rate limits per user
    Implements 60 requests per minute per user as specified in the requirements
    """
    # Get user ID from request state (set by auth middleware)
    user_id = getattr(request.state, 'user_id', None)

    if not user_id:
        # If no user_id, use IP address as identifier for unauthenticated requests
        user_id = request.client.host

    current_time = time.time()

    # Clean up old requests (older than 1 minute)
    request_counts[user_id] = [
        req_time for req_time in request_counts[user_id]
        if current_time - req_time < 60
    ]

    # Check if user has exceeded rate limit
    if len(request_counts[user_id]) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit exceeded. Maximum {RATE_LIMIT_PER_MINUTE} requests per minute."
                }
            }
        )

    # Add current request to the list
    request_counts[user_id].append(current_time)


def get_current_request_count(user_id: str) -> int:
    """
    Get the current number of requests for a user in the last minute
    """
    current_time = time.time()

    # Clean up old requests
    request_counts[user_id] = [
        req_time for req_time in request_counts[user_id]
        if current_time - req_time < 60
    ]

    return len(request_counts[user_id])