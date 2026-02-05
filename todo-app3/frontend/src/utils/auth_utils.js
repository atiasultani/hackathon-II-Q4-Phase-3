/**
 * Authentication utilities for HttpOnly cookie-based authentication
 */

/**
 * Store user session info in localStorage (for UI purposes)
 * @param {Object} userInfo - User information to store
 */
export const storeUserInfo = (userInfo) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }
};

/**
 * Retrieve user session info from localStorage
 * @returns {Object|null} - User information or null if not found
 */
export const getUserInfo = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }
  return null;
};

/**
 * Remove user session info from localStorage
 */
export const removeUserInfo = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('userInfo');
  }
};

/**
 * Check if user has valid session by attempting to fetch user info
 * @returns {Promise<boolean>} - True if user has valid session, false otherwise
 */
export const isUserAuthenticated = async () => {
  try {
    // Since we can't directly access the HttpOnly cookie,
    // we need to make an API call to check if the user is authenticated
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/me`, {
      method: 'GET',
      credentials: 'include', // Include cookies in the request
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Store authentication token in localStorage (maintaining interface for compatibility)
 * With HttpOnly cookies approach, this is mainly for backward compatibility
 * @param {string} token - Token to store (though not used with HttpOnly cookies)
 */
export const storeToken = (token) => {
  // In HttpOnly cookie approach, we don't actually store the token
  // This function is maintained for backward compatibility
};

/**
 * Retrieve authentication token from storage
 * With HttpOnly cookies approach, this will return null as token is not accessible
 * @returns {string|null} - Will always return null since token is in HttpOnly cookie
 */
export const getToken = () => {
  // With HttpOnly cookies, we cannot access the token directly from JavaScript
  // Return null to indicate that we use cookies instead
  return null;
};

/**
 * Remove authentication token/storage
 */
export const removeToken = () => {
  // Remove any stored user info
  removeUserInfo();
};