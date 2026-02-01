"""
Example Usage of Database Schema Generator

This file demonstrates how to use the generated database schema
with FastAPI applications for PostgreSQL, MongoDB, and SQLite.
"""

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

# Import generated models and database configuration
from database import get_db, Base
from models.user import User  # Example generated model
from schemas.user import UserCreate, UserResponse  # Example generated schemas

app = FastAPI(title="Database Schema Example API")

# Example endpoint using generated models
@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user
    """
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all users with pagination
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get a specific user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Example for MongoDB with ODMantic
# Uncomment if using MongoDB
"""
from odmantic import AIOEngine
from models.mongo_user import MongoUser  # Example MongoDB model
from schemas.user import UserCreate, UserResponse

@app.post("/mongo-users/", response_model=UserResponse)
async def create_mongo_user(user: UserCreate, engine: AIOEngine = Depends(get_odmantic_engine)):
    '''
    Create a new user in MongoDB
    '''
    db_user = MongoUser(**user.dict())
    return await engine.save(db_user)
"""


# Health check endpoint
@app.get("/health")
def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "database": "connected"}


# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    """
    Create database tables on startup
    """
    from database import engine
    Base.metadata.create_all(bind=engine)
    print("Database tables created")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )