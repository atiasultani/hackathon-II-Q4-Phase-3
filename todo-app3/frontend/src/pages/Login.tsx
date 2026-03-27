import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, getCurrentUser } from '../services/api_client';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: loginContext } = useAuth(); // Use auth context login

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (formData.password.length > 72) {
      setError('Password exceeds maximum length');
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter (A-Z)');
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter (a-z)');
      setLoading(false);
      return;
    }

    if (!/\d/.test(formData.password)) {
      setError('Password must contain at least one digit (0-9)');
      setLoading(false);
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must contain at least one special character (!@#$%^&*(),.?\"{}<>|)');
      setLoading(false);
      return;
    }

    try {
      // Login to backend
      await loginApi(formData.email, formData.password);

      // Get user data and update auth context
      try {
        const userData = await getCurrentUser();
        loginContext({
          id: userData.user_id || userData.id,
          email: userData.email || formData.email
        });
      } catch (userErr) {
        console.warn('Could not fetch user data after login:', userErr);
        // Still redirect even if we couldn't get user data
      }

      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Log In</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              maxLength="72"
            />
            <small className="password-hint">
              8-72 characters: uppercase, lowercase, digit, special char (!@#$%^&*)
            </small>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;