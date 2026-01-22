import React, { useState, useEffect } from 'react';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import ChatContainer from './components/chat-interface/ChatContainer';
import './styles/App.css';
import 'tailwindcss/tailwind.css';

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
    <UserPreferencesProvider>
      <div className="app">
        <header className="app-header">
          <h1>AI-Powered Todo Chatbot</h1>
          <div className="user-info">
            <span>Welcome, {user?.name || 'User'}!</span>
          </div>
        </header>
        <main className="app-main">
          <ChatContainer userId={user.id} />
        </main>
      </div>
    </UserPreferencesProvider>
  );
}

export default App;