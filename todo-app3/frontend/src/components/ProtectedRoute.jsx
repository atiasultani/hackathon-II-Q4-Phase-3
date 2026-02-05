import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, isValidToken } from '../utils/auth_utils';

const ProtectedRoute = ({ children }) => {
  const token = getToken();
  const isAuthenticated = token && isValidToken(token);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/signin" replace />;
  }

  // Render the protected component if authenticated
  return children;
};

export default ProtectedRoute;