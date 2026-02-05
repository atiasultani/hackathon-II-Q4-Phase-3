import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, removeToken, isValidToken, decodeToken } from '../utils/auth_utils';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = getToken();

        if (token && isValidToken(token)) {
          // Decode token to get user info
          const decoded = decodeToken(token);
          if (decoded) {
            setUser({
              id: decoded.user_id || decoded.sub,
              email: decoded.email
            });
            setIsAuthenticated(true);
          } else {
            // Token exists but is invalid, remove it
            removeToken();
            setIsAuthenticated(false);
          }
        } else {
          // No valid token
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};