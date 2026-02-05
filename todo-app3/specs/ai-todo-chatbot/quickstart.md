# Quickstart: Chat UI Implementation

## Overview
This guide provides the essential information needed to implement and test the Chat UI for the AI-powered todo chatbot system.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- React 18+ development environment
- Access to the backend API for the todo chatbot system
- Git repository cloned and set up

## Frontend Setup

### Install Dependencies
```bash
cd frontend
npm install react react-dom react-query axios styled-components
# Or if using ChatKit specifically
npm install chatkit-client
```

### Environment Configuration
Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_CHATKIT_INSTANCE_LOCATOR=your-instance-locator
REACT_APP_CHATKIT_KEY=your-key
```

## Core Components Implementation

### 1. Chat Container Component
Create the main chat container that manages the overall chat interface:

```jsx
// frontend/src/components/ChatInterface/ChatContainer.jsx
import React, { useState, useEffect } from 'react';
import { MessageDisplay } from './MessageDisplay';
import { MessageInput } from './MessageInput';
import { LoadingIndicator } from './LoadingIndicator';

export const ChatContainer = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Load conversation history on component mount
  useEffect(() => {
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    // Implementation to load conversation history
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        <MessageDisplay messages={messages} />
        {isLoading && <LoadingIndicator />}
      </div>
      <div className="chat-input-area">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};
```

### 2. Message Display Component
Implement the component responsible for displaying messages:

```jsx
// frontend/src/components/ChatInterface/MessageDisplay.jsx
import React from 'react';
import { formatTimestamp } from '../../utils/messageFormatter';

export const MessageDisplay = ({ messages }) => {
  return (
    <div className="message-display">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
        >
          <div className="message-content">{message.content}</div>
          <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
        </div>
      ))}
    </div>
  );
};
```

### 3. Message Input Component
Create the component for composing and sending messages:

```jsx
// frontend/src/components/ChatInterface/MessageInput.jsx
import React, { useState } from 'react';

export const MessageInput = ({ onSendMessage }) => {
  const [messageText, setMessageText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <textarea
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder="Type your message..."
        className="message-input-textarea"
      />
      <button type="submit" className="send-button" disabled={!messageText.trim()}>
        Send
      </button>
    </form>
  );
};
```

## Message Streaming Implementation

### Real-time Response Display
Implement streaming responses from the AI assistant:

```jsx
// frontend/src/hooks/useChat.js
import { useState } from 'react';
import { chatService } from '../services/chatService';

export const useChat = () => {
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (message) => {
    setIsStreaming(true);
    setStreamingResponse('');

    try {
      const stream = await chatService.sendMessageStream(message);

      for await (const chunk of stream) {
        setStreamingResponse(prev => prev + chunk);
      }
    } catch (error) {
      console.error('Error streaming response:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    sendMessage,
    streamingResponse,
    isStreaming
  };
};
```

## Conversation Management

### Loading History
Implement conversation history loading:

```javascript
// frontend/src/services/chatService.js
export const chatService = {
  async getConversationHistory(conversationId) {
    const response = await fetch(`/api/conversations/${conversationId}/messages`);
    return response.json();
  },

  async sendMessage(message, conversationId) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId }),
    });
    return response.json();
  }
};
```

## Error Handling

### Client-Side Error Handling
Implement proper error handling in the UI:

```jsx
// frontend/src/components/ChatInterface/ErrorMessage.jsx
export const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Retry
        </button>
      )}
    </div>
  );
};
```

## Authentication Integration

### Protected Chat Interface
Ensure the chat interface respects authentication:

```jsx
// frontend/src/components/ChatInterface/ProtectedChat.jsx
import { useAuth } from '../../hooks/useAuth';

export const ProtectedChat = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in to access the chat interface</div>;
  }

  return <ChatContainer />;
};
```

## Testing the Implementation

### Manual Testing
1. Start the backend server
2. Start the frontend development server
3. Navigate to the chat interface
4. Verify that messages can be sent and received
5. Test conversation history loading
6. Verify streaming responses work properly
7. Test error handling scenarios

### Component Testing
```bash
npm test
# Run specific chat component tests
npm run test -- ChatContainer
```

## Running the Application

### Frontend
```bash
cd frontend
npm start
```

The chat interface will be available at http://localhost:3000

## Deployment Notes

### Environment Variables
Ensure the following environment variables are set in production:
- `REACT_APP_API_URL`: Production backend API URL
- Appropriate security headers and CORS settings
- SSL/TLS certificates for secure connections