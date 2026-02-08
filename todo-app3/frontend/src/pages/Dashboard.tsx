import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../services/api_client';
import { UserPreferencesProvider } from '../context/UserPreferencesContext';
import ChatContainer from '../components/chat-interface/ChatContainer';
import TaskList from '../components/TaskList';
import '../styles/App.css';
import '../styles/Auth.css';
import 'tailwindcss/tailwind.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'tasks'
  const navigate = useNavigate();
  const { user, logout: logoutContext } = useAuth(); // Use auth context

  const handleLogout = async () => {
    try {
      await logoutContext(); // Use context logout which handles both API and local state
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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