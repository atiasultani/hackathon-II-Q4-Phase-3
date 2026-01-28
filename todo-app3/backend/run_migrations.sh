#!/bin/bash

# Script to run database migrations
# This is especially useful for Hugging Face deployment

echo "Running database migrations..."

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

# Run alembic migrations
python -m alembic upgrade head

echo "Migrations completed."

# Start the application
exec "$@"