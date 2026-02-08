# Create Agent Files Skill

This skill automatically generates standard required files for a new agent inside its folder.

## Purpose
This skill creates the standard required files for a new agent, including purpose, responsibilities, rules, skills, and workflows documentation with meaningful starter content.

## Files Generated
- `purpose.md`: Defines the agent's purpose and goals
- `responsibilities.md`: Details the agent's responsibilities
- `rules.md`: Lists rules and constraints for the agent
- `skills.md`: Documents skills available to the agent
- `workflows.md`: Describes agent workflows and processes

## Usage
```bash
create-agent-files.sh <agent_name> <agent_type> <agent_description> [--overwrite]
```

## Parameters
- `agent_name`: The name of the agent
- `agent_type`: The type of agent being created
- `agent_description`: A description of what the agent does
- `--overwrite`: (Optional) Flag to overwrite existing files

## Behavior
- Places files inside: `.claude/agents/{agent_name}/`
- Each file contains meaningful starter content
- Content clearly defines agent responsibilities
- Content is not empty templates
- Only overwrites existing files if explicitly requested with `--overwrite` flag

## Examples
```bash
# Create files for a new agent
create-agent-files.sh "code-review-agent" "AI Assistant" "Reviews code for quality and best practices"

# Overwrite existing files
create-agent-files.sh "code-review-agent" "AI Assistant" "Reviews code for quality and best practices" --overwrite
```

## Requirements
- The agent directory must exist (use create-agent-folder skill first)
- All three required parameters must be provided