# Quickstart: Authentication Integration

## Prerequisites
- Backend server running with authentication endpoints
- Frontend application configured to communicate with backend
- Valid user identifiers for testing

## Setup Process

### Backend Configuration
1. Ensure JWT secret is configured in environment variables
2. Verify authentication endpoints are available:
   - `/api/auth/signup` - for user registration
   - `/api/auth/login` - for credential-based login
   - `/api/auth/logout` - for user logout
   - `/api/auth/me` - for getting current user info
3. Confirm authentication cookies are properly handled

### Frontend Configuration
1. Configure API base URL to point to backend
2. Implement token storage mechanism (localStorage/sessionStorage)
3. Add Authorization header interceptor to API client

## Usage Steps

### 1. User Registration/Login
```javascript
// Register a new user
const signupResponse = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'SecurePassword123!' })
});

// Or login an existing user
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'SecurePassword123!' })
});
```

### 2. Make Authenticated Requests
```javascript
// API client automatically includes authentication cookies
// No need to manually manage tokens - handled via HttpOnly cookies
const response = await fetch('/api/chat', {
  method: 'POST',
  credentials: 'include',  // Include authentication cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', conversation_id: null })
});
```

### 3. Get Current User Information
```javascript
// Get current authenticated user info
const userResponse = await fetch('/api/auth/me', {
  method: 'GET',
  credentials: 'include'  // Include authentication cookies
});
```

### 4. Logout
```javascript
// Clear authentication
const logoutResponse = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'  // Include authentication cookies
});
```

## Testing the Integration

### Manual Testing
1. Call `/api/auth/signup` to register a new user
2. Call `/api/auth/login` to authenticate the user
3. Call `/api/auth/me` to verify authentication is working
4. Verify that authentication cookies are properly set and included in subsequent requests

### Expected Results
- Successful authentication returns valid JWT token
- Protected endpoints accept requests with valid tokens
- Invalid/missing tokens result in appropriate error responses

## Troubleshooting

### Common Issues
- **401 Unauthorized**: User not authenticated or session expired
- **403 Forbidden**: Insufficient permissions (though not commonly used in this implementation)
- **Network Error**: Backend server not accessible
- **Missing Cookies**: Credentials not being sent with requests

### Verification Steps
1. Check that authentication cookies are properly set after login
2. Verify that `credentials: 'include'` is used in fetch requests to send cookies
3. Confirm authentication endpoints are accessible at `/api/auth/*` paths