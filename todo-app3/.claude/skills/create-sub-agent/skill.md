# Create Sub-Agent Skill

This skill creates a dependent sub-agent under a parent agent.

## Parameters
- `parent_agent`: The name of the parent agent
- `sub_agent_name`: The name of the sub-agent to create
- `purpose`: The purpose of the sub-agent

## Behavior
- Creates folder: `.claude/agents/{parent}/{sub-agent}`
- Generates:
  - purpose.md
  - responsibilities.md
  - skills.md
- Links sub-agent to parent intelligently
- Registers it as a hierarchical agent