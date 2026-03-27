# Data Model: Authentication Integration

## User Entity

**Entity Name**: User
**Description**: Represents a registered user in the system

### Fields
- `id` (UUID/string): Unique identifier for the user (primary key)
- `email` (string): User's email address (unique, indexed)
- `hashed_password` (string): BCrypt hashed password (not stored in plain text)
- `created_at` (timestamp): Account creation timestamp
- `updated_at` (timestamp): Last update timestamp
- `is_active` (boolean): Account active status (default: true)
- `email_verified` (boolean): Email verification status (default: false)

### Relationships
- One-to-many with Tasks (a user can have many tasks)
- One-to-many with Conversations (a user can have many conversations)
- One-to-many with Messages (a user can have many messages)

### Validation Rules
- Email must be valid email format
- Email must be unique across all users
- Email must not exceed 255 characters
- Password must meet strength requirements (during registration only)
- All fields except `email_verified` and `is_active` are required

### State Transitions
- New user: `is_active=true`, `email_verified=false` (after successful registration)
- Verified user: `email_verified=true` (after email verification - future feature)
- Deactivated user: `is_active=false` (future feature for account deactivation)

## Session/Token Entity (Conceptual)

**Entity Name**: Authentication Token
**Description**: Represents an active authentication session (managed through JWT tokens)

### Fields
- `token` (string): JWT token string (stored conceptually, not persisted)
- `user_id` (UUID/string): Reference to the user who owns this token
- `expires_at` (timestamp): Token expiration time
- `created_at` (timestamp): Token creation time
- `device_fingerprint` (string): Optional device identification
- `revoked` (boolean): Token revocation status

### Relationships
- Many-to-one with User (many tokens can be associated with one user)

### Validation Rules
- Token must be properly formatted JWT
- Token must not be expired
- Token must be associated with an active user
- Revoked tokens must not grant access

## Security Considerations

### Data Encryption
- Passwords must never be stored in plain text (enforced by hashing with bcrypt)
- Sensitive authentication data should be encrypted at rest
- Token-related information should be secured during transmission

### Indexing
- Email field should be indexed for fast lookup during authentication
- User ID should be indexed for foreign key relationships
- Created_at should be indexed for time-based queries

### Constraints
- Email uniqueness constraint to prevent duplicate registrations
- Foreign key constraints to maintain referential integrity
- Not-null constraints on required fields