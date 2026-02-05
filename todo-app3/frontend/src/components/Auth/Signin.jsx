import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './../../styles/Auth.css';

const Signin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Access login function from AuthContext

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.signin(formData.email, formData.password);

      // Since the backend uses HttpOnly cookies, we need to fetch user data separately
      try {
        const userData = await authService.getCurrentUser();
        // Update auth context with user info
        login({
          id: userData.user.id || userData.user_id,
          email: userData.user.email || userData.email
        });
      } catch (userErr) {
        console.warn('Could not fetch user data after login:', userErr);
        // Still redirect even if we couldn't get user data
      }

      // Redirect to dashboard or home page after successful login
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = formData.email && formData.password && isValidEmail(formData.email);

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign In</h2>

        {error && <div className="error-message">{error}</div>}

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
            minLength="8"
          />
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={!isFormValid || loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="auth-links">
          <a href="/signup">Don't have an account? Sign Up</a>
        </div>
      </form>
    </div>
  );
};

export default Signin;