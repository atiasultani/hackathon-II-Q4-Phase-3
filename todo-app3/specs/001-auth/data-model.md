# Data Model: Authentication and Security

## User Entity

**Entity Name**: User
**Description**: Represents an authenticated user in the system with unique identifier and authentication status

### Fields
- `id` (UUID/string): Unique identifier for the user (primary key)
- `email` (string): User's email address (unique, indexed)
- `username` (string): User's chosen username (optional, indexed)
- `hashed_password` (string): BCrypt hashed password (not stored in plain text)
- `created_at` (timestamp): Account creation timestamp
- `updated_at` (timestamp): Last update timestamp
- `is_active` (boolean): Account active status (default: true)
- `email_verified` (boolean): Email verification status (default: false)
- `last_login_at` (timestamp): Last successful login timestamp (nullable)
- `failed_login_attempts` (integer): Count of consecutive failed login attempts (default: 0)
- `locked_until` (timestamp): Time until account is locked due to failed attempts (nullable)

### Relationships
- One-to-many with Tasks (a user can have many tasks)
- One-to-many with Conversations (a user can have many conversations)
- One-to-many with Messages (a user can have many messages)
- One-to-many with Sessions (a user can have multiple active sessions) - conceptual

### Validation Rules
- Email must be valid email format
- Email must be unique across all users
- Email must not exceed 255 characters
- Username must be unique if provided
- Password must meet strength requirements (during registration only)
- All required fields are mandatory
- User must be active to authenticate

### State Transitions
- New user: `is_active=true`, `email_verified=false`, `failed_login_attempts=0`
- Verified user: `email_verified=true` (after email verification - future feature)
- Locked user: `locked_until=timestamp` (after too many failed attempts)
- Deactivated user: `is_active=false` (account deactivation - future feature)

## Session/Token Entity (Conceptual)

**Entity Name**: Authentication Token
**Description**: Represents an active authentication session (managed through JWT tokens)

### Fields
- `token_hash` (string): Hash of the JWT token (for revocation tracking)
- `user_id` (UUID/string): Reference to the user who owns this token
- `expires_at` (timestamp): Token expiration time
- `created_at` (timestamp): Token creation time
- `device_fingerprint` (string): Optional device identification
- `revoked` (boolean): Token revocation status (default: false)
- `type` (string): Token type (access, refresh) - if refresh tokens are implemented

### Relationships
- Many-to-one with User (many tokens can be associated with one user)

### Validation Rules
- Token must be properly formatted JWT when stored (for reference)
- Token must not be expired (when validating)
- Token must be associated with an active user
- Revoked tokens must not grant access
- Device fingerprint may be required for security

### State Transitions
- Active token: `revoked=false`, `expires_at` in future
- Expired token: `expires_at` in past (automatically invalid)
- Revoked token: `revoked=true` (manually invalidated)
- Invalid token: Either expired or revoked

## Security Event Entity (Conceptual)

**Entity Name**: Security Event
**Description**: Tracks authentication and authorization events for auditing and monitoring

### Fields
- `id` (UUID/string): Unique identifier for the event (primary key)
- `user_id` (UUID/string): Reference to the user involved in the event
- `event_type` (string): Type of security event (login_success, login_failure, unauthorized_access, etc.)
- `timestamp` (timestamp): When the event occurred
- `ip_address` (string): IP address from which the event originated
- `user_agent` (string): User agent string from the request
- `details` (JSON): Additional details about the event
- `severity` (string): Severity level (info, warning, error, critical)

### Relationships
- Many-to-one with User (many events associated with one user)

### Validation Rules
- Event type must be one of the predefined values
- Timestamp must be current time or recent
- IP address must be valid format
- Severity must be one of the predefined levels

### State Transitions
- New event: Created when security-relevant action occurs
- Processed event: May be analyzed and flagged if suspicious

## Security Considerations

### Data Encryption
- Passwords must never be stored in plain text (enforced by hashing with bcrypt)
- Sensitive authentication data should be encrypted at rest (tokens, security events)
- Token-related information should be secured during transmission
- User session data should be encrypted if stored server-side

### Indexing
- Email field should be indexed for fast lookup during authentication
- User ID should be indexed for foreign key relationships
- Created_at should be indexed for time-based queries
- IP address should be indexed for security analysis
- Timestamp should be indexed for audit trail queries

### Constraints
- Email uniqueness constraint to prevent duplicate registrations
- Foreign key constraints to maintain referential integrity
- Not-null constraints on required fields
- Check constraints to validate severity levels for security events
- Expiration constraints to automatically clean up expired tokens