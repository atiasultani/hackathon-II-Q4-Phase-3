# Data Model: AI Animated Frontend

## Entity: Animation State
Represents the current visual state of animated elements, including AI avatar expressions and skill indicators

### Fields:
- `id`: String - Unique identifier for the animation state
- `avatarExpression`: String - Current expression/state of the AI avatar (e.g., "listening", "processing", "thinking", "happy", "neutral")
- `animationSequence`: Array[String] - Sequence of animation frames/steps to play
- `isActive`: Boolean - Whether the animation is currently active
- `timestamp`: DateTime - When this state was last updated
- `triggerEvent`: String - What triggered this animation state (e.g., "userMessageSent", "aiProcessing", "responseReceived")
- `duration`: Number - Duration of the animation in milliseconds
- `intensity`: Number - Animation intensity level (0-10 scale)

### Relationships:
- Belongs to a specific user session
- Associated with a conversation context

### Validation Rules:
- `avatarExpression` must be one of predefined values
- `duration` must be between 100ms and 5000ms
- `intensity` must be between 0 and 10

## Entity: Agent Activity
Tracks which AI agents/skills are currently active and their processing status

### Fields:
- `id`: String - Unique identifier for the agent activity record
- `agentName`: String - Name of the active agent/skill (e.g., "AddTaskSkill", "ListTasksAgent")
- `status`: String - Current status ("idle", "activating", "active", "deactivating", "error")
- `startTime`: DateTime - When the agent was activated
- `endTime`: DateTime - When the agent completed (null if still active)
- `visualIndicator`: String - Type of visual indicator to show (e.g., "badge", "progressBar", "icon")
- `priority`: Number - Priority level affecting visual prominence (1-5)
- `conversationId`: String - Associated conversation context

### Relationships:
- Associated with a specific conversation
- May trigger multiple Animation State records

### Validation Rules:
- `status` must be one of predefined values
- `priority` must be between 1 and 5
- `startTime` must be before `endTime` if endTime is set

## Entity: User Preference
Stores user customization settings for animations and visual effects

### Fields:
- `id`: String - Unique identifier for the user preference record
- `userId`: String - Reference to the user
- `animationsEnabled`: Boolean - Whether animations are enabled
- `animationSpeed`: Number - Speed multiplier for animations (0.5 to 2.0)
- `motionSensitivity`: String - Motion sensitivity level ("low", "medium", "high")
- `colorTheme`: String - Preferred color scheme for indicators
- `avatarStyle`: String - Preferred avatar appearance/style
- `lastUpdated`: DateTime - When preferences were last changed

### Relationships:
- Belongs to a specific user

### Validation Rules:
- `animationSpeed` must be between 0.5 and 2.0
- `motionSensitivity` must be one of predefined values
- `userId` must reference an existing user

## State Transitions

### Animation State Transitions:
- idle → listening (when user starts typing)
- listening → processing (when user sends message)
- processing → thinking (during AI processing)
- thinking → responding (when AI response begins)
- responding → neutral (when response complete)
- any state → error (on processing error)

### Agent Activity Transitions:
- idle → activating (when skill is triggered)
- activating → active (when skill begins processing)
- active → deactivating (when skill completes)
- deactivating → idle (when transition complete)
- active → error (on processing error)