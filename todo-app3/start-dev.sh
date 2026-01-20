#!/bin/bash

# Script to start both backend and frontend servers for development

echo "Starting AI-Powered Todo Chatbot development servers..."

# Start backend server in background
echo "Starting backend server on port 8000..."
cd backend && source venv/bin/activate && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend server in background
echo "Starting frontend server on port 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

echo "Servers started successfully!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"

# Function to stop servers on Ctrl+C
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID