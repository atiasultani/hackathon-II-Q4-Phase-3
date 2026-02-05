import axios from 'axios';
import { storeToken, getToken, removeToken } from '../utils/auth_utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add interceptor to include token in requests
    this.api.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token might be expired, remove it
          removeToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async signup(email, password) {
    try {
      const response = await this.api.post('/auth/signup', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signin(email, password) {
    try {
      const response = await this.api.post('/auth/login', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signout() {
    try {
      const response = await this.api.post('/auth/logout');
      removeToken();
      return response.data;
    } catch (error) {
      // Even if the API call fails, we should still remove the token locally
      removeToken();
      throw this.handleError(error);
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return new Error(error.response.data.detail || error.response.data.message || 'Request failed');
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error: Unable to reach server');
    } else {
      // Something else happened
      return new Error(error.message || 'An error occurred');
    }
  }
}

export default new AuthService();