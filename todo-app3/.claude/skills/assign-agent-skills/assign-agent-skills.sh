#!/bin/bash

# Script to assign skills to an agent and update its skills.md file
# Usage: assign-agent-skills.sh <agent_name> <list_of_skills>

set -e

# Get the parameters from command line arguments
AGENT_NAME="$1"
LIST_OF_SKILLS="$2"

# Check if required parameters are provided
if [ -z "$AGENT_NAME" ] || [ -z "$LIST_OF_SKILLS" ]; then
    echo "Error: agent_name and list_of_skills are required"
    echo "Usage: assign-agent-skills.sh <agent_name> <list_of_skills>"
    echo "Example: assign-agent-skills.sh my-agent \"skill1,skill2,skill3\""
    exit 1
fi

# Define the agent directory path and skills file
AGENT_DIR=".claude/agents/$AGENT_NAME"
SKILLS_FILE="$AGENT_DIR/skills.md"

# Check if the agent directory exists
if [ ! -d "$AGENT_DIR" ]; then
    echo "Error: Agent directory $AGENT_DIR does not exist."
    exit 1
fi

# Check if the skills.md file exists
if [ ! -f "$SKILLS_FILE" ]; then
    echo "Error: Skills file $SKILLS_FILE does not exist. Please create the agent files first."
    exit 1
fi

# Parse the list of skills
IFS=',' read -ra SKILL_ARRAY <<< "$LIST_OF_SKILLS"

# Create a temporary file for the new content
TEMP_FILE=$(mktemp)

# Write the header for the skills file
cat > "$TEMP_FILE" << EOF
# Skills and Capabilities

## Core Skills
EOF

# Add primary skills (first half of the skills)
PRIMARY_COUNT=$(( (${#SKILL_ARRAY[@]} + 1) / 2 ))

for i in $(seq 0 $((PRIMARY_COUNT - 1))); do
    if [ $i -lt ${#SKILL_ARRAY[@]} ]; then
        SKILL=$(echo "${SKILL_ARRAY[$i]}" | xargs)  # trim whitespace
        cat >> "$TEMP_FILE" << EOF

- **${SKILL^}**: Primary skill that enables the ${AGENT_NAME} agent to perform essential functions. This skill is critical to the agent's core functionality.
EOF
    fi
done

# Add optional/extended skills (remaining skills)
if [ $PRIMARY_COUNT -lt ${#SKILL_ARRAY[@]} ]; then
    cat >> "$TEMP_FILE" << EOF

## Optional/Extended Skills
EOF

    for i in $(seq $PRIMARY_COUNT $((${#SKILL_ARRAY[@]} - 1))); do
        if [ $i -lt ${#SKILL_ARRAY[@]} ]; then
            SKILL=$(echo "${SKILL_ARRAY[$i]}" | xargs)  # trim whitespace
            cat >> "$TEMP_FILE" << EOF

- **${SKILL^}**: Extended capability that enhances the agent's functionality in specific scenarios. This skill is available when needed but not essential for core operations.
EOF
        fi
    done
fi

# Add capabilities and limitations section
cat >> "$TEMP_FILE" << EOF

## Capabilities Summary
The ${AGENT_NAME} agent can perform the following functions based on its assigned skills:
EOF

for i in "${!SKILL_ARRAY[@]}"; do
    SKILL=$(echo "${SKILL_ARRAY[$i]}" | xargs)  # trim whitespace
    cat >> "$TEMP_FILE" << EOF

- **${SKILL^}**: Enables the agent to perform specific tasks related to ${SKILL}.
EOF
done

cat >> "$TEMP_FILE" << EOF

## Limitations
The following functions are outside the scope of the ${AGENT_NAME} agent's assigned skills:
EOF

# Generate some common limitations based on the skills provided
for i in "${!SKILL_ARRAY[@]}"; do
    SKILL=$(echo "${SKILL_ARRAY[$i]}" | xargs)  # trim whitespace
    # For each skill, we'll note the opposite or related limitations
    case "$SKILL" in
        "code-review")
            cat >> "$TEMP_FILE" << EOF

- **Deployment**: The agent can review code but cannot deploy it directly to production environments.
EOF
            ;;
        "documentation")
            cat >> "$TEMP_FILE" << EOF

- **Code Execution**: The agent can create documentation but cannot execute or modify code directly.
EOF
            ;;
        "testing")
            cat >> "$TEMP_FILE" << EOF

- **Production Changes**: The agent can run tests but cannot make changes to production systems.
EOF
            ;;
        *)
            cat >> "$TEMP_FILE" << EOF

- **${SKILL^} Limitation**: The agent's ${SKILL} capabilities are limited to predefined parameters and cannot operate outside established guidelines.
EOF
            ;;
    esac
done

cat >> "$TEMP_FILE" << EOF

## Dependencies
- The agent relies on external tools and services to execute its assigned skills
- Proper configuration and permissions are required for each skill to function correctly
- Some skills may require human approval before execution
EOF

# Replace the original skills.md file with the new content
mv "$TEMP_FILE" "$SKILLS_FILE"

echo "Skills successfully assigned to agent: $AGENT_NAME"
echo "Skills assigned: $LIST_OF_SKILLS"
echo "Updated file: $SKILLS_FILE"