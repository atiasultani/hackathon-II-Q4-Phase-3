# Assign Agent Skills Skill

This skill attaches relevant skills to a newly created agent and defines what it can and cannot do.

## Purpose
This skill updates an agent's skills.md file with a specified list of skills, categorizing them as primary or extended skills, and clearly defining the agent's capabilities and limitations.

## Usage
```bash
assign-agent-skills.sh <agent_name> <list_of_skills>
```

## Parameters
- `agent_name`: The name of the agent
- `list_of_skills`: A comma-separated list of skills to assign to the agent

## Behavior
- Writes inside skills.md for that agent
- Clearly categorizes skills as:
  - Primary Skills (first half of the skills list)
  - Optional/Extended Skills (remaining skills)
- Ensures formatting is professional
- Confirms completion with a summary

## Examples
```bash
# Assign skills to an agent
assign-agent-skills.sh "code-review-agent" "code-review,documentation,testing"

# Assign multiple skills to an agent
assign-agent-skills.sh "documentation-agent" "documentation,editing,formatting,review"
```

## Requirements
- The agent directory must exist
- The skills.md file must exist in the agent directory (use create-agent-files skill first)
- Both required parameters must be provided

## Output
The skill updates the agent's skills.md file with:
1. Primary skills section
2. Optional/Extended skills section
3. Capabilities summary
4. Limitations section
5. Dependencies information