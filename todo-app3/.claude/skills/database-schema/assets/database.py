"""
Database Configuration for FastAPI Applications

This module provides database configuration for PostgreSQL, MongoDB, and SQLite
with proper connection management and session handling.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
import os


# Database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Create engine based on database type
if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=30,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
elif DATABASE_URL.startswith("sqlite"):
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
else:
    # Default to SQLite
    from sqlalchemy.pool import StaticPool
    engine = create_engine(
        "sqlite:///./app.db",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# For MongoDB integration
def get_mongo_client():
    """
    Get MongoDB client connection
    """
    from pymongo import MongoClient
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    return MongoClient(mongo_url)


# For ODMantic integration
def get_odmantic_engine():
    """
    Get ODMantic engine for MongoDB
    """
    from odmantic import AIOEngine
    from motor.motor_asyncio import AsyncIOMotorClient

    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    client = AsyncIOMotorClient(mongo_url)
    database_name = os.getenv("MONGO_DATABASE", "fastapi_app")

    return AIOEngine(client=client, database=database_name)