#!/bin/bash

# Test script to verify the Database Schema skill works properly

echo "Testing Database Schema Skill..."
echo "Checking if all required directories exist..."
if [ -d ".claude/skills/database-schema" ]; then
    echo "✓ Skill directory exists"
else
    echo "✗ Skill directory missing"
    exit 1
fi

if [ -d ".claude/skills/database-schema/scripts" ]; then
    echo "✓ Scripts directory exists"
else
    echo "✗ Scripts directory missing"
    exit 1
fi

if [ -d ".claude/skills/database-schema/references" ]; then
    echo "✓ References directory exists"
else
    echo "✗ References directory missing"
    exit 1
fi

if [ -d ".claude/skills/database-schema/assets" ]; then
    echo "✓ Assets directory exists"
else
    echo "✗ Assets directory missing"
    exit 1
fi

echo "Checking if required files exist..."
if [ -f ".claude/skills/database-schema/SKILL.md" ]; then
    echo "✓ SKILL.md exists"
else
    echo "✗ SKILL.md missing"
    exit 1
fi

if [ -f ".claude/skills/database-schema/scripts/generate_schema.py" ]; then
    echo "✓ generate_schema.py exists"
    # Test if the script is executable
    if [ -x ".claude/skills/database-schema/scripts/generate_schema.py" ]; then
        echo "✓ generate_schema.py is executable"
    else
        echo "✗ generate_schema.py is not executable"
        chmod +x .claude/skills/database-schema/scripts/generate_schema.py
        echo "✓ Made generate_schema.py executable"
    fi
else
    echo "✗ generate_schema.py missing"
    exit 1
fi

echo "Checking SKILL.md content..."
if grep -q "name: database-schema" ".claude/skills/database-schema/SKILL.md"; then
    echo "✓ SKILL.md has correct name field"
else
    echo "✗ SKILL.md missing name field"
    exit 1
fi

if grep -q "description:" ".claude/skills/database-schema/SKILL.md"; then
    echo "✓ SKILL.md has description field"
else
    echo "✗ SKILL.md missing description field"
    exit 1
fi

echo "Checking reference files..."
ref_files=("POSTGRESQL.md" "MONGODB.md" "SQLITE.md" "MIGRATIONS.md" "RELATIONS.md" "FASTAPI_INTEGRATION.md")
for file in "${ref_files[@]}"; do
    if [ -f ".claude/skills/database-schema/references/$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
        exit 1
    fi
done

echo "Checking asset files..."
asset_files=("database.py" "requirements.txt" "example_usage.py")
for file in "${asset_files[@]}"; do
    if [ -f ".claude/skills/database-schema/assets/$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
        exit 1
    fi
done

echo "Database Schema skill verification completed successfully!"
echo "Skill directory structure:"
echo ".claude/skills/database-schema/"
echo "├── SKILL.md"
echo "├── scripts/"
echo "│   └── generate_schema.py"
echo "├── references/"
echo "│   ├── POSTGRESQL.md"
echo "│   ├── MONGODB.md"
echo "│   ├── SQLITE.md"
echo "│   ├── MIGRATIONS.md"
echo "│   ├── RELATIONS.md"
echo "│   └── FASTAPI_INTEGRATION.md"
echo "└── assets/"
echo "    ├── database.py"
echo "    ├── requirements.txt"
echo "    └── example_usage.py"