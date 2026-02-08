#!/bin/bash

# Script to register an agent in the global registry
# Usage: register-agent.sh <agent_name> <agent_role>

set -e

# Get the parameters from command line arguments
AGENT_NAME="$1"
AGENT_ROLE="$2"

# Check if required parameters are provided
if [ -z "$AGENT_NAME" ] || [ -z "$AGENT_ROLE" ]; then
    echo "Error: agent_name and agent_role are required"
    echo "Usage: register-agent.sh <agent_name> <agent_role>"
    echo "Example: register-agent.sh my-agent primary"
    exit 1
fi

# Validate agent role
if [[ "$AGENT_ROLE" != "primary" && "$AGENT_ROLE" != "sub" && "$AGENT_ROLE" != "meta" ]]; then
    echo "Error: agent_role must be one of: primary, sub, meta"
    exit 1
fi

# Define the agent directory and registry file
AGENT_DIR=".claude/agents/$AGENT_NAME"
REGISTRY_FILE=".claude/agents/registry.md"

# Check if the agent directory exists
if [ ! -d "$AGENT_DIR" ]; then
    echo "Error: Agent directory $AGENT_DIR does not exist."
    exit 1
fi

# Check if the agent's purpose.md file exists to get the purpose
PURPOSE_FILE="$AGENT_DIR/purpose.md"
if [ ! -f "$PURPOSE_FILE" ]; then
    echo "Error: Purpose file $PURPOSE_FILE does not exist. Please create agent files first."
    exit 1
fi

# Extract the purpose from the purpose.md file
AGENT_PURPOSE="No purpose defined"
if [ -f "$PURPOSE_FILE" ]; then
    # Try to get the description from the purpose file
    PURPOSE_CONTENT=$(grep -A 5 "## Description" "$PURPOSE_FILE" | grep -v "## Description" | head -n 1 | xargs)
    if [ -n "$PURPOSE_CONTENT" ] && [ "$PURPOSE_CONTENT" != "## Primary Goals" ]; then
        AGENT_PURPOSE="$PURPOSE_CONTENT"
    else
        # If description is not found, use the first non-header line
        AGENT_PURPOSE=$(grep -v "^#" "$PURPOSE_FILE" | grep -v "^[[:space:]]*$" | head -n 1 | xargs)
        if [ -z "$AGENT_PURPOSE" ]; then
            AGENT_PURPOSE="No purpose defined"
        fi
    fi
fi

# Create the agents directory if it doesn't exist
mkdir -p ".claude/agents"

# Create the registry file if it doesn't exist with a header
if [ ! -f "$REGISTRY_FILE" ]; then
    cat > "$REGISTRY_FILE" << EOF
# Agent Registry

This registry contains all officially registered agents in the system.

| Name | Purpose | Type | Registration Date |
|------|---------|------|-------------------|
EOF
fi

# Check if the agent is already registered
if grep -q "^| $AGENT_NAME |" "$REGISTRY_FILE"; then
    echo "Agent $AGENT_NAME is already registered in the registry."
    exit 1
fi

# Get current date in YYYY-MM-DD format
CURRENT_DATE=$(date +%Y-%m-%d)

# Append the agent entry to the registry file
# Format: | Name | Purpose | Type | Date |
sed -i.bak "/^|------|---------|------|-------------------|/a\\
| $AGENT_NAME | $AGENT_PURPOSE | $AGENT_ROLE | $CURRENT_DATE |" "$REGISTRY_FILE" && rm -f "$REGISTRY_FILE.bak"

# Alternative approach if the sed command above doesn't work as expected
if [ $? -ne 0 ]; then
    # If the sed command failed, append to the end of the file
    echo "| $AGENT_NAME | $AGENT_PURPOSE | $AGENT_ROLE | $CURRENT_DATE |" >> "$REGISTRY_FILE"
fi

echo "Agent $AGENT_NAME successfully registered in the registry."
echo "Registry file updated: $REGISTRY_FILE"