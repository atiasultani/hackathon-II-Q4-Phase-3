# SQLite Schema Design

## SQLite-Specific SQLAlchemy Patterns

### Basic Model Definition
```python
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"
```

### SQLite-Specific Data Types
```python
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, LargeBinary
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.sql import func

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    metadata = Column(JSON)  # SQLite JSON support
    is_public = Column(Boolean, default=False)
    file_data = Column(LargeBinary)  # For storing binary data
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())
```

## SQLite Performance Optimization

### Indexing Strategies
```python
from sqlalchemy import Index

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, index=True)

    # Composite indexes for complex queries
    __table_args__ = (
        Index('idx_user_status_created', 'is_active', 'created_at'),
        Index('idx_user_email_username', 'email', 'username'),  # Covering index
    )
```

### Full-Text Search (FTS5)
```python
from sqlalchemy import Column, Integer, String, text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Create FTS5 virtual table for full-text search
def create_fts_table(engine):
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
                title,
                content,
                content='articles',
                content_rowid='id'
            )
        """))
        conn.commit()

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    created_at = Column(DateTime, default=func.current_timestamp())

    def __repr__(self):
        return f"<Article(id={self.id}, title='{self.title}')>"
```

## SQLite Connection Management

### Optimized Connection Configuration
```python
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
import sqlite3

def create_sqlite_engine(db_path: str = "app.db"):
    # SQLite-specific engine configuration for better performance
    engine = create_engine(
        f"sqlite:///{db_path}",
        poolclass=StaticPool,  # SQLite works best with static pool
        connect_args={
            "check_same_thread": False,  # Allow multi-threaded access
            "timeout": 30,  # 30 second timeout for database locks
        },
        echo=False  # Set to True for debugging
    )

    # Apply SQLite pragmas for performance
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")  # Enable foreign key constraints
        cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging for concurrency
        cursor.execute("PRAGMA synchronous=NORMAL")  # Balance between safety and speed
        cursor.execute("PRAGMA cache_size=10000")  # Increase cache size
        cursor.execute("PRAGMA temp_store=memory")  # Store temp tables in memory
        cursor.close()

    return engine
```

## SQLite Migration Patterns

### Alembic Migration with SQLite Considerations
```python
"""Add user preferences to SQLite database

Revision ID: abc123def456
Revises: 7d5c8b1a2c3d
Create Date: 2023-10-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = 'abc123def456'
down_revision = '7d5c8b1a2c3d'
branch_labels = None
depends_on = None

def upgrade():
    # Create new table with desired structure
    op.create_table('user_preferences_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(length=50), nullable=True),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Copy data from old table if it exists
    # SQLite doesn't support ALTER TABLE with multiple operations,
    # so we use the table restructure approach
    connection = op.get_bind()
    connection.execute(sa.text("""
        INSERT INTO user_preferences_new (user_id, theme, notifications_enabled, language)
        SELECT user_id, theme, notifications_enabled, language FROM user_preferences
    """))

    # Drop old table and rename new one
    op.drop_table('user_preferences')
    op.rename_table('user_preferences_new', 'user_preferences')

def downgrade():
    # Reverse the process
    op.create_table('user_preferences_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('theme', sa.String(length=50), nullable=True),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    connection = op.get_bind()
    connection.execute(sa.text("""
        INSERT INTO user_preferences_old (user_id, theme, notifications_enabled, language)
        SELECT user_id, theme, notifications_enabled, language FROM user_preferences
    """))

    op.drop_table('user_preferences')
    op.rename_table('user_preferences_old', 'user_preferences')
```

## SQLite-Specific Limitations and Workarounds

### Handling ALTER TABLE Limitations
```python
# SQLite has limited ALTER TABLE support
# Use this pattern to add multiple columns

def upgrade():
    # Instead of multiple ALTER TABLE commands, recreate the table
    # Step 1: Create new table with additional columns
    op.create_table('users_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),  # New column
        sa.Column('avatar_url', sa.String(), nullable=True),  # New column
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Step 2: Copy data
    connection = op.get_bind()
    connection.execute(sa.text("""
        INSERT INTO users_new (id, email, name, is_active, created_at, updated_at)
        SELECT id, email, name, is_active, created_at, updated_at FROM users
    """))

    # Step 3: Drop old table and rename new one
    op.drop_table('users')
    op.rename_table('users_new', 'users')
```

### JSON Support in SQLite
```python
from sqlalchemy.dialects.sqlite import JSON
import json

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    # SQLite 3.38.0+ supports JSON functions
    preferences = Column(JSON, default=dict)
    settings = Column(JSON)

    def set_preference(self, key: str, value):
        if self.preferences is None:
            self.preferences = {}
        self.preferences[key] = value

    def get_preference(self, key: str, default=None):
        if self.preferences is None:
            return default
        return self.preferences.get(key, default)
```

## FastAPI Integration with SQLite

### Dependency for Database Sessions
```python
from fastapi import Depends
from sqlalchemy.orm import Session
from database.session import get_db

def get_current_user(
    token: str = Security(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Use SQLite-specific query optimization
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user
```

### SQLite Session Management
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Create engine once and reuse
SQLITE_DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    SQLITE_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## SQLite Testing Considerations

### In-Memory Database for Testing
```python
# For testing, use in-memory SQLite database
def create_test_engine():
    return create_engine("sqlite:///:memory:", echo=False)

# Test fixture example
@pytest.fixture
def test_db():
    engine = create_test_engine()
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        yield session

    # Cleanup happens automatically with in-memory database
```

## Common SQLite Data Types Mapping

| SQLAlchemy Type | SQLite Type | Notes |
|----------------|-------------|-------|
| `Integer` | `INTEGER` | 64-bit signed integer |
| `String` | `TEXT` | Variable length string |
| `Text` | `TEXT` | Long text field |
| `Boolean` | `INTEGER` | 0 or 1 |
| `DateTime` | `TEXT` | ISO format string |
| `Date` | `TEXT` | ISO format string |
| `Time` | `TEXT` | ISO format string |
| `Float` | `REAL` | 64-bit floating point |
| `Numeric` | `REAL` | Or TEXT for exact precision |
| `LargeBinary` | `BLOB` | Binary data |
| `JSON` | `TEXT` | JSON as text (SQLite 3.38.0+) |

## SQLite Performance Tips

### Query Optimization
```python
# Use LIMIT for pagination
users = db.query(User).offset(skip).limit(limit).all()

# Use EXISTS instead of IN for subqueries when possible
active_users = db.query(User).filter(
    User.id.in_(
        db.query(Order.user_id).filter(Order.status == 'active')
    )
).all()

# For better performance with large datasets, use EXISTS
active_users = db.query(User).filter(
    exists().where(and_(Order.user_id == User.id, Order.status == 'active'))
).all()
```

### Indexing Best Practices
```python
# Create indexes on frequently queried columns
Index('ix_users_email', 'email', unique=True)
Index('ix_users_created_at', 'created_at')
Index('ix_users_status_created', 'is_active', 'created_at')

# For text searches, consider FTS5 virtual tables
# For range queries, consider composite indexes
# For exact matches, single column indexes are sufficient
```