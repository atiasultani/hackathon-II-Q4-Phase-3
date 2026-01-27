import React, { useState, useEffect } from 'react';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import ChatContainer from './components/chat-interface/ChatContainer';
import TaskList from './components/TaskList';
import { fetchTasks } from './services/api_client';
import './styles/App.css';
import 'tailwindcss/tailwind.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'tasks'

  // Check for user authentication
  useEffect(() => {
    // In a real implementation, you'd check for authentication tokens here
    // For now, we'll simulate a logged-in user
    const mockUser = { id: 'user123', name: 'Demo User' };
    setUser(mockUser);
    setLoading(false);
  }, []);

  // Load tasks from backend when component mounts
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await fetchTasks(user.id);
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    if (user) {
      loadTasks();
    }
  }, [user]);

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
          <h1>AI-Powered Todo Assistant</h1>
          <div className="user-info">
            <span>Welcome, {user?.name || 'User'}!</span>
          </div>
        </header>

        <nav className="app-nav">
          <button
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            My Tasks
          </button>
        </nav>

        <main className="app-main">
          {activeTab === 'chat' ? (
            <ChatContainer userId={user.id} setTasks={setTasks} />
          ) : (
            <TaskList tasks={tasks} setTasks={setTasks} />
          )}
        </main>
      </div>
    </UserPreferencesProvider>
  );
}

export default App;