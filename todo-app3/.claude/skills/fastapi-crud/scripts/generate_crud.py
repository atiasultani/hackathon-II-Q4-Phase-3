#!/usr/bin/env python3
"""
FastAPI CRUD Generator Script

This script generates complete CRUD operations for FastAPI applications
with SQLAlchemy models, Pydantic schemas, and API routes.
"""

import os
import argparse
from pathlib import Path


def create_directory_structure(base_path):
    """Create the standard FastAPI project directory structure."""
    dirs = [
        "models",
        "schemas",
        "routes",
        "database",
        "dependencies",
        "utils"
    ]

    for directory in dirs:
        path = Path(base_path) / directory
        path.mkdir(exist_ok=True)
        # Create __init__.py in each directory
        (path / "__init__.py").touch(exist_ok=True)

    print(f"Created directory structure in {base_path}")


def create_model(entity_name, fields, base_path):
    """Create SQLAlchemy model file."""
    model_content = f'''from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database.base import Base


class {entity_name}(Base):
    __tablename__ = "{entity_name.lower()}s"

'''

    # Add ID field
    model_content += '''    id = Column(Integer, primary_key=True, index=True)
'''

    # Add user-defined fields
    for field_name, field_type in fields.items():
        if field_type == "string":
            model_content += f'    {field_name} = Column(String, index=True)\n'
        elif field_type == "text":
            model_content += f'    {field_name} = Column(String)\n'
        elif field_type == "integer":
            model_content += f'    {field_name} = Column(Integer)\n'
        elif field_type == "boolean":
            model_content += f'    {field_name} = Column(Boolean, default=False)\n'
        elif field_type == "datetime":
            model_content += f'    {field_name} = Column(DateTime(timezone=True), server_default=func.now())\n'

    model_content += f'''

    def __repr__(self):
        return f"<{entity_name}(id={{self.id}}, name={{getattr(self, list({fields.keys())[0] if fields else 'id'}, None)}})>"
'''

    model_file = Path(base_path) / "models" / f"{entity_name.lower()}.py"
    with open(model_file, 'w') as f:
        f.write(model_content)

    print(f"Created model: {model_file}")


def create_schemas(entity_name, fields, base_path):
    """Create Pydantic schema files."""
    schema_content = f'''from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class {entity_name}Base(BaseModel):
'''

    # Add fields to base schema
    for field_name, field_type in fields.items():
        if field_type == "string":
            schema_content += f'    {field_name}: str\n'
        elif field_type == "text":
            schema_content += f'    {field_name}: str\n'
        elif field_type == "integer":
            schema_content += f'    {field_name}: int\n'
        elif field_type == "boolean":
            schema_content += f'    {field_name}: bool\n'
        elif field_type == "datetime":
            schema_content += f'    {field_name}: datetime\n'

    schema_content += f'''

class {entity_name}Create({entity_name}Base):
    pass


class {entity_name}Update(BaseModel):
'''

    # Add optional fields for update
    for field_name, field_type in fields.items():
        if field_type == "string":
            schema_content += f'    {field_name}: Optional[str] = None\n'
        elif field_type == "text":
            schema_content += f'    {field_name}: Optional[str] = None\n'
        elif field_type == "integer":
            schema_content += f'    {field_name}: Optional[int] = None\n'
        elif field_type == "boolean":
            schema_content += f'    {field_name}: Optional[bool] = None\n'
        elif field_type == "datetime":
            schema_content += f'    {field_name}: Optional[datetime] = None\n'


    schema_content += f'''

class {entity_name}Response({entity_name}Base):
    id: int
'''

    # Add datetime field if it exists
    if "datetime" in fields.values():
        schema_content += f'    created_at: datetime\n'

    schema_content += f'''

    class Config:
        from_attributes = True
'''

    schema_file = Path(base_path) / "schemas" / f"{entity_name.lower()}.py"
    with open(schema_file, 'w') as f:
        f.write(schema_content)

    print(f"Created schemas: {schema_file}")


def create_route(entity_name, base_path):
    """Create API route file."""
    route_content = f'''from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models.{entity_name.lower()} import {entity_name}
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

    route_file = Path(base_path) / "routes" / f"{entity_name.lower()}.py"
    with open(route_file, 'w') as f:
        f.write(route_content)

    print(f"Created route: {route_file}")


def create_database_files(base_path):
    """Create database configuration files."""
    # Database base
    base_content = '''from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''

    base_file = Path(base_path) / "database" / "session.py"
    with open(base_file, 'w') as f:
        f.write(base_content)

    print(f"Created database session: {base_file}")


def main():
    parser = argparse.ArgumentParser(description="Generate FastAPI CRUD operations")
    parser.add_argument("--entity", required=True, help="Name of the entity (e.g., User, Product)")
    parser.add_argument("--fields", nargs='+', required=True,
                       help="Fields in format name:type (e.g., name:string email:string age:integer)")
    parser.add_argument("--output", default=".", help="Output directory for generated files")

    args = parser.parse_args()

    # Parse fields
    fields = {}
    for field in args.fields:
        name, field_type = field.split(':')
        fields[name] = field_type

    # Create directory structure
    create_directory_structure(args.output)

    # Create database files
    create_database_files(args.output)

    # Create model
    create_model(args.entity, fields, args.output)

    # Create schemas
    create_schemas(args.entity, fields, args.output)

    # Create route
    create_route(args.entity, args.output)

    print(f"\nCRUD operations for {args.entity} have been generated successfully!")
    print(f"Files created in: {args.output}")


if __name__ == "__main__":
    main()