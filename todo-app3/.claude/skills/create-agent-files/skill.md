# Create Agent Files Skill

This skill automatically generates standard required files for a new agent inside its folder.

## Parameters
- `agent_name`: The name of the agent
- `agent_type`: The type of agent being created
- `agent_description`: A description of what the agent does

## Files Generated
- `purpose.md`: Defines the agent's purpose and goals
- `responsibilities.md`: Details the agent's responsibilities
- `rules.md`: Lists rules and constraints for the agent
- `skills.md`: Documents skills available to the agent
- `workflows.md`: Describes agent workflows and processes

## Behavior
- Places files inside: `.claude/agents/{agent_name}/`
- Each file contains meaningful starter content
- Content clearly defines agent responsibilities
- Content is not empty templates
- Only overwrites existing files if explicitly requested