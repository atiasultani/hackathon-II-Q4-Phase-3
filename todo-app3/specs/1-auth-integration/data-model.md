# Data Model: Authentication System

## Authentication Token
- **Type**: String (JWT format)
- **Fields**:
  - token: String (the JWT token value)
  - expiry: DateTime (expiration timestamp)
  - userId: String/UUID (user identifier from token claims)
- **Validation**: Must be properly formatted JWT with valid signature
- **Relationships**: Associated with a user identity

## User Identity Claims
- **Type**: Object (decoded from JWT payload)
- **Fields**:
  - userId: String/UUID (unique user identifier)
  - username: String (user display name)
  - email: String (user email address)
  - roles: Array<String> (user permissions/roles)
  - iat: DateTime (issued at time)
  - exp: DateTime (expiration time)
- **Validation**: Must contain required fields, not expired
- **Relationships**: Links to user data in system

## Authentication Credentials
- **Type**: Object (for login requests)
- **Fields**:
  - username: String (user identifier)
  - password: String (user password, never stored)
- **Validation**: Username and password must meet length/format requirements
- **Relationships**: Verified against stored user credentials

## Session State (Frontend)
- **Type**: Object (client-side session management)
- **Fields**:
  - isAuthenticated: Boolean (current authentication status)
  - token: String (current JWT token)
  - user: Object (user identity information)
- **Validation**: Maintained in sync with token validity
- **Relationships**: Derived from authentication token