#!/bin/bash
# Deployment script for the AI Todo Chatbot

set -e  # Exit on any error

echo "Starting deployment preparation..."

# Build the frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Frontend build completed."

# Return to backend directory
cd ../backend

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Run database migrations if needed
echo "Running database setup..."
# Add any database migration commands here if needed

echo "Deployment preparation completed successfully!"
echo ""
echo "To deploy to Hugging Face Spaces:"
echo "1. Push this code to a Hugging Face Space"
echo "2. Set environment variables in the Space settings:"
echo "   - JWT_SECRET (for authentication)"
echo "   - DATABASE_URL (for database connection)"
echo "3. The Space will automatically build and deploy the app"
echo ""
echo "For local testing:"
echo "1. Start the backend: cd backend && source venv/bin/activate && python -c 'import uvicorn; from main import app; uvicorn.run(app, host=\"0.0.0.0\", port=8000)'"
echo "2. Start the frontend: cd frontend && npm start"