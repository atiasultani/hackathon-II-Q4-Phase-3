# Database Migration Strategies

## Alembic Migration Patterns

### Basic Migration Structure
```python
"""Add user profile fields

Revision ID: abc123def456
Revises: 7d5c8b1a2c3d
Create Date: 2023-10-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql, sqlite

# revision identifiers
revision = 'abc123def456'
down_revision = '7d5c8b1a2c3d'
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=True, default=False))

    # Create indexes
    op.create_index('ix_users_bio', 'users', ['bio'])
    op.create_index('ix_users_is_verified', 'users', ['is_verified'])

    # Update existing records
    op.execute("UPDATE users SET is_verified = false WHERE is_verified IS NULL")

def downgrade():
    # Remove indexes first
    op.drop_index('ix_users_is_verified')
    op.drop_index('ix_users_bio')

    # Remove columns (in reverse order)
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'bio')
```

### Conditional Migrations for Different Databases
```python
"""Database-specific migration

Revision ID: def456ghi789
Revises: abc123def456
Create Date: 2023-10-16 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql, sqlite

# revision identifiers
revision = 'def456ghi789'
down_revision = 'abc123def456'
branch_labels = None
depends_on = None

def upgrade():
    # Check current database dialect
    conn = op.get_bind()
    dialect = conn.dialect.name

    if dialect == 'postgresql':
        # PostgreSQL-specific migration
        op.add_column('products', sa.Column('metadata', postgresql.JSONB(), nullable=True))
        op.create_index('ix_products_metadata_gin', 'products', ['metadata'], postgresql_using='gin')
    elif dialect == 'sqlite':
        # SQLite-specific migration
        op.add_column('products', sa.Column('metadata', sa.Text(), nullable=True))  # JSON as text
    else:
        # Default migration for other databases
        op.add_column('products', sa.Column('metadata', sa.Text(), nullable=True))

def downgrade():
    conn = op.get_bind()
    dialect = conn.dialect.name

    if dialect == 'postgresql':
        op.drop_index('ix_products_metadata_gin')

    op.drop_column('products', 'metadata')
```

## Migration Best Practices

### Safe Migration Patterns
```python
"""Safe migration with data preservation

Revision ID: safe_migration_123
Revises: previous_revision
Create Date: 2023-10-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'safe_migration_123'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    # Step 1: Add new column with nullable=True
    op.add_column('users', sa.Column('new_field', sa.String(100), nullable=True))

    # Step 2: Populate new column with default values
    op.execute("UPDATE users SET new_field = 'default_value' WHERE new_field IS NULL")

    # Step 3: Make column non-nullable (if needed)
    op.alter_column('users', 'new_field', nullable=False)

def downgrade():
    op.drop_column('users', 'new_field')
```

### Complex Migration with Data Transformation
```python
"""Migrate user data structure

Revision ID: complex_migration_456
Revises: safe_migration_123
Create Date: 2023-10-18 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

# revision identifiers
revision = 'complex_migration_456'
down_revision = 'safe_migration_123'
branch_labels = None
depends_on = None

def upgrade():
    # Create new table for user profiles
    op.create_table('user_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('location', sa.String(100), nullable=True),
        sa.Column('website', sa.String(200), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Copy data from users table to user_profiles
    connection = op.get_bind()

    # Define table structures for data copy
    users_table = table('users',
        column('id', sa.Integer),
        column('bio', sa.Text),
        column('location', sa.String),
        column('website', sa.String)
    )

    user_profiles_table = table('user_profiles',
        column('user_id', sa.Integer),
        column('bio', sa.Text),
        column('location', sa.String),
        column('website', sa.String)
    )

    # Copy data
    connection.execute(
        user_profiles_table.insert().from_select(
            ['user_id', 'bio', 'location', 'website'],
            sa.select([
                users_table.c.id,
                users_table.c.bio,
                users_table.c.location,
                users_table.c.website
            ]).where(users_table.c.bio != None)
        )
    )

    # Remove old columns from users table
    op.drop_column('users', 'bio')
    op.drop_column('users', 'location')
    op.drop_column('users', 'website')

def downgrade():
    # Add columns back to users table
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('location', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('website', sa.String(200), nullable=True))

    # Copy data back
    connection = op.get_bind()

    users_table = table('users',
        column('id', sa.Integer),
        column('bio', sa.Text),
        column('location', sa.String),
        column('website', sa.String)
    )

    user_profiles_table = table('user_profiles',
        column('user_id', sa.Integer),
        column('bio', sa.Text),
        column('location', sa.String),
        column('website', sa.String)
    )

    connection.execute(
        users_table.update().where(
            users_table.c.id == user_profiles_table.c.user_id
        ).values(
            bio=user_profiles_table.c.bio,
            location=user_profiles_table.c.location,
            website=user_profiles_table.c.website
        )
    )

    # Drop user_profiles table
    op.drop_table('user_profiles')
```

## Migration Strategies for Different Database Types

### PostgreSQL Migration Patterns
```python
"""PostgreSQL-specific migration with advanced features

Revision ID: postgresql_migration
Revises: previous_revision
Create Date: 2023-10-19 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers
revision = 'postgresql_migration'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    # Add UUID column
    op.add_column('users', sa.Column('external_id', postgresql.UUID(as_uuid=True),
                                   default=uuid.uuid4, unique=True))

    # Add JSONB column
    op.add_column('users', sa.Column('preferences', postgresql.JSONB(), default={}))

    # Add array column
    op.add_column('users', sa.Column('tags', postgresql.ARRAY(sa.String()), default=[]))

    # Create indexes
    op.create_index('ix_users_external_id', 'users', ['external_id'])
    op.create_index('ix_users_tags', 'users', ['tags'], postgresql_using='gin')

    # Add enum type
    status_enum = postgresql.ENUM('active', 'inactive', 'suspended', name='user_status')
    status_enum.create(op.get_bind())
    op.add_column('users', sa.Column('status', status_enum, nullable=True, default='active'))

def downgrade():
    # Drop enum type
    op.drop_column('users', 'status')
    status_enum = postgresql.ENUM('active', 'inactive', 'suspended', name='user_status')
    status_enum.drop(op.get_bind())

    op.drop_index('ix_users_tags')
    op.drop_index('ix_users_external_id')
    op.drop_column('users', 'tags')
    op.drop_column('users', 'preferences')
    op.drop_column('users', 'external_id')
```

### SQLite Migration Patterns (Handling Limitations)
```python
"""SQLite migration handling ALTER TABLE limitations

Revision ID: sqlite_migration
Revises: previous_revision
Create Date: 2023-10-20 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = 'sqlite_migration'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    # Create new table with additional columns
    op.create_table('users_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),  # New column
        sa.Column('avatar_url', sa.String(500), nullable=True),  # New column
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Copy data from old table
    connection = op.get_bind()
    connection.execute(sa.text("""
        INSERT INTO users_new (id, email, name, is_active, created_at, updated_at)
        SELECT id, email, name, is_active, created_at, updated_at FROM users
    """))

    # Drop old table and rename new one
    op.drop_table('users')
    op.rename_table('users_new', 'users')

def downgrade():
    # Reverse the process
    op.create_table('users_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    connection = op.get_bind()
    connection.execute(sa.text("""
        INSERT INTO users_old (id, email, name, is_active, created_at, updated_at)
        SELECT id, email, name, is_active, created_at, updated_at FROM users
        WHERE bio IS NULL AND avatar_url IS NULL
    """))

    op.drop_table('users')
    op.rename_table('users_old', 'users')
```

## Migration Testing and Validation

### Testing Migration Scripts
```python
import pytest
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def test_migration_up_down():
    """Test that migration can go up and down successfully"""
    # Create test database
    engine = create_engine("sqlite:///:memory:")
    connection = engine.connect()

    # Apply migrations up to a specific revision
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("script_location", "migrations")
    alembic_cfg.attributes["connection"] = connection

    # Upgrade to the target revision
    command.upgrade(alembic_cfg, "target_revision")

    # Verify the migration worked
    result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='new_table'"))
    assert result.fetchone() is not None

    # Downgrade
    command.downgrade(alembic_cfg, "base")

    # Verify downgrade worked
    result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='new_table'"))
    assert result.fetchone() is None

    connection.close()
```

### Data Validation in Migrations
```python
"""Migration with data validation

Revision ID: validated_migration
Revises: previous_revision
Create Date: 2023-10-21 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers
revision = 'validated_migration'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    # Add new column
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))

    # Validate data before making column non-nullable
    connection = op.get_bind()

    # Update existing records with valid phone numbers (if needed)
    # This is a simplified example - in practice, you'd have more complex validation
    connection.execute(text("""
        UPDATE users
        SET phone = '+1-555-0123'
        WHERE phone IS NULL AND id IN (
            SELECT id FROM users WHERE phone IS NULL LIMIT 10
        )
    """))

    # Make column non-nullable after validation
    op.alter_column('users', 'phone', nullable=False)

def downgrade():
    op.drop_column('users', 'phone')
```

## Production Migration Strategies

### Zero-Downtime Migration Pattern
```python
"""Zero-downtime migration pattern

This pattern allows for schema changes without application downtime
by using a multi-step approach over multiple deployment cycles.
"""

# Step 1: Deploy new code that works with both old and new schema
# Add new column as nullable
def step1_add_column():
    """Migration step 1: Add new column (deploy this first)"""
    op.add_column('users', sa.Column('new_field', sa.String(100), nullable=True))

# Step 2: Deploy application code that starts writing to new column
# Update application to write to both old and new fields
# Let data accumulate in new field

# Step 3: Backfill data from old to new field
def step3_backfill_data():
    """Migration step 3: Backfill data (deploy this third)"""
    connection = op.get_bind()
    connection.execute(text("""
        UPDATE users
        SET new_field = old_field
        WHERE new_field IS NULL AND old_field IS NOT NULL
    """))

# Step 4: Deploy application code that reads from new field
# Update application to read from new field instead of old

# Step 5: Remove old column
def step5_remove_old():
    """Migration step 5: Remove old column (deploy this last)"""
    op.drop_column('users', 'old_field')
```

### Migration Rollback Plan
```python
"""Migration with comprehensive rollback plan

Always include a clear rollback strategy in your migration documentation.
"""

def upgrade():
    """
    Migration: Add user preferences

    Changes:
    - Add preferences JSONB column to users table
    - Create index on preferences for performance

    Rollback plan:
    1. Drop the index
    2. Drop the preferences column
    3. Verify data integrity
    """

    # Add preferences column
    op.add_column('users', sa.Column('preferences', postgresql.JSONB(), default={}))

    # Create index
    op.create_index('ix_users_preferences', 'users', ['preferences'], postgresql_using='gin')

def downgrade():
    """
    Rollback: Remove user preferences

    This will remove the preferences column and its index.
    Data in the preferences column will be permanently lost.
    """

    # Drop index first
    op.drop_index('ix_users_preferences')

    # Drop column
    op.drop_column('users', 'preferences')
```

## Migration Automation Scripts

### Migration Generation Helper
```python
#!/usr/bin/env python3
"""
Migration generation helper script
Automates the creation of migration files with common patterns
"""

import argparse
from datetime import datetime
import os

def generate_migration_file(revision_id, message, prev_revision="base"):
    """Generate a migration file with common structure"""

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    migration_content = f'''"""{message}

Revision ID: {revision_id}
Revises: {prev_revision}
Create Date: {timestamp}

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql, sqlite

# revision identifiers
revision = '{revision_id}'
down_revision = '{prev_revision}'
branch_labels = None
depends_on = None

def upgrade():
    """
    Migration: {message}
    """
    # Add your migration code here
    pass

def downgrade():
    """
    Rollback: {message}
    """
    # Add your rollback code here
    pass
'''

    # Create migrations directory if it doesn't exist
    os.makedirs("migrations/versions", exist_ok=True)

    # Write migration file
    filename = f"migrations/versions/{revision_id}_{message.lower().replace(' ', '_')}.py"
    with open(filename, 'w') as f:
        f.write(migration_content)

    print(f"Created migration file: {filename}")
    return filename

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate migration file")
    parser.add_argument("--revision", required=True, help="Revision ID")
    parser.add_argument("--message", required=True, help="Migration message")
    parser.add_argument("--prev", default="base", help="Previous revision ID")

    args = parser.parse_args()

    generate_migration_file(args.revision, args.message, args.prev)
```