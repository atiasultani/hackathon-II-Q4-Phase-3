import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/api_client';
import { UserPreferencesProvider } from '../context/UserPreferencesContext';
import ChatContainer from '../components/chat-interface/ChatContainer';
import TaskList from '../components/TaskList';
import '../styles/App.css';
import '../styles/Auth.css';
import 'tailwindcss/tailwind.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'tasks'
  const navigate = useNavigate();

  // Check for user authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('User not authenticated:', error);
        // Redirect to login if not authenticated
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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
            <span>Welcome, {user?.email || 'User'}!</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
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
            <ChatContainer setTasks={setTasks} />
          ) : (
            <TaskList tasks={tasks} setTasks={setTasks} />
          )}
        </main>
      </div>
    </UserPreferencesProvider>
  );
};

export default Dashboard;