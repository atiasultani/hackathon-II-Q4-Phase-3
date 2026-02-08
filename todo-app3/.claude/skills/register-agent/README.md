# Register Agent Skill

This skill ensures newly created agents become officially part of the system registry.

## Purpose
This skill registers an agent in the global registry file, making it officially recognized by the system.

## Usage
```bash
register-agent.sh <agent_name> <agent_role>
```

## Parameters
- `agent_name`: The name of the agent to register
- `agent_role`: The role of the agent (primary, sub, or meta)

## Behavior
- Updates the global registry file: `.claude/agents/registry.md`
- Appends agent entry with:
  - Name
  - Purpose (extracted from the agent's purpose.md file)
  - Type (primary/sub/meta)
  - Date (current date)
- Avoids duplicates
- Returns success response

## Examples
```bash
# Register an agent as primary
register-agent.sh "code-review-agent" "primary"

# Register an agent as sub
register-agent.sh "documentation-agent" "sub"

# Register an agent as meta
register-agent.sh "orchestration-agent" "meta"
```

## Requirements
- The agent directory must exist
- The agent's purpose.md file must exist (use create-agent-files skill first)
- Both required parameters must be provided
- Agent role must be one of: primary, sub, meta

## Output
The skill updates the registry.md file with a new entry in the format:
| Name | Purpose | Type | Registration Date |