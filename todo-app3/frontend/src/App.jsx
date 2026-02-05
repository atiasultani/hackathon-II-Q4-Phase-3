import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { getCurrentUser } from './services/api_client';
import './styles/App.css';
import './styles/Auth.css';
import 'tailwindcss/tailwind.css';

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