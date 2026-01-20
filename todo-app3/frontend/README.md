# AI-Powered Todo Chatbot Frontend

This is the frontend for the AI-powered Todo Chatbot application. It provides a chat interface for users to interact with the AI-powered todo system using natural language.

## Features

- Chat interface for natural language interaction with the todo system
- Real-time message streaming
- User authentication support
- Conversation history management
- Responsive design for desktop and mobile

## Tech Stack

- React 18
- Vite
- Axios for API communication
- CSS for styling

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Backend server running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

1. Make sure the backend server is running:
```bash
# From the backend directory
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## API Integration

The frontend communicates with the backend API at `http://localhost:8000/api/{user_id}/chat` to process natural language requests and manage todo tasks.

## Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   └── ChatInterface.jsx
    └── styles/
        ├── index.css
        └── App.css
```