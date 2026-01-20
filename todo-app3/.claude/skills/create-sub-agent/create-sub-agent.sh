#!/bin/bash

# Script to create a sub-agent under a parent agent
# Usage: create-sub-agent.sh <parent_agent> <sub_agent_name> <purpose>

set -e

# Get the parameters from command line arguments
PARENT_AGENT="$1"
SUB_AGENT_NAME="$2"
PURPOSE="$3"

# Check if required parameters are provided
if [ -z "$PARENT_AGENT" ] || [ -z "$SUB_AGENT_NAME" ] || [ -z "$PURPOSE" ]; then
    echo "Error: parent_agent, sub_agent_name, and purpose are required"
    echo "Usage: create-sub-agent.sh <parent_agent> <sub_agent_name> <purpose>"
    echo "Example: create-sub-agent.sh main-agent documentation-subagent \"Handles documentation tasks\""
    exit 1
fi

# Define the parent and sub-agent directory paths
PARENT_DIR=".claude/agents/$PARENT_AGENT"
SUB_AGENT_DIR="$PARENT_DIR/$SUB_AGENT_NAME"

# Check if the parent agent directory exists
if [ ! -d "$PARENT_DIR" ]; then
    echo "Error: Parent agent directory $PARENT_DIR does not exist."
    exit 1
fi

# Check if the sub-agent directory already exists
if [ -d "$SUB_AGENT_DIR" ]; then
    echo "Error: Sub-agent directory $SUB_AGENT_DIR already exists."
    exit 1
fi

# Create the sub-agent directory
mkdir -p "$SUB_AGENT_DIR"

# Create purpose.md
cat > "$SUB_AGENT_DIR/purpose.md" << EOF
# Purpose

## Agent Type
Sub-Agent

## Parent Agent
$PARENT_AGENT

## Description
$PURPOSE

## Relationship to Parent
This sub-agent operates under the $PARENT_AGENT and supports its functionality by handling specialized tasks.

## Primary Goals
- Support the $PARENT_AGENT in achieving its objectives
- Execute specialized tasks delegated by the parent agent
- Maintain alignment with the parent agent's goals and constraints
EOF

# Create responsibilities.md
cat > "$SUB_AGENT_DIR/responsibilities.md" << EOF
# Responsibilities

## Core Responsibilities
- Execute specialized tasks as directed by the parent agent ($PARENT_AGENT)
- Report status and results back to the parent agent
- Maintain operational integrity within the parent's domain

## Parent-Sub Coordination
- Follow directives from the $PARENT_AGENT
- Provide regular status updates when requested
- Escalate issues that require parent agent intervention

## Operational Boundaries
- Operate only within the scope defined by the parent agent
- Not make decisions beyond the authorized scope
- Request clarification when instructions are ambiguous

## Quality Standards
- Maintain consistency with the parent agent's standards
- Ensure outputs meet the parent agent's requirements
- Follow established protocols and procedures
EOF

# Create skills.md
cat > "$SUB_AGENT_DIR/skills.md" << EOF
# Skills and Capabilities

## Core Skills
- **Parent Communication**: Ability to receive instructions and report status to the $PARENT_AGENT
- **Task Execution**: Execute specialized tasks as defined in the purpose
- **Status Reporting**: Provide regular updates on task progress and completion

## Sub-Agent Specific Skills
- **Hierarchical Operation**: Function effectively within the agent hierarchy
- **Dependency Management**: Handle dependencies on parent agent resources
- **Scoped Decision Making**: Make decisions within authorized boundaries

## Capabilities Summary
The $SUB_AGENT_NAME sub-agent can:
- Receive and execute delegated tasks from $PARENT_AGENT
- Operate autonomously within defined parameters
- Communicate status and results to the parent

## Dependencies
- Relies on $PARENT_AGENT for task assignments and coordination
- Requires parent agent's resources and permissions to function
- May depend on parent agent's configuration and context
EOF

echo "Sub-agent $SUB_AGENT_NAME created successfully under parent agent $PARENT_AGENT"
echo "Sub-agent directory: $SUB_AGENT_DIR"
echo "Files created:"
echo "- $SUB_AGENT_DIR/purpose.md"
echo "- $SUB_AGENT_DIR/responsibilities.md"
echo "- $SUB_AGENT_DIR/skills.md"

# Update parent's configuration to acknowledge the sub-agent
PARENT_SUBS_FILE="$PARENT_DIR/sub-agents.md"
if [ ! -f "$PARENT_SUBS_FILE" ]; then
    cat > "$PARENT_SUBS_FILE" << EOF
# Sub-Agents

This file lists all sub-agents under the $PARENT_AGENT.

## Active Sub-Agents
EOF
fi

# Add the new sub-agent to the parent's sub-agents list
if ! grep -q "$SUB_AGENT_NAME" "$PARENT_SUBS_FILE"; then
    echo "" >> "$PARENT_SUBS_FILE"
    echo "- **$SUB_AGENT_NAME**: $PURPOSE (Created on $(date +%Y-%m-%d))" >> "$PARENT_SUBS_FILE"
    echo "Sub-agent registered in parent's sub-agents list: $PARENT_SUBS_FILE"
fi

echo "Sub-agent creation completed successfully!"