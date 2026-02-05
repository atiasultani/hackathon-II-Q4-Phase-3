# Data Model: MCP Tools

## Task Entity

**Entity Name**: Task
**Description**: Represents a user's task with title, description, and completion status

### Fields
- `id` (UUID): Unique identifier for the task (primary key)
- `user_id` (UUID): Reference to the user who owns this task (foreign key to User)
- `title` (string): Task title (required, max 255 characters)
- `description` (string): Optional task description (nullable, max 1000 characters)
- `completed` (boolean): Completion status (default: false)
- `created_at` (timestamp): Creation timestamp (auto-generated)
- `updated_at` (timestamp): Last update timestamp (auto-generated)

### Relationships
- Many-to-one with User (many tasks belong to one user)
- User can have many tasks (one-to-many)

### Validation Rules
- Title must be provided and not exceed 255 characters
- User must exist and be authenticated to create/update tasks
- Users can only access their own tasks
- Completed status can be updated by the task owner only

### State Transitions
- New task: `completed=false`
- Completed task: `completed=true` (via complete_task MCP tool)
- Updated task: `updated_at` changes when modified

## User Entity (Referenced)

**Entity Name**: User
**Description**: Represents an authenticated user in the system

### Fields
- `id` (UUID): Unique identifier for the user (primary key)
- `email` (string): User's email address (unique, indexed)
- `username` (string): User's chosen username (optional, indexed)
- `hashed_password` (string): BCrypt hashed password
- `created_at` (timestamp): Account creation timestamp
- `updated_at` (timestamp): Last update timestamp
- `is_active` (boolean): Account active status
- `email_verified` (boolean): Email verification status
- `last_login_at` (timestamp): Last successful login timestamp
- `failed_login_attempts` (integer): Count of consecutive failed login attempts
- `locked_until` (timestamp): Time until account is locked

### Relationships
- One-to-many with Task (one user can have many tasks)
- One-to-many with Conversation (one user can have many conversations)
- One-to-many with Message (one user can have many messages)

### Validation Rules
- Email must be valid format and unique
- Password must meet strength requirements during registration
- All required fields are mandatory
- User must be active to authenticate

## Conversation Entity (Referenced)

**Entity Name**: Conversation
**Description**: Represents a chat conversation context

### Fields
- `id` (UUID): Unique identifier for the conversation (primary key)
- `user_id` (UUID): Reference to the user who owns this conversation (foreign key to User)
- `created_at` (timestamp): Creation timestamp (auto-generated)
- `updated_at` (timestamp): Last update timestamp (auto-generated)

### Relationships
- Many-to-one with User (many conversations belong to one user)
- One-to-many with Message (one conversation can have many messages)

### Validation Rules
- User must exist and be authenticated to create conversations
- Users can only access their own conversations

## Message Entity (Referenced)

**Entity Name**: Message
**Description**: Represents a message in a conversation

### Fields
- `id` (UUID): Unique identifier for the message (primary key)
- `user_id` (UUID): Reference to the user who sent this message (foreign key to User)
- `conversation_id` (UUID): Reference to the conversation this message belongs to (foreign key to Conversation)
- `role` (string): Role of the sender (user or assistant, max 20 characters)
- `content` (string): Message content (required)
- `created_at` (timestamp): Creation timestamp (auto-generated)

### Relationships
- Many-to-one with User (many messages belong to one user)
- Many-to-one with Conversation (many messages belong to one conversation)

### Validation Rules
- Role must be either 'user' or 'assistant'
- Content must be provided
- User must own the conversation to add messages

## Security Considerations

### Data Encryption
- Passwords must never be stored in plain text (enforced by hashing with bcrypt)
- Sensitive authentication data should be encrypted at rest
- Communication between services should be encrypted using TLS

### Indexing
- User ID should be indexed for foreign key relationships
- Created_at should be indexed for time-based queries
- Email field should be indexed for fast lookup during authentication

### Constraints
- Email uniqueness constraint to prevent duplicate registrations
- Foreign key constraints to maintain referential integrity
- Not-null constraints on required fields
- Check constraints to validate role values for messages