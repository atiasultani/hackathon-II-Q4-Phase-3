#!/bin/bash

# Script to create a new agent directory in .claude/agents
# Usage: create-agent-folder.sh <agent_name>

set -e

# Get the agent name from command line argument
AGENT_NAME="$1"

# Check if agent name is provided
if [ -z "$AGENT_NAME" ]; then
    echo "Error: Agent name is required"
    exit 1
fi

# Convert to lowercase and kebab-case
AGENT_NAME=$(echo "$AGENT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')

# Define the agent directory path
AGENT_DIR=".claude/agents/$AGENT_NAME"

# Check if the directory already exists
if [ -d "$AGENT_DIR" ]; then
    echo "Agent already exists"
    exit 0
fi

# Create the agent directory
mkdir -p "$AGENT_DIR"

# Return confirmation with created path
echo "Agent folder created successfully at: $AGENT_DIR"