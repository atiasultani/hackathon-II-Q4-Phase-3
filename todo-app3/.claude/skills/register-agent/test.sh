#!/bin/bash

# Test script for register-agent skill

echo "Testing register-agent skill..."

# Create a test agent with purpose file
TEST_AGENT="test-register-agent"
mkdir -p ".claude/agents/$TEST_AGENT"
cat > ".claude/agents/$TEST_AGENT/purpose.md" << EOF
# Purpose

## Agent Type
Test Agent

## Description
This is a test agent for verification purposes

## Primary Goals
- Test registration functionality
- Verify registry updates work correctly
EOF

# Clean up any existing registry file for testing
rm -f ".claude/agents/registry.md"

# Test 1: Register an agent
echo "Test 1: Registering an agent..."
result=$(./.claude/skills/register-agent/register-agent.sh "$TEST_AGENT" "primary" 2>&1)
if [[ "$result" == *"Agent $TEST_AGENT successfully registered"* ]]; then
    echo "✓ Test 1 passed: Agent registration works"
else
    echo "✗ Test 1 failed: $result"
fi

# Verify that the registry file was created and contains the agent
if [[ -f ".claude/agents/registry.md" ]] && grep -q "$TEST_AGENT" ".claude/agents/registry.md"; then
    echo "✓ Test 1a: Registry file was created and contains the agent"
else
    echo "✗ Test 1a: Registry file was not properly created or agent not found"
fi

# Test 2: Try to register the same agent again (should fail due to duplicates)
echo "Test 2: Testing duplicate prevention..."
result=$(./.claude/skills/register-agent/register-agent.sh "$TEST_AGENT" "primary" 2>&1)
if [[ "$result" == *"Agent $TEST_AGENT is already registered"* ]]; then
    echo "✓ Test 2 passed: Duplicate prevention works"
else
    echo "✗ Test 2 failed: $result"
fi

# Test 3: Try to register with invalid agent role
echo "Test 3: Testing invalid agent role..."
result=$(./.claude/skills/register-agent/register-agent.sh "$TEST_AGENT" "invalid" 2>&1)
if [[ "$result" == *"Error: agent_role must be one of: primary, sub, meta"* ]]; then
    echo "✓ Test 3 passed: Agent role validation works"
else
    echo "✗ Test 3 failed: $result"
fi

# Test 4: Try to register non-existent agent directory
echo "Test 4: Testing non-existent agent directory..."
result=$(./.claude/skills/register-agent/register-agent.sh "non-existent-agent" "primary" 2>&1)
if [[ "$result" == *"Error: Agent directory"* && "$result" == *"does not exist"* ]]; then
    echo "✓ Test 4 passed: Directory validation works"
else
    echo "✗ Test 4 failed: $result"
fi

# Test 5: Try to register agent without purpose file
mkdir -p ".claude/agents/no-purpose-agent"
echo "Test 5: Testing missing purpose file..."
result=$(./.claude/skills/register-agent/register-agent.sh "no-purpose-agent" "primary" 2>&1)
if [[ "$result" == *"Error: Purpose file"* && "$result" == *"does not exist"* ]]; then
    echo "✓ Test 5 passed: Purpose file validation works"
else
    echo "✗ Test 5 failed: $result"
fi

# Test 6: Test with missing parameters
echo "Test 6: Testing missing parameters..."
result=$(./.claude/skills/register-agent/register-agent.sh 2>&1)
if [[ "$result" == *"Error: agent_name and agent_role are required"* ]]; then
    echo "✓ Test 6 passed: Parameter validation works"
else
    echo "✗ Test 6 failed: $result"
fi

# Test 7: Register multiple agents with different roles
TEST_AGENT2="test-register-agent2"
mkdir -p ".claude/agents/$TEST_AGENT2"
cat > ".claude/agents/$TEST_AGENT2/purpose.md" << EOF
# Purpose

## Description
Another test agent
EOF

echo "Test 7: Registering agents with different roles..."
result=$(./.claude/skills/register-agent/register-agent.sh "$TEST_AGENT2" "sub" 2>&1)
if [[ "$result" == *"Agent $TEST_AGENT2 successfully registered"* ]]; then
    echo "✓ Test 7 passed: Registering agent with 'sub' role works"
else
    echo "✗ Test 7 failed: $result"
fi

# Verify both agents are in the registry
if grep -q "$TEST_AGENT" ".claude/agents/registry.md" && grep -q "$TEST_AGENT2" ".claude/agents/registry.md"; then
    echo "✓ Test 7a: Both agents are in the registry"
else
    echo "✗ Test 7a: Not all agents found in registry"
fi

# Cleanup
rm -rf ".claude/agents/$TEST_AGENT"
rm -rf ".claude/agents/$TEST_AGENT2"
rm -rf ".claude/agents/no-purpose-agent"
rm -f ".claude/agents/registry.md"

echo "All tests completed!"