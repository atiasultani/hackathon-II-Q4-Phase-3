import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { getCurrentUser } from './services/api_client';
import './styles/App.css';
import './styles/Auth.css';
import 'tailwindcss/tailwind.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="app-loading"><h2>Checking authentication...</h2></div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public route component (redirects if already logged in)
const PublicRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="app-loading"><h2>Checking authentication...</h2></div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
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
              <UserPreferencesProvider>
                <Login />
              </UserPreferencesProvider>
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
        {/* Redirect any other routes to dashboard if authenticated */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;