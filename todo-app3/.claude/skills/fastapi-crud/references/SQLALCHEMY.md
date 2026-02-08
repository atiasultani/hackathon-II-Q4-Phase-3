# SQLAlchemy Best Practices

## Model Definition

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    posts = relationship("Post", back_populates="author")
```

## Database Configuration

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
```

## Query Patterns

### Basic Queries
```python
# Get by ID
user = db.query(User).filter(User.id == user_id).first()

# Get all with pagination
users = db.query(User).offset(skip).limit(limit).all()

# Filter by field
active_users = db.query(User).filter(User.is_active == True).all()

# Count
user_count = db.query(User).count()
```

### Relationships
```python
# Eager loading
user_with_posts = db.query(User).options(joinedload(User.posts)).filter(User.id == user_id).first()

# Join query
users_with_post_count = db.query(
    User,
    func.count(Post.id).label('post_count')
).outerjoin(Post).group_by(User.id).all()
```

## Migrations

### Using Alembic
```bash
# Initialize
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add new field"

# Apply migration
alembic upgrade head
```

## Indexing and Performance

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)  # Primary key index
    email = Column(String, unique=True, index=True)     # Unique index
    name = Column(String, index=True)                   # Regular index
```

## Transactions

```python
try:
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
except Exception:
    db.rollback()
    raise
```