import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { UserPreferencesProvider } from './context/UserPreferencesContext.tsx';
import { WebSocketProvider } from './providers/WebSocketProvider';
import Signup from './pages/Signup.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import PublicRoute from './components/PublicRoute.tsx';
import './styles/App.css';
import './styles/Auth.css';
import 'tailwindcss/tailwind.css';

// Loading component
const LoadingPage = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>
    <div>Loading authentication...</div>
  </div>
);

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <UserPreferencesProvider>
              <Signup />
            </UserPreferencesProvider>
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserPreferencesProvider>
              <Dashboard />
            </UserPreferencesProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <WebSocketProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </WebSocketProvider>
  );
}

export default App;