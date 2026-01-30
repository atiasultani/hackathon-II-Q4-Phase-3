/**
 * Token management utilities for authentication
 */

/**
 * Store authentication token in localStorage
 * @param {string} token - JWT token to store
 */
export const storeToken = (token) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('token', token);
  }
};

/**
 * Retrieve authentication token from localStorage
 * @returns {string|null} - JWT token or null if not found
 */
export const getToken = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('token');
  }
};

/**
 * Decode JWT token to get payload
 * @param {string} token - JWT token to decode
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

    // Split token into parts
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload);

    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true; // Consider invalid tokens as expired
  }

  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  return payload.exp < currentTime;
};

/**
 * Get token expiration time
 * @param {string} token - JWT token to check
 * @returns {number|null} - Expiration timestamp or null if invalid
 */
export const getTokenExpiration = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return payload.exp;
};

/**
 * Validate token (check if it exists and is not expired)
 * @param {string} token - JWT token to validate
 * @returns {boolean} - True if token is valid, false otherwise
 */
export const isValidToken = (token) => {
  if (!token) {
    return false;
  }

  return !isTokenExpired(token);
};

/**
 * Get user ID from token
 * @param {string} token - JWT token to extract user ID from
 * @returns {string|null} - User ID or null if not found
 */
export const getUserIdFromToken = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.user_id) {
    return null;
  }

  return payload.user_id;
};