# Data Model: AI Todo Chatbot Agent Behavior

## User Intent Entity

**Entity Name**: User Intent
**Description**: Represents the underlying action or request the user is making through their natural language input

### Fields
- `intent_type` (string): The type of intent (ADD, LIST, COMPLETE, DELETE, UPDATE)
- `confidence_score` (float): Confidence level in intent detection (0.0-1.0)
- `extracted_entities` (JSON): Structured data extracted from natural language (task titles, dates, times, etc.)
- `raw_input` (string): Original user input for reference
- `processed_at` (timestamp): When the intent was processed

### Relationships
- One-to-many with Agent Responses (an intent may trigger multiple responses)
- One-to-one with Conversation Context (intent processed within specific context)

### Validation Rules
- `intent_type` must be one of the recognized values (ADD, LIST, COMPLETE, DELETE, UPDATE)
- `confidence_score` must be between 0.0 and 1.0
- `raw_input` must not exceed 1000 characters
- `extracted_entities` must conform to expected schema for the intent type

### State Transitions
- New Intent: `confidence_score` set during processing
- Processed Intent: Associated with MCP tool call and response

## Conversation Context Entity

**Entity Name**: Conversation Context
**Description**: The ongoing context of the conversation that helps interpret subsequent user inputs and maintains continuity

### Fields
- `conversation_id` (UUID): Unique identifier for the conversation
- `user_id` (UUID): Reference to the user who owns this conversation
- `context_data` (JSON): Serialized conversation context including history and state
- `last_activity_at` (timestamp): Timestamp of the most recent activity
- `context_size` (integer): Number of exchanges in the context window
- `active_references` (JSON): Currently active task references and contextual information

### Relationships
- Many-to-one with User (many conversations belong to one user)
- One-to-many with Messages (conversation contains multiple messages)
- One-to-many with User Intents (multiple intents processed within context)

### Validation Rules
- `context_size` must not exceed maximum allowed window size (e.g., 20 exchanges)
- `user_id` must reference a valid user
- `context_data` must be properly formatted JSON
- `conversation_id` must be unique per user

### State Transitions
- New Conversation: Context initialized with empty state
- Active Conversation: Context grows as messages are exchanged
- Archived Conversation: Context frozen after period of inactivity

## Task Reference Entity

**Entity Name**: Task Reference
**Description**: Mechanisms to identify specific tasks (titles, positions, partial matches, IDs, contextual references)

### Fields
- `reference_type` (string): Type of reference (TITLE, POSITION, PARTIAL_MATCH, ID, CONTEXTUAL)
- `reference_value` (string): Value of the reference (actual title, position number, etc.)
- `resolved_task_id` (UUID): ID of the task this reference resolves to (nullable until resolved)
- `resolution_confidence` (float): Confidence in the resolution (0.0-1.0)
- `conversation_id` (UUID): Conversation where this reference was made
- `created_at` (timestamp): When the reference was created

### Relationships
- Many-to-one with Conversation Context (references belong to specific conversations)
- Many-to-one with Task (when reference resolves to a specific task)
- One-to-many with Agent Responses (responses may involve multiple references)

### Validation Rules
- `reference_type` must be one of the recognized values
- `resolution_confidence` must be between 0.0 and 1.0
- `resolved_task_id` must reference a valid task when not null
- `conversation_id` must reference a valid conversation

### State Transitions
- Unresolved Reference: Created when user makes ambiguous reference
- Resolved Reference: Linked to specific task after disambiguation

## Agent Response Entity

**Entity Name**: Agent Response
**Description**: Structured responses that confirm actions, ask for clarification, or provide helpful information

### Fields
- `id` (UUID): Unique identifier for the response
- `conversation_id` (UUID): Conversation this response belongs to
- `response_type` (string): Type of response (CONFIRMATION, CLARIFICATION, INFORMATION, ERROR)
- `content` (text): The actual response content
- `triggering_intent` (string): Intent that triggered this response
- `sentiment_score` (float): Sentiment analysis score (-1.0 to 1.0)
- `created_at` (timestamp): When the response was generated

### Relationships
- Many-to-one with Conversation Context (responses belong to specific conversations)
- One-to-many with User Intents (responses may address multiple intents)
- Many-to-one with Task (when response relates to specific task)

### Validation Rules
- `response_type` must be one of the recognized values
- `sentiment_score` must be between -1.0 and 1.0
- `content` must not exceed 1000 characters
- `conversation_id` must reference a valid conversation

### State Transitions
- Pending Response: Created after intent processing
- Sent Response: Delivered to user
- Acknowledged Response: Confirmed by user interaction (if applicable)

## Conversation History Entity (Conceptual)

**Entity Name**: Conversation History
**Description**: Chronological collection of user and assistant messages used to maintain context across exchanges

### Fields
- `id` (UUID): Unique identifier for the history record
- `conversation_id` (UUID): Reference to the conversation
- `message_type` (string): Type of message (USER_INPUT, AGENT_RESPONSE)
- `content` (text): The message content
- `timestamp` (datetime): When the message was created
- `sequence_number` (integer): Order of the message in the conversation
- `is_active` (boolean): Whether this message is part of current context window

### Relationships
- Many-to-one with Conversation Context (history records belong to specific conversations)
- Many-to-one with User Intent (user messages may relate to intents)
- Many-to-one with Agent Response (assistant messages are responses)

### Validation Rules
- `message_type` must be either USER_INPUT or AGENT_RESPONSE
- `content` must not exceed 1000 characters
- `sequence_number` must be unique within conversation
- `conversation_id` must reference a valid conversation

### State Transitions
- Active Record: Part of current conversation context
- Archived Record: Moved out of active context window but retained for history

## Security Considerations

### Data Encryption
- Conversation context and history should be encrypted at rest
- Sensitive user information should be sanitized before storage
- Authentication tokens should not be stored in conversation data

### Access Control
- All entities must enforce user ownership validation
- Cross-user access must be prevented at the database level
- Conversation history must be isolated by user ID

### Indexing
- `conversation_id` should be indexed for fast retrieval
- `user_id` should be indexed for ownership validation
- `timestamp` should be indexed for chronological queries
- `intent_type` should be indexed for analytics

### Constraints
- Foreign key constraints to maintain referential integrity
- Not-null constraints on required fields
- Unique constraints on conversation/user combinations
- Size limits on text fields to prevent abuse