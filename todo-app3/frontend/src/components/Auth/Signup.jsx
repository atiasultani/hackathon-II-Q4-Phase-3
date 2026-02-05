import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import './../../styles/Auth.css';

const Signup = () => {
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
      const response = await authService.signup(formData.email, formData.password);

      // Since the backend uses HttpOnly cookies, we need to fetch user data separately
      try {
        const userData = await authService.getCurrentUser();
        // Update auth context with user info
        login({
          id: userData.user.id || userData.user_id,
          email: userData.user.email || userData.email
        });
      } catch (userErr) {
        console.warn('Could not fetch user data after signup:', userErr);
        // Still redirect even if we couldn't get user data
      }

      // Redirect to dashboard or home page after successful signup
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
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
        <h2>Sign Up</h2>

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
          <span className="password-hint">Must be at least 8 characters</span>
        </div>

        <button
          type="submit"
          className="auth-button"
          disabled={!isFormValid || loading}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>

        <div className="auth-links">
          <a href="/signin">Already have an account? Sign In</a>
        </div>
      </form>
    </div>
  );
};

export default Signup;