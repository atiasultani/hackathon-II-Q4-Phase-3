import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup as signupService, getCurrentUser } from '../../services/api_client';
import { useAuth } from '../../contexts/AuthContext';
import './../styles/Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Use the login function from auth context

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
      // Use the signup service instead of direct API call
      const response = await signupService(formData.email, formData.password);

      // The signup service handles HttpOnly cookie storage automatically
      // Now get user information to update the auth context
      try {
        const userData = await getCurrentUser();
        // Update auth context with user info
        login({
          id: userData.user_id || userData.id,
          email: userData.email || formData.email
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