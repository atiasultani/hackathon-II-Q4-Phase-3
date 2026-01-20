# FastAPI Database Integration Patterns

## Database Connection Management

### SQLAlchemy with FastAPI
```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import asynccontextmanager

# Database URL - use environment variables in production
DATABASE_URL = "postgresql://user:password@localhost/dbname"

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Application lifespan for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database connections, run migrations, etc.
    print("Starting up...")
    yield
    # Shutdown: Close connections, cleanup resources
    print("Shutting down...")
    engine.dispose()

app = FastAPI(lifespan=lifespan)
```

### MongoDB with FastAPI (ODMantic)
```python
from fastapi import FastAPI
from odmantic import AIOEngine
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager

# Global engine instance
engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global engine
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    engine = AIOEngine(client=client, database="myapp")
    print("Connected to MongoDB")
    yield
    # Shutdown
    print("Closing MongoDB connection")
    client.close()

app = FastAPI(lifespan=lifespan)

def get_engine():
    """Dependency to get database engine"""
    return engine
```

## Dependency Injection Patterns

### Database Session Dependency
```python
from fastapi import Depends
from sqlalchemy.orm import Session

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### MongoDB Engine Dependency
```python
from odmantic import AIOEngine

async def get_engine() -> AIOEngine:
    return engine

@app.get("/posts/{post_id}")
async def get_post(
    post_id: str,
    engine: AIOEngine = Depends(get_engine)
):
    post = await engine.find_one(Post, Post.id == post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
```

## Repository Pattern Implementation

### SQL Repository Pattern
```python
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, user: UserCreate) -> User:
        db_user = User(**user.dict())
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        db_user = self.get_user_by_id(user_id)
        if db_user:
            update_data = user_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_user, field, value)
            self.db.commit()
            self.db.refresh(db_user)
        return db_user

    def delete_user(self, user_id: int) -> bool:
        db_user = self.get_user_by_id(user_id)
        if db_user:
            self.db.delete(db_user)
            self.db.commit()
            return True
        return False

# Usage in endpoints
@app.post("/users/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    return user_repo.create_user(user)
```

### MongoDB Repository Pattern
```python
from typing import List, Optional
from odmantic import AIOEngine, Field

class PostRepository:
    def __init__(self, engine: AIOEngine):
        self.engine = engine

    async def create_post(self, post: PostCreate) -> Post:
        new_post = Post(**post.dict())
        return await self.engine.save(new_post)

    async def get_post_by_id(self, post_id: str) -> Optional[Post]:
        return await self.engine.find_one(Post, Post.id == post_id)

    async def get_posts(self, skip: int = 0, limit: int = 100) -> List[Post]:
        return await self.engine.find(Post, skip=skip, limit=limit)

    async def update_post(self, post_id: str, post_update: PostUpdate) -> Optional[Post]:
        post = await self.get_post_by_id(post_id)
        if post:
            update_data = post_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(post, field, value)
            post = await self.engine.save(post)
        return post

    async def delete_post(self, post_id: str) -> bool:
        result = await self.engine.delete(Post, Post.id == post_id)
        return result.deleted_count > 0

# Usage in endpoints
@app.post("/posts/", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    engine: AIOEngine = Depends(get_engine)
):
    post_repo = PostRepository(engine)
    return await post_repo.create_post(post)
```

## Advanced Integration Patterns

### Connection Pooling Configuration
```python
# PostgreSQL connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

def create_postgres_engine():
    DATABASE_URL = "postgresql://user:password@localhost:5432/mydb"

    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,          # Number of connections to maintain
        max_overflow=30,       # Additional connections beyond pool_size
        pool_pre_ping=True,    # Verify connections before use
        pool_recycle=3600,     # Recycle connections after 1 hour
        pool_timeout=30,       # Time to wait for connection from pool
        echo=False             # Set to True for SQL query logging
    )
    return engine

# SQLite connection pooling (with StaticPool)
def create_sqlite_engine(db_path: str = "app.db"):
    engine = create_engine(
        f"sqlite:///{db_path}",
        poolclass=StaticPool,  # SQLite works best with static pool
        connect_args={
            "check_same_thread": False,  # Allow multi-threaded access
            "timeout": 30,  # 30 second timeout for database locks
        },
        echo=False
    )

    # Apply SQLite pragmas for performance
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")  # Enable foreign key constraints
        cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging for concurrency
        cursor.execute("PRAGMA synchronous=NORMAL")  # Balance between safety and speed
        cursor.close()

    return engine
```

### Transaction Management
```python
from contextlib import contextmanager
from sqlalchemy.exc import SQLAlchemyError

@contextmanager
def get_db_transaction():
    """Context manager for database transactions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    finally:
        db.close()

# Usage in complex operations
@app.post("/orders/")
async def create_order_with_items(order_data: OrderCreate, db: Session = Depends(get_db)):
    try:
        # Create order
        order = Order(**order_data.dict())
        db.add(order)

        # Create order items
        for item_data in order_data.items:
            item = OrderItem(order=order, **item_data.dict())
            db.add(item)

        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

### Async MongoDB Operations
```python
from typing import List
import asyncio

class UserService:
    def __init__(self, engine: AIOEngine):
        self.engine = engine

    async def get_users_with_posts_count(self) -> List[dict]:
        """Get users with their post count using aggregation"""
        pipeline = [
            {
                "$lookup": {
                    "from": "posts",
                    "localField": "_id",
                    "foreignField": "author_id",
                    "as": "posts"
                }
            },
            {
                "$addFields": {
                    "post_count": {"$size": "$posts"}
                }
            },
            {
                "$project": {
                    "name": 1,
                    "email": 1,
                    "post_count": 1
                }
            }
        ]

        return await self.engine.get_collection(User).aggregate(pipeline).to_list(length=None)

# FastAPI endpoint using the service
@app.get("/users/summary")
async def get_users_summary(engine: AIOEngine = Depends(get_engine)):
    service = UserService(engine)
    return await service.get_users_with_posts_count()
```

## Error Handling and Validation

### Database Error Handling
```python
from sqlalchemy.exc import IntegrityError, DataError
from fastapi import HTTPException, status

@app.post("/users/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        db_user = User(email=user.email, name=user.name)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    except DataError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid data provided"
        )
```

### MongoDB Error Handling
```python
from odmantic.exceptions import DocumentNotFoundError
from pymongo.errors import DuplicateKeyError

@app.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    engine: AIOEngine = Depends(get_engine)
):
    try:
        user = await engine.find_one(User, User.id == user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update user
        for field, value in user_update.dict(exclude_unset=True).items():
            setattr(user, field, value)

        updated_user = await engine.save(user)
        return updated_user
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="User with this email already exists"
        )
```

## Performance Optimization

### Query Optimization
```python
from sqlalchemy.orm import selectinload, joinedload

# Eager loading to prevent N+1 queries
@app.get("/users/", response_model=List[UserResponse])
async def get_users_with_posts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    users = db.query(User).options(selectinload(User.posts)).offset(skip).limit(limit).all()
    return users

# Using raw SQL for complex queries
@app.get("/user-analytics")
async def get_user_analytics(db: Session = Depends(get_db)):
    from sqlalchemy import text

    result = db.execute(text("""
        SELECT
            u.name,
            COUNT(p.id) as post_count,
            AVG(LENGTH(p.content)) as avg_content_length
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        GROUP BY u.id, u.name
        ORDER BY post_count DESC
    """)).fetchall()

    return [{"name": row[0], "post_count": row[1], "avg_content_length": row[2]} for row in result]
```

### MongoDB Performance Patterns
```python
# Use projections to limit returned fields
@app.get("/posts/summaries")
async def get_post_summaries(engine: AIOEngine = Depends(get_engine)):
    # Only return specific fields
    posts = await engine.find(
        Post,
        projection=PostSummary  # Only return specified fields in PostSummary model
    )
    return posts

# Use indexes effectively
@app.get("/posts/by-category/{category}")
async def get_posts_by_category(
    category: str,
    engine: AIOEngine = Depends(get_engine)
):
    # Ensure there's an index on the category field
    posts = await engine.find(
        Post,
        Post.category == category,
        sort=(Post.created_at, -1)  # Sort by creation date, descending
    )
    return posts
```

## Testing Database Integration

### SQL Testing
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Create test database engine
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Create tables
Base.metadata.create_all(bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_create_user(client):
    response = client.post("/users/", json={"email": "test@example.com", "name": "Test User"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
```

### MongoDB Testing
```python
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

@pytest.fixture
def mock_engine():
    engine = AsyncMock()
    engine.find_one = AsyncMock()
    engine.save = AsyncMock()
    engine.delete = AsyncMock()
    return engine

def test_create_post(mock_engine):
    with patch('main.get_engine', return_value=mock_engine):
        # Test your endpoint
        pass
```