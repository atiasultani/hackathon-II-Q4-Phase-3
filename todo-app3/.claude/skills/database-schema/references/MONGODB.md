# MongoDB Schema Design

## ODMantic Models

### Basic Document Model
```python
from odmantic import Model, Field, Index
from datetime import datetime
from typing import List, Optional
import uuid

class User(Model):
    # Automatic _id field provided by ODMantic
    email: str = Field(unique=True, regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        collection = "users"
        indexes = [
            Index("email", unique=True),
            Index("created_at"),
            Index("is_active")
        ]
```

### Embedded Documents
```python
from odmantic import Model, Field, EmbeddedModel
from typing import List, Optional

class Address(EmbeddedModel):
    street: str
    city: str
    country: str
    zip_code: str

class User(Model):
    email: str
    name: str
    addresses: List[Address] = []
    profile: Optional[dict] = {}

    class Config:
        collection = "users"
```

### References Between Documents
```python
from odmantic import Model, Field, Reference
from typing import List

class Author(Model):
    name: str
    email: str

    class Config:
        collection = "authors"

class Book(Model):
    title: str
    author: Author = Field(reference=True)  # Creates a reference to Author
    published_date: datetime
    isbn: str

    class Config:
        collection = "books"
```

## PyMongo Patterns

### Basic Operations
```python
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["myapp"]

# Insert document
user_doc = {
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": datetime.utcnow(),
    "is_active": True
}
result = db.users.insert_one(user_doc)
user_id = result.inserted_id

# Find document
user = db.users.find_one({"email": "user@example.com"})

# Update document
db.users.update_one(
    {"_id": ObjectId(user_id)},
    {"$set": {"name": "Jane Doe", "updated_at": datetime.utcnow()}}
)

# Delete document
db.users.delete_one({"_id": ObjectId(user_id)})
```

### Complex Queries
```python
# Aggregation pipeline
pipeline = [
    {"$match": {"status": "active"}},
    {"$lookup": {
        "from": "orders",
        "localField": "_id",
        "foreignField": "user_id",
        "as": "orders"
    }},
    {"$addFields": {
        "order_count": {"$size": "$orders"},
        "total_spent": {"$sum": "$orders.amount"}
    }},
    {"$sort": {"total_spent": -1}},
    {"$limit": 10}
]

top_users = list(db.users.aggregate(pipeline))
```

## Schema Design Patterns

### Document Structure Optimization
```python
# Good: Denormalized for read efficiency
class User(Model):
    email: str
    name: str
    # Embed frequently accessed related data
    profile: dict = {}
    recent_orders: List[dict] = []
    settings: dict = {}

    class Config:
        collection = "users"

# Good: Normalized for write efficiency
class User(Model):
    email: str
    name: str
    # Keep large or frequently updated data separate
    profile_id: str = Field(reference=True)
    preferences_id: str = Field(reference=True)

    class Config:
        collection = "users"
```

### Indexing Strategies
```python
class Product(Model):
    name: str
    category: str
    tags: List[str]
    price: float
    created_at: datetime
    metadata: dict = {}

    class Config:
        collection = "products"
        indexes = [
            # Single field indexes
            Index("name"),
            Index("category"),
            Index("price"),
            Index("created_at"),

            # Compound indexes
            Index([("category", 1), ("price", 1)]),
            Index([("name", "text"), ("description", "text")]),  # Text index

            # Array indexes
            Index("tags"),

            # Partial indexes (with filter)
            Index("price", partial_filter_expression={"active": True})
        ]
```

## MongoDB Migration Patterns

### Schema Evolution
```python
# Migration script example
def migrate_user_schema():
    """Migrate user schema from v1 to v2"""
    users = db.users.find({"schema_version": {"$ne": 2}})

    for user in users:
        # Update user document structure
        updated_user = {
            **user,
            "schema_version": 2,
            "created_at": user.get("created_at", datetime.utcnow()),
            "updated_at": datetime.utcnow(),
            "preferences": user.get("preferences", {})
        }

        # Remove old fields
        if "old_field" in updated_user:
            del updated_user["old_field"]

        db.users.replace_one({"_id": user["_id"]}, updated_user)
```

### Collection Migration
```python
def migrate_collection_structure():
    """Migrate from flat to nested structure"""
    # Create new collection with new structure
    db.create_collection("users_v2")

    # Transform and copy data
    for user in db.users.find():
        new_user = {
            "_id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "profile": {
                "bio": user.get("bio", ""),
                "avatar_url": user.get("avatar_url", ""),
                "location": user.get("location", "")
            },
            "settings": {
                "notifications": user.get("notifications", True),
                "theme": user.get("theme", "light")
            },
            "created_at": user.get("created_at", datetime.utcnow()),
            "updated_at": datetime.utcnow()
        }
        db.users_v2.insert_one(new_user)

    # Drop old collection and rename new one
    db.users.drop()
    db.users_v2.rename("users")
```

## FastAPI Integration with MongoDB

### Connection Management
```python
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
    yield
    # Shutdown
    client.close()

app = FastAPI(lifespan=lifespan)

async def get_engine():
    return engine
```

### Repository Pattern
```python
from typing import List, Optional
from odmantic import AIOEngine, QueryExpression

class UserRepository:
    def __init__(self, engine: AIOEngine):
        self.engine = engine

    async def create_user(self, user: User) -> User:
        return await self.engine.save(user)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return await self.engine.find_one(User, User.email == email)

    async def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return await self.engine.find(User, skip=skip, limit=limit)

    async def update_user(self, user_id: str, update_data: dict) -> User:
        user = await self.engine.find_one(User, User.id == user_id)
        if not user:
            raise ValueError("User not found")

        for field, value in update_data.items():
            setattr(user, field, value)

        return await self.engine.save(user)

    async def delete_user(self, user_id: str) -> bool:
        result = await self.engine.delete(User, User.id == user_id)
        return result.deleted_count > 0
```

## Performance Optimization

### Query Optimization
```python
# Use projections to limit returned fields
async def get_user_summary(self, user_id: str):
    return await self.engine.find_one(
        User,
        User.id == user_id,
        projection=UserSummary  # Only return specified fields
    )

# Use indexes effectively
async def find_users_by_category(self, category: str):
    # Ensure there's an index on the category field
    return await self.engine.find(
        User,
        User.category == category,
        sort=(User.created_at, -1)  # Sort by creation date, descending
    )
```

### Connection Pooling
```python
# MongoDB connection configuration
MONGODB_URL = "mongodb://localhost:27017/"
MONGODB_DATABASE = "myapp"

# Connection options for better performance
client = AsyncIOMotorClient(
    MONGODB_URL,
    maxPoolSize=50,          # Maximum connection pool size
    minPoolSize=10,          # Minimum connection pool size
    maxIdleTimeMS=30000,     # Close connections after 30 seconds of inactivity
    serverSelectionTimeoutMS=5000,  # Wait 5 seconds for server selection
    connectTimeoutMS=20000,  # Wait 20 seconds for connection
    socketTimeoutMS=20000    # Wait 20 seconds for socket operations
)
```

## MongoDB-Specific Considerations

### Schema Flexibility
```python
# Schema validation at database level
collection = db.create_collection("products")
collection.command(
    "collMod", "products",
    validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "price"],
            "properties": {
                "name": {"bsonType": "string"},
                "price": {"bsonType": "number", "minimum": 0},
                "category": {"bsonType": "string"},
                "tags": {"bsonType": "array", "items": {"bsonType": "string"}}
            }
        }
    }
)
```

### Aggregation Pipeline Optimization
```python
# Optimized aggregation pipeline
pipeline = [
    # Stage 1: Filter first to reduce document count early
    {"$match": {"status": "active", "created_at": {"$gte": start_date}}},

    # Stage 2: Project only needed fields
    {"$project": {"name": 1, "category": 1, "price": 1, "created_at": 1}},

    # Stage 3: Group operations
    {"$group": {
        "_id": "$category",
        "avg_price": {"$avg": "$price"},
        "count": {"$sum": 1}
    }},

    # Stage 4: Sort and limit
    {"$sort": {"count": -1}},
    {"$limit": 10}
]
```