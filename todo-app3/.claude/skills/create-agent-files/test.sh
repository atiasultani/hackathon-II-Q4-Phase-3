#!/bin/bash

# Test script for create-agent-files skill

echo "Testing create-agent-files skill..."

# Create a test agent directory
TEST_AGENT="test-agent-files"
mkdir -p ".claude/agents/$TEST_AGENT"

# Test 1: Create agent files
echo "Test 1: Creating agent files..."
result=$(./.claude/skills/create-agent-files/create-agent-files.sh "$TEST_AGENT" "Test Agent" "This is a test agent for verification purposes" 2>&1)
if [[ "$result" == *"Standard agent files created successfully"* ]]; then
    echo "✓ Test 1 passed: Agent files creation works"
else
    echo "✗ Test 1 failed: $result"
fi

# Verify that all files were created
if [[ -f ".claude/agents/$TEST_AGENT/purpose.md" ]] &&
   [[ -f ".claude/agents/$TEST_AGENT/responsibilities.md" ]] &&
   [[ -f ".claude/agents/$TEST_AGENT/rules.md" ]] &&
   [[ -f ".claude/agents/$TEST_AGENT/skills.md" ]] &&
   [[ -f ".claude/agents/$TEST_AGENT/workflows.md" ]]; then
    echo "✓ Test 1a: All required files were created"
else
    echo "✗ Test 1a: Some files are missing"
fi

# Test 2: Try to create files again without overwrite (should fail)
echo "Test 2: Testing duplicate prevention..."
result=$(./.claude/skills/create-agent-files/create-agent-files.sh "$TEST_AGENT" "Test Agent" "This is a test agent for verification purposes" 2>&1)
if [[ "$result" == *"Files already exist"* ]]; then
    echo "✓ Test 2 passed: Duplicate prevention works"
else
    echo "✗ Test 2 failed: $result"
fi

# Test 3: Try to create files again with overwrite flag
echo "Test 3: Testing overwrite functionality..."
result=$(./.claude/skills/create-agent-files/create-agent-files.sh "$TEST_AGENT" "Test Agent" "This is a test agent for verification purposes" "--overwrite" 2>&1)
if [[ "$result" == *"Overwriting existing files..."* ]]; then
    echo "✓ Test 3 passed: Overwrite functionality works"
else
    echo "✗ Test 3 failed: $result"
fi

# Test 4: Test with missing parameters
echo "Test 4: Testing missing parameters..."
result=$(./.claude/skills/create-agent-files/create-agent-files.sh 2>&1)
if [[ "$result" == *"Error: agent_name, agent_type, and agent_description are required"* ]]; then
    echo "✓ Test 4 passed: Parameter validation works"
else
    echo "✗ Test 4 failed: $result"
fi

# Test 5: Test with non-existent agent directory
echo "Test 5: Testing non-existent agent directory..."
result=$(./.claude/skills/create-agent-files/create-agent-files.sh "non-existent-agent" "Test Agent" "This is a test agent" 2>&1)
if [[ "$result" == *"Error: Agent directory"* && "$result" == *"does not exist"* ]]; then
    echo "✓ Test 5 passed: Directory validation works"
else
    echo "✗ Test 5 failed: $result"
fi

# Cleanup
rm -rf ".claude/agents/$TEST_AGENT"

echo "All tests completed!"