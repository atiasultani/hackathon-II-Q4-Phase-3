#!/bin/bash

# Script to create standard agent files in .claude/agents/{agent_name}/
# Usage: create-agent-files.sh <agent_name> <agent_type> <agent_description> [--overwrite]

set -e

# Get the parameters from command line arguments
AGENT_NAME="$1"
AGENT_TYPE="$2"
AGENT_DESCRIPTION="$3"
OVERWRITE_FLAG="$4"

# Check if required parameters are provided
if [ -z "$AGENT_NAME" ] || [ -z "$AGENT_TYPE" ] || [ -z "$AGENT_DESCRIPTION" ]; then
    echo "Error: agent_name, agent_type, and agent_description are required"
    echo "Usage: create-agent-files.sh <agent_name> <agent_type> <agent_description> [--overwrite]"
    exit 1
fi

# Define the agent directory path
AGENT_DIR=".claude/agents/$AGENT_NAME"

# Check if the agent directory exists
if [ ! -d "$AGENT_DIR" ]; then
    echo "Error: Agent directory $AGENT_DIR does not exist. Please create the agent first."
    exit 1
fi

# Define the file paths
PURPOSE_FILE="$AGENT_DIR/purpose.md"
RESPONSIBILITIES_FILE="$AGENT_DIR/responsibilities.md"
RULES_FILE="$AGENT_DIR/rules.md"
SKILLS_FILE="$AGENT_DIR/skills.md"
WORKFLOWS_FILE="$AGENT_DIR/workflows.md"

# Check if files already exist and handle overwrite
if [ -f "$PURPOSE_FILE" ] || [ -f "$RESPONSIBILITIES_FILE" ] || [ -f "$RULES_FILE" ] || [ -f "$SKILLS_FILE" ] || [ -f "$WORKFLOWS_FILE" ]; then
    if [ "$OVERWRITE_FLAG" != "--overwrite" ]; then
        echo "Files already exist. Use --overwrite flag to overwrite existing files."
        exit 1
    else
        echo "Overwriting existing files..."
    fi
fi

# Create purpose.md
cat > "$PURPOSE_FILE" << EOF
# Purpose

## Agent Type
$AGENT_TYPE

## Description
$AGENT_DESCRIPTION

## Primary Goals
- Clearly define the main objectives of this agent
- Outline what success looks like for this agent
- Identify the key value this agent provides

## Scope
- Define what is in scope for this agent
- Specify what is out of scope
- Identify boundaries and limitations
EOF

# Create responsibilities.md
cat > "$RESPONSIBILITIES_FILE" << EOF
# Responsibilities

## Core Responsibilities
- Define the primary duties of the $AGENT_NAME agent
- Outline the main tasks this agent is expected to perform
- Specify the expected outcomes for each responsibility

## Secondary Responsibilities
- List additional duties that support the primary responsibilities
- Detail any maintenance or monitoring tasks
- Include any reporting or communication duties

## Decision-Making Authority
- Specify what decisions this agent can make independently
- Identify decisions that require human approval
- Outline escalation procedures for complex issues

## Quality Standards
- Define the quality criteria for this agent's outputs
- Specify any metrics or measurements to track performance
- Include any compliance or regulatory requirements
EOF

# Create rules.md
cat > "$RULES_FILE" << EOF
# Rules and Constraints

## Operational Rules
- Rule 1: Define how the agent should handle incoming requests
- Rule 2: Specify the agent's response protocols
- Rule 3: Outline the agent's interaction patterns

## Safety Constraints
- Constraint 1: Define what the agent should never do
- Constraint 2: Specify any data privacy or security requirements
- Constraint 3: Outline ethical guidelines and limitations

## Error Handling
- Define how the agent should respond to invalid inputs
- Specify retry logic and failure handling procedures
- Outline graceful degradation procedures

## Communication Protocols
- Define how the agent communicates with other systems
- Specify the format and structure of outputs
- Outline any logging or monitoring requirements

## Performance Constraints
- Define any time limits for agent responses
- Specify resource usage limitations
- Outline any rate limiting or throttling requirements
EOF

# Create skills.md
cat > "$SKILLS_FILE" << EOF
# Skills and Capabilities

## Core Skills
- Skill 1: Description of the primary skill this agent possesses
- Skill 2: Description of the secondary skill
- Skill 3: Description of additional core capabilities

## Supported Operations
- Operation 1: What this operation does and when to use it
- Operation 2: Details about this specific operation
- Operation 3: Additional operations available to the agent

## Integration Capabilities
- List of systems or services this agent can interact with
- APIs or protocols the agent can use
- Data formats the agent can process

## Limitations
- What this agent cannot do
- Scenarios where human intervention is required
- Known constraints or performance limitations

## Dependencies
- External tools or services this agent relies on
- Required configurations or settings
- Any prerequisites for operation
EOF

# Create workflows.md
cat > "$WORKFLOWS_FILE" << EOF
# Workflows and Processes

## Primary Workflow
1. **Input Processing**: How the agent receives and validates input
2. **Analysis**: How the agent processes the input and makes decisions
3. **Action**: What the agent does based on its analysis
4. **Output**: How the agent delivers results or responses
5. **Logging**: How the agent records its actions for audit purposes

## Decision Flow
- Define the decision points in the agent's operation
- Outline the conditions that lead to different actions
- Specify fallback procedures for edge cases

## Error Workflow
1. **Error Detection**: How the agent identifies problems
2. **Error Classification**: How errors are categorized
3. **Response**: How the agent responds to different error types
4. **Escalation**: When and how issues are escalated to humans

## Quality Assurance
- Define checkpoints to ensure quality
- Outline validation procedures
- Specify how results are verified before delivery

## Monitoring and Maintenance
- How the agent's performance is tracked
- When and how the agent is updated
- Procedures for maintenance and optimization
EOF

echo "Standard agent files created successfully in: $AGENT_DIR"
echo "- $PURPOSE_FILE"
echo "- $RESPONSIBILITIES_FILE"
echo "- $RULES_FILE"
echo "- $SKILLS_FILE"
echo "- $WORKFLOWS_FILE"