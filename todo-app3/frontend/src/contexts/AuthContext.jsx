import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserInfo, removeUserInfo, isUserAuthenticated } from '../utils/auth_utils';

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
        const isAuthenticated = await isUserAuthenticated();

        if (isAuthenticated) {
          // Get user info from local storage (UI convenience, not security)
          const userInfo = getUserInfo();

          if (userInfo) {
            setUser(userInfo);
            setIsAuthenticated(true);
          } else {
            // If authenticated but no local info, fetch from API
            try {
              const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                }
              });

              if (response.ok) {
                const data = await response.json();
                const userData = {
                  id: data.user.id || data.user_id,
                  email: data.user.email || data.email
                };

                setUser(userData);
                setIsAuthenticated(true);
              } else {
                setIsAuthenticated(false);
              }
            } catch (fetchError) {
              console.error('Error fetching user info:', fetchError);
              setIsAuthenticated(false);
            }
          }
        } else {
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

  const logout = async () => {
    try {
      // Call logout API to clear server-side session/cookies
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage regardless of API success
      removeUserInfo();
      setUser(null);
      setIsAuthenticated(false);
    }
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