# Quickstart: Authentication Integration

## Prerequisites
- Backend server running with authentication endpoints
- Frontend application configured to communicate with backend
- Valid user identifiers for testing

## Setup Process

### Backend Configuration
1. Ensure JWT secret is configured in environment variables
2. Verify authentication endpoints are available:
   - `/api/token` - for obtaining tokens
   - `/api/login` - for credential-based login
3. Confirm protected endpoints require authentication

### Frontend Configuration
1. Configure API base URL to point to backend
2. Implement token storage mechanism (localStorage/sessionStorage)
3. Add Authorization header interceptor to API client

## Usage Steps

### 1. Obtain Authentication Token
```javascript
// Get token for a specific user
const token = await getTokenForUser('user123');
```

### 2. Make Authenticated Requests
```javascript
// API client automatically includes Authorization header
const response = await sendMessage(userId, message);
```

### 3. Handle Token Expiration
- Monitor token expiration time
- Refresh token before expiration
- Redirect to login if token becomes invalid

## Testing the Integration

### Manual Testing
1. Call `/api/token?user_id=user123` to get a token
2. Use the token in Authorization header for protected endpoints
3. Verify that requests without tokens return 401/403

### Expected Results
- Successful authentication returns valid JWT token
- Protected endpoints accept requests with valid tokens
- Invalid/missing tokens result in appropriate error responses

## Troubleshooting

### Common Issues
- **403 Forbidden**: Token doesn't match user_id in request
- **401 Unauthorized**: Invalid or expired token
- **Network Error**: Backend server not accessible

### Verification Steps
1. Check that token was properly obtained and stored
2. Verify Authorization header format: `Bearer {token}`
3. Confirm user_id in URL matches user_id in token