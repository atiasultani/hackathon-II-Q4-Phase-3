# Create Agent Folder Skill

This skill creates a new agent directory in the `.claude/agents` folder with the given agent name. It ensures no duplicate folder exists and follows clean naming conventions.

## Parameters
- `agent_name`: The name of the agent to create

## Behavior
- Creates folder path: `.claude/agents/{agent_name}`
- If folder already exists → returns "Agent already exists"
- Ensures lowercase, kebab-case naming
- Returns confirmation with created path
- Never creates unsafe paths