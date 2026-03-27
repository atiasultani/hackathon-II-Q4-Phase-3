import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, getCurrentUser } from '../../services/api_client';
import { useAuth } from '../../contexts/AuthContext';
import './../styles/Auth.css';

const Signin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: loginContext } = useAuth(); // Rename to avoid conflict

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
      // Use the authentication service instead of direct API call
      const response = await loginApi(formData.email, formData.password);

      // The login service handles HttpOnly cookie storage automatically
      // Now get user information to update the auth context
      try {
        const userData = await getCurrentUser();
        // Update auth context with user info
        loginContext({
          id: userData.user_id || userData.id,
          email: userData.email || formData.email
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