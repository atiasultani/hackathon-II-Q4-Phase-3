# Register Agent Skill

This skill ensures newly created agents become officially part of the system registry.

## Parameters
- `agent_name`: The name of the agent to register
- `agent_role`: The role of the agent (e.g., primary, sub, meta)

## Behavior
- Updates the global registry file: `.claude/agents/registry.md`
- Appends agent entry with:
  - Name
  - Purpose
  - Type (primary/sub/meta)
  - Date
- Avoids duplicates
- Returns success response