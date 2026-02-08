#!/bin/bash

# Test script to verify the FastAPI CRUD skill works properly

echo "Testing FastAPI CRUD Skill..."
echo "Checking if all required directories exist..."
if [ -d ".claude/skills/fastapi-crud" ]; then
    echo "✓ Skill directory exists"
else
    echo "✗ Skill directory missing"
    exit 1
fi

if [ -d ".claude/skills/fastapi-crud/scripts" ]; then
    echo "✓ Scripts directory exists"
else
    echo "✗ Scripts directory missing"
    exit 1
fi

if [ -d ".claude/skills/fastapi-crud/references" ]; then
    echo "✓ References directory exists"
else
    echo "✗ References directory missing"
    exit 1
fi

if [ -d ".claude/skills/fastapi-crud/assets" ]; then
    echo "✓ Assets directory exists"
else
    echo "✗ Assets directory missing"
    exit 1
fi

echo "Checking if required files exist..."
if [ -f ".claude/skills/fastapi-crud/SKILL.md" ]; then
    echo "✓ SKILL.md exists"
else
    echo "✗ SKILL.md missing"
    exit 1
fi

if [ -f ".claude/skills/fastapi-crud/scripts/generate_crud.py" ]; then
    echo "✓ generate_crud.py exists"
    # Test if the script is executable
    if [ -x ".claude/skills/fastapi-crud/scripts/generate_crud.py" ]; then
        echo "✓ generate_crud.py is executable"
    else
        echo "✗ generate_crud.py is not executable"
        exit 1
    fi
else
    echo "✗ generate_crud.py missing"
    exit 1
fi

echo "Checking SKILL.md content..."
if grep -q "name: fastapi-crud" ".claude/skills/fastapi-crud/SKILL.md"; then
    echo "✓ SKILL.md has correct name field"
else
    echo "✗ SKILL.md missing name field"
    exit 1
fi

if grep -q "description:" ".claude/skills/fastapi-crud/SKILL.md"; then
    echo "✓ SKILL.md has description field"
else
    echo "✗ SKILL.md missing description field"
    exit 1
fi

echo "FastAPI CRUD Skill verification completed successfully!"
echo "Skill directory structure:"
echo ".claude/skills/fastapi-crud/"
echo "├── SKILL.md"
echo "├── scripts/"
echo "│   └── generate_crud.py"
echo "├── references/"
echo "│   ├── FASTAPI.md"
echo "│   ├── SQLALCHEMY.md"
echo "│   ├── SCHEMAS.md"
echo "│   └── TESTING.md"
echo "└── assets/"
echo "    ├── main.py"
echo "    └── requirements.txt"