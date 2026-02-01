# Create Agent Folder Skill

This skill creates a new agent directory in the `.claude/agents` folder with the given agent name. It ensures no duplicate folder exists and follows clean naming conventions.

## Purpose
This skill creates a new agent directory in the `.claude/agents` folder with the given agent name. It ensures no duplicate folder exists and follows clean naming conventions.

## Usage
```bash
create-agent-folder.sh <agent_name>
```

## Behavior
- Creates folder path: `.claude/agents/{agent_name}`
- If folder already exists → returns "Agent already exists"
- Ensures lowercase, kebab-case naming (converts spaces and special characters to hyphens)
- Returns confirmation with created path
- Never creates unsafe paths

## Examples
```bash
# Creates .claude/agents/my-agent
create-agent-folder.sh "my-agent"

# Creates .claude/agents/my-agent (converting spaces to hyphens)
create-agent-folder.sh "My Agent"

# Creates .claude/agents/my-agent (converting special characters)
create-agent-folder.sh "My_Agent!"
```

## Requirements
- The script requires a single argument: `agent_name`
- The `.claude/agents` directory must exist