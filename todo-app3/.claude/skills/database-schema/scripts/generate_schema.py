#!/usr/bin/env python3
"""
Database Schema Generator

This script generates database schemas with proper relations, migrations,
and ORM/ODM models for PostgreSQL, MongoDB, and SQLite that integrate
seamlessly with FastAPI applications.
"""

import os
import argparse
from pathlib import Path
import json
from datetime import datetime


def create_project_structure(base_path):
    """Create the standard project directory structure."""
    dirs = [
        "models",
        "schemas",
        "database",
        "migrations",
        "api",
        "core"
    ]

    for directory in dirs:
        path = Path(base_path) / directory
        path.mkdir(exist_ok=True)
        # Create __init__.py in each directory
        (path / "__init__.py").touch(exist_ok=True)

    print(f"Created project structure in {base_path}")


def generate_sqlalchemy_models(entities, db_type, base_path):
    """Generate SQLAlchemy models for SQL databases."""
    base_content = '''from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()
'''

    base_file = Path(base_path) / "database" / "base.py"
    with open(base_file, 'w') as f:
        f.write(base_content)

    for entity_name, entity_config in entities.items():
        model_content = f'''from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base
'''

        # Add database-specific imports
        if db_type == "postgresql":
            model_content += '''from sqlalchemy.dialects.postgresql import JSONB, UUID, ARRAY
import uuid
'''
        elif db_type == "sqlite":
            model_content += '''from sqlalchemy.dialects.sqlite import JSON
'''

        model_content += f'''

class {entity_name}(Base):
    __tablename__ = "{entity_name.lower()}s"

    id = Column(Integer, primary_key=True, index=True)
'''

        # Add fields
        for field_name, field_config in entity_config.get("fields", {}).items():
            field_type = field_config["type"]
            nullable = field_config.get("nullable", True)
            unique = field_config.get("unique", False)
            index = field_config.get("index", False)

            nullable_str = "" if nullable else ", nullable=False"
            unique_str = ", unique=True" if unique else ""
            index_str = ", index=True" if index else ""

            if field_type.lower() == "string":
                model_content += f'    {field_name} = Column(String, {nullable_str}{unique_str}{index_str})\n'
            elif field_type.lower() == "text":
                model_content += f'    {field_name} = Column(Text, {nullable_str}{unique_str}{index_str})\n'
            elif field_type.lower() == "integer":
                model_content += f'    {field_name} = Column(Integer, {nullable_str}{unique_str}{index_str})\n'
            elif field_type.lower() == "boolean":
                default_val = field_config.get("default", False)
                model_content += f'    {field_name} = Column(Boolean, default={default_val}{unique_str}{index_str})\n'
            elif field_type.lower() == "datetime":
                model_content += f'    {field_name} = Column(DateTime(timezone=True), server_default=func.now()){unique_str}{index_str}\n'
            elif field_type.lower() == "json" and db_type == "postgresql":
                model_content += f'    {field_name} = Column(JSONB, default={{}}, {nullable_str}{unique_str}{index_str})\n'
            elif field_type.lower() == "uuid" and db_type == "postgresql":
                model_content += f'    {field_name} = Column(UUID(as_uuid=True), default=uuid.uuid4{unique_str}{index_str})\n'

        # Add relationships if specified
        for rel_name, rel_config in entity_config.get("relationships", {}).items():
            rel_type = rel_config["type"]
            target = rel_config["target"]

            if rel_type.lower() == "many-to-one":
                # Add foreign key
                model_content += f'    {rel_config.get("foreign_key", target.lower() + "_id")} = Column(Integer, ForeignKey("{target.lower()}s.id"))\n'
                # Add relationship
                model_content += f'    {rel_name} = relationship("{target}", back_populates="{entity_name.lower()}s")\n'
            elif rel_type.lower() == "one-to-many":
                # Add relationship (back reference in the target entity)
                model_content += f'    {rel_name} = relationship("{target}", back_populates="{rel_config.get("back_populates", entity_name.lower())}")\n'

        model_content += f'''

    def __repr__(self):
        return f"<{entity_name}(id={{self.id}}, name={{getattr(self, list({{k: v for k, v in entity_config["fields"].items() if v["type"] == "string"}}, None)[0] if {list(entity_config["fields"].keys())} else "id"}, None)}})>"
'''

        model_file = Path(base_path) / "models" / f"{entity_name.lower()}.py"
        with open(model_file, 'w') as f:
            f.write(model_content)

        print(f"Created SQLAlchemy model: {model_file}")


def generate_odmantic_models(entities, base_path):
    """Generate ODMantic models for MongoDB."""
    base_content = '''from odmantic import Model, Field, EmbeddedModel
from datetime import datetime
from typing import List, Optional
'''

    base_file = Path(base_path) / "database" / "base.py"
    with open(base_file, 'w') as f:
        f.write(base_content)

    for entity_name, entity_config in entities.items():
        model_content = f'''from odmantic import Model, Field, EmbeddedModel
from datetime import datetime
from typing import List, Optional

'''

        model_content += f'''
class {entity_name}(Model):
'''

        # Add fields
        for field_name, field_config in entity_config.get("fields", {}).items():
            field_type = field_config["type"]
            optional = field_config.get("nullable", True)

            if field_type.lower() == "string":
                if optional:
                    model_content += f'    {field_name}: Optional[str] = None\n'
                else:
                    model_content += f'    {field_name}: str\n'
            elif field_type.lower() == "text":
                if optional:
                    model_content += f'    {field_name}: Optional[str] = None\n'
                else:
                    model_content += f'    {field_name}: str\n'
            elif field_type.lower() == "integer":
                if optional:
                    model_content += f'    {field_name}: Optional[int] = None\n'
                else:
                    model_content += f'    {field_name}: int\n'
            elif field_type.lower() == "boolean":
                default_val = field_config.get("default", False)
                model_content += f'    {field_name}: bool = {default_val}\n'
            elif field_type.lower() == "datetime":
                model_content += f'    {field_name}: datetime = Field(default_factory=datetime.utcnow)\n'

        # Add relationships if specified
        for rel_name, rel_config in entity_config.get("relationships", {}).items():
            rel_type = rel_config["type"]
            target = rel_config["target"]

            if rel_type.lower() == "reference":
                model_content += f'    {rel_name}_id: str = Field(reference=True)\n'

        model_content += f'''

    class Config:
        collection = "{entity_name.lower()}s"
'''

        model_file = Path(base_path) / "models" / f"{entity_name.lower()}.py"
        with open(model_file, 'w') as f:
            f.write(model_content)

        print(f"Created ODMantic model: {model_file}")


def generate_migration_script(entities, db_type, base_path):
    """Generate a basic migration script."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    revision_id = f"{timestamp}_initial_schema"

    migration_content = f'''"""Initial database schema

Revision ID: {revision_id}
Revises:
Create Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]}

"""
from alembic import op
import sqlalchemy as sa
'''

    if db_type == "postgresql":
        migration_content += '''from sqlalchemy.dialects import postgresql
'''
    elif db_type == "sqlite":
        migration_content += '''from sqlalchemy.dialects import sqlite
'''

    migration_content += f'''

# revision identifiers
revision = '{revision_id}'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Create all tables for the database schema."""
'''

    # Add table creation for each entity
    for entity_name, entity_config in entities.items():
        migration_content += f'''
    # Create {entity_name} table
    op.create_table('{entity_name.lower()}s',
        sa.Column('id', sa.Integer(), nullable=False),
'''

        for field_name, field_config in entity_config.get("fields", {}).items():
            field_type = field_config["type"]
            nullable = field_config.get("nullable", True)

            if field_type.lower() == "string":
                length = field_config.get("length", 255)
                migration_content += f"        sa.Column('{field_name}', sa.String({length}), nullable={str(not nullable).lower()}),\n"
            elif field_type.lower() == "text":
                migration_content += f"        sa.Column('{field_name}', sa.Text(), nullable={str(not nullable).lower()}),\n"
            elif field_type.lower() == "integer":
                migration_content += f"        sa.Column('{field_name}', sa.Integer(), nullable={str(not nullable).lower()}),\n"
            elif field_type.lower() == "boolean":
                default_val = field_config.get("default", False)
                migration_content += f"        sa.Column('{field_name}', sa.Boolean(), nullable={str(not nullable).lower()}, default={default_val}),\n"
            elif field_type.lower() == "datetime":
                migration_content += f"        sa.Column('{field_name}', sa.DateTime(), nullable={str(not nullable).lower()}),\n"
            elif field_type.lower() == "json" and db_type == "postgresql":
                migration_content += f"        sa.Column('{field_name}', postgresql.JSONB(), nullable={str(not nullable).lower()}),\n"

        # Add foreign keys if relationships exist
        for rel_name, rel_config in entity_config.get("relationships", {}).items():
            rel_type = rel_config["type"]
            if rel_type.lower() == "many-to-one":
                target = rel_config["target"]
                foreign_key = rel_config.get("foreign_key", target.lower() + "_id")
                migration_content += f"        sa.Column('{foreign_key}', sa.Integer(), sa.ForeignKey('{target.lower()}s.id')), \n"

        migration_content += f"        sa.PrimaryKeyConstraint('id')\n"

        # Add unique constraints
        for field_name, field_config in entity_config.get("fields", {}).items():
            if field_config.get("unique", False):
                migration_content += f"        # sa.UniqueConstraint('{field_name}')  # Uncomment if needed\n"

        migration_content += f"    )\n"

        # Add indexes
        for field_name, field_config in entity_config.get("fields", {}).items():
            if field_config.get("index", False):
                migration_content += f"    op.create_index('ix_{entity_name.lower()}s_{field_name}', '{entity_name.lower()}s', ['{field_name}'])\n"

    migration_content += f'''

def downgrade():
    """Drop all tables for rollback."""
'''

    # Reverse order for downgrade
    for entity_name in reversed(list(entities.keys())):
        migration_content += f"    op.drop_index('ix_{entity_name.lower()}s_') if op.get_bind().dialect.name != 'sqlite' else None\n"
        migration_content += f"    op.drop_table('{entity_name.lower()}s')\n"

    migration_file = Path(base_path) / "migrations" / f"versions" / f"{revision_id}_initial_schema.py"
    migration_file.parent.mkdir(exist_ok=True)

    with open(migration_file, 'w') as f:
        f.write(migration_content)

    print(f"Created migration script: {migration_file}")


def generate_fastapi_endpoints(entities, db_type, base_path):
    """Generate FastAPI endpoints for the entities."""
    for entity_name, entity_config in entities.items():
        endpoint_content = f'''from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

'''

        if db_type in ["postgresql", "sqlite"]:
            endpoint_content += f'''from models.{entity_name.lower()} import {entity_name}
from schemas.{entity_name.lower()} import {entity_name}Create, {entity_name}Update, {entity_name}Response
from database.session import get_db


router = APIRouter(prefix="/{entity_name.lower()}s", tags=["{entity_name.lower()}s"])


@router.post("/", response_model={entity_name}Response)
def create_{entity_name.lower()}({entity_name.lower()}: {entity_name}Create, db: Session = Depends(get_db)):
    db_{entity_name.lower()} = {entity_name}(**{entity_name.lower()}.dict())
    db.add(db_{entity_name.lower()})
    db.commit()
    db.refresh(db_{entity_name.lower()})
    return db_{entity_name.lower()}


@router.get("/", response_model=List[{entity_name}Response])
def get_{entity_name.lower()}s(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    {entity_name.lower()}s = db.query({entity_name}).offset(skip).limit(limit).all()
    return {entity_name.lower()}s


@router.get("/{{{entity_name.lower()}_id}}", response_model={entity_name}Response)
def get_{entity_name.lower()}({entity_name.lower()}_id: int, db: Session = Depends(get_db)):
    db_{entity_name.lower()} = db.query({entity_name}).filter({entity_name}.id == {entity_name.lower()}_id).first()
    if db_{entity_name.lower()} is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")
    return db_{entity_name.lower()}


@router.put("/{{{entity_name.lower()}_id}}", response_model={entity_name}Response)
def update_{entity_name.lower()}({entity_name.lower()}_id: int, {entity_name.lower()}_update: {entity_name}Update, db: Session = Depends(get_db)):
    db_{entity_name.lower()} = db.query({entity_name}).filter({entity_name}.id == {entity_name.lower()}_id).first()
    if db_{entity_name.lower()} is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")

    update_data = {entity_name.lower()}_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_{entity_name.lower()}, field, value)

    db.commit()
    db.refresh(db_{entity_name.lower()})
    return db_{entity_name.lower()}


@router.delete("/{{{entity_name.lower()}_id}}")
def delete_{entity_name.lower()}({entity_name.lower()}_id: int, db: Session = Depends(get_db)):
    db_{entity_name.lower()} = db.query({entity_name}).filter({entity_name}.id == {entity_name.lower()}_id).first()
    if db_{entity_name.lower()} is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")

    db.delete(db_{entity_name.lower()})
    db.commit()
    return {{"message": "{entity_name} deleted successfully"}}
'''
        elif db_type == "mongodb":
            endpoint_content += f'''from odmantic import AIOEngine
from typing import List

from models.{entity_name.lower()} import {entity_name}
from schemas.{entity_name.lower()} import {entity_name}Create, {entity_name}Update, {entity_name}Response
from database.engine import get_engine


router = APIRouter(prefix="/{entity_name.lower()}s", tags=["{entity_name.lower()}s"])


@router.post("/", response_model={entity_name}Response)
async def create_{entity_name.lower()}({entity_name.lower()}: {entity_name}Create, engine: AIOEngine = Depends(get_engine)):
    db_{entity_name.lower()} = {entity_name}(**{entity_name.lower()}.dict())
    return await engine.save(db_{entity_name.lower()})


@router.get("/", response_model=List[{entity_name}Response])
async def get_{entity_name.lower()}s(skip: int = 0, limit: int = 100, engine: AIOEngine = Depends(get_engine)):
    return await engine.find({entity_name}, skip=skip, limit=limit)


@router.get("/{{{entity_name.lower()}_id}}", response_model={entity_name}Response)
async def get_{entity_name.lower()}({entity_name.lower()}_id: str, engine: AIOEngine = Depends(get_engine)):
    db_{entity_name.lower()} = await engine.find_one({entity_name}, {entity_name}.id == {entity_name.lower()}_id)
    if db_{entity_name.lower()} is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")
    return db_{entity_name.lower()}


@router.put("/{{{entity_name.lower()}_id}}", response_model={entity_name}Response)
async def update_{entity_name.lower()}({entity_name.lower()}_id: str, {entity_name.lower()}_update: {entity_name}Update, engine: AIOEngine = Depends(get_engine)):
    db_{entity_name.lower()} = await engine.find_one({entity_name}, {entity_name}.id == {entity_name.lower()}_id)
    if db_{entity_name.lower()} is None:
        raise HTTPException(status_code=404, detail="{entity_name} not found")

    update_data = {entity_name.lower()}_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_{entity_name.lower()}, field, value)

    return await engine.save(db_{entity_name.lower()})


@router.delete("/{{{entity_name.lower()}_id}}")
async def delete_{entity_name.lower()}({entity_name.lower()}_id: str, engine: AIOEngine = Depends(get_engine)):
    result = await engine.delete({entity_name}, {entity_name}.id == {entity_name.lower()}_id)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="{entity_name} not found")
    return {{"message": "{entity_name} deleted successfully"}}
'''

        endpoint_file = Path(base_path) / "api" / f"{entity_name.lower()}.py"
        with open(endpoint_file, 'w') as f:
            f.write(endpoint_content)

        print(f"Created API endpoints: {endpoint_file}")


def main():
    parser = argparse.ArgumentParser(description="Generate database schema for FastAPI applications")
    parser.add_argument("--db-type", required=True, choices=["postgresql", "mongodb", "sqlite"],
                       help="Type of database to generate schema for")
    parser.add_argument("--entities", required=True,
                       help="JSON string defining entities and their fields, e.g., '{\"User\": {\"fields\": {\"name\": {\"type\": \"string\", \"nullable\": false}}}}'")
    parser.add_argument("--output", default=".", help="Output directory for generated files")

    args = parser.parse_args()

    # Parse entities JSON
    try:
        entities = json.loads(args.entities)
    except json.JSONDecodeError:
        print("Error: Invalid JSON format for entities")
        return

    # Create project structure
    create_project_structure(args.output)

    # Generate models based on database type
    if args.db_type in ["postgresql", "sqlite"]:
        generate_sqlalchemy_models(entities, args.db_type, args.output)
    elif args.db_type == "mongodb":
        generate_odmantic_models(entities, args.output)

    # Generate migration script if SQL database
    if args.db_type in ["postgresql", "sqlite"]:
        generate_migration_script(entities, args.db_type, args.output)

    # Generate FastAPI endpoints
    generate_fastapi_endpoints(entities, args.db_type, args.output)

    print(f"\nDatabase schema for {args.db_type} has been generated successfully!")
    print(f"Files created in: {args.output}")


if __name__ == "__main__":
    main()