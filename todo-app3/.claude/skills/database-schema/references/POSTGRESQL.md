# PostgreSQL Schema Design

## Advanced PostgreSQL Features

### JSON/JSONB Support
```python
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy import Column, Integer, String
import uuid

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    # JSONB column for flexible attributes
    attributes = Column(JSONB, default={})
    # UUID for better distributed systems
    external_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True)
```

### Array Types
```python
from sqlalchemy.dialects.postgresql import ARRAY

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tags = Column(ARRAY(String), default=[])
    favorite_numbers = Column(ARRAY(Integer), default=[])
```

### Full-Text Search
```sql
-- Create indexes for full-text search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Query with full-text search
SELECT * FROM products WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', 'search term');
```

## PostgreSQL-Specific SQLAlchemy Patterns

```python
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
from sqlalchemy.sql import func
import uuid

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    tags = Column(ARRAY(String), default=[])
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Article(id={self.id}, title='{self.title}')>"
```

## Performance Optimization

### Indexing Strategies
```python
from sqlalchemy import Index

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    status = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), index=True)

    # Composite indexes
    __table_args__ = (
        Index('idx_user_status_created', 'status', 'created_at'),
        Index('idx_user_email_partial', 'email', postgresql_where=Column('is_active') == True),
    )
```

### Partitioning (PostgreSQL 10+)
```sql
-- Range partitioning example
CREATE TABLE measurements (
    logdate date NOT NULL,
    peaktemp int,
    unitsales int
) PARTITION BY RANGE (logdate);

CREATE TABLE measurements_y2023 PARTITION OF measurements
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
```

## Connection Pooling for PostgreSQL

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool
import urllib.parse

def create_postgres_engine():
    DATABASE_URL = "postgresql://user:password@localhost:5432/mydatabase"

    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,          # Number of connections to maintain
        max_overflow=30,       # Additional connections beyond pool_size
        pool_pre_ping=True,    # Verify connections before use
        pool_recycle=3600      # Recycle connections after 1 hour
    )
    return engine
```

## PostgreSQL Migration Patterns

### Alembic with PostgreSQL-specific features
```python
"""Add JSONB and UUID fields

Revision ID: abc123def456
Revises: 7d5c8b1a2c3d
Create Date: 2023-10-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid

# revision identifiers
revision = 'abc123def456'
down_revision = '7d5c8b1a2c3d'
branch_labels = None
depends_on = None

def upgrade():
    # Add UUID column
    op.add_column('users', sa.Column('external_id', UUID(as_uuid=True),
                                   default=uuid.uuid4, unique=True))

    # Add JSONB column
    op.add_column('users', sa.Column('preferences', JSONB(), default={}))

    # Add array column
    op.add_column('users', sa.Column('tags', sa.ARRAY(sa.String()), default=[]))

    # Create indexes
    op.create_index('ix_users_external_id', 'users', ['external_id'])
    op.create_index('ix_users_tags', 'users', ['tags'], postgresql_using='gin')

def downgrade():
    op.drop_index('ix_users_tags')
    op.drop_index('ix_users_external_id')
    op.drop_column('users', 'tags')
    op.drop_column('users', 'preferences')
    op.drop_column('users', 'external_id')
```

## Common PostgreSQL Data Types

| SQLAlchemy Type | PostgreSQL Type | Use Case |
|----------------|----------------|----------|
| `String` | `VARCHAR` | Text with length limit |
| `Text` | `TEXT` | Long text without length limit |
| `Integer` | `INTEGER` | 32-bit integers |
| `BigInteger` | `BIGINT` | 64-bit integers |
| `Float` | `DOUBLE PRECISION` | Floating point numbers |
| `Numeric` | `NUMERIC(p, s)` | Precise decimal numbers |
| `Boolean` | `BOOLEAN` | True/False values |
| `DateTime` | `TIMESTAMP` | Date and time |
| `Date` | `DATE` | Date only |
| `Time` | `TIME` | Time only |
| `UUID` | `UUID` | Universally unique identifiers |
| `JSONB` | `JSONB` | Binary JSON data |
| `ARRAY` | `ARRAY` | Arrays of any type |

## PostgreSQL-Specific Indexes

```python
# Partial indexes
Index('idx_active_users', 'status',
      postgresql_where=Column('status') == 'active')

# Expression indexes
Index('idx_lower_email', 'email',
      postgresql_ops={'email': 'text_pattern_ops'})

# Concurrent index creation (for production)
# This would be in a migration:
# op.execute("CREATE INDEX CONCURRENTLY idx_users_email ON users (email);")
```