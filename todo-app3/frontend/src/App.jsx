import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for user authentication
  useEffect(() => {
    // In a real implementation, you'd check for authentication tokens here
    // For now, we'll simulate a logged-in user
    const mockUser = { id: 'user123', name: 'Demo User' };
    setUser(mockUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI-Powered Todo Chatbot</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || 'User'}!</span>
        </div>
      </header>
      <main className="app-main">
        <ChatInterface userId={user.id} />
      </main>
    </div>
  );
}

export default App;