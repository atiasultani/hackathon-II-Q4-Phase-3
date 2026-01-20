# Create Sub-Agent Skill

This skill creates a dependent sub-agent under a parent agent.

## Purpose
This skill creates a hierarchical sub-agent that operates under a parent agent, with proper folder structure and documentation.

## Usage
```bash
create-sub-agent.sh <parent_agent> <sub_agent_name> <purpose>
```

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

## Examples
```bash
# Create a documentation sub-agent under the main agent
create-sub-agent.sh "main-agent" "doc-sub" "Handles documentation generation tasks"

# Create a testing sub-agent under the development agent
create-sub-agent.sh "dev-agent" "test-sub" "Performs automated testing tasks"
```

## Requirements
- The parent agent directory must exist
- All three required parameters must be provided
- Sub-agent directory must not already exist

## Output
The skill creates:
1. A sub-directory under the parent agent
2. Standard agent files (purpose.md, responsibilities.md, skills.md)
3. Updates the parent's sub-agents list to acknowledge the new sub-agent