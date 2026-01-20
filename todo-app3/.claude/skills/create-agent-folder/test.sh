#!/bin/bash

# Test script for create-agent-folder skill

echo "Testing create-agent-folder skill..."

# Test 1: Create a new agent
echo "Test 1: Creating a new agent..."
result=$(./.claude/skills/create-agent-folder/create-agent-folder.sh "test-skill" 2>&1)
if [[ "$result" == *"Agent folder created successfully"* ]]; then
    echo "✓ Test 1 passed: New agent creation works"
else
    echo "✗ Test 1 failed: $result"
fi

# Test 2: Try to create the same agent again (should fail)
echo "Test 2: Creating duplicate agent..."
result=$(./.claude/skills/create-agent-folder/create-agent-folder.sh "test-skill" 2>&1)
if [[ "$result" == "Agent already exists" ]]; then
    echo "✓ Test 2 passed: Duplicate prevention works"
else
    echo "✗ Test 2 failed: $result"
fi

# Test 3: Test kebab-case conversion
echo "Test 3: Testing kebab-case conversion..."
result=$(./.claude/skills/create-agent-folder/create-agent-folder.sh "My Test Agent!" 2>&1)
if [[ "$result" == *"my-test-agent"* ]]; then
    echo "✓ Test 3 passed: Kebab-case conversion works"
else
    echo "✗ Test 3 failed: $result"
fi

# Cleanup
rm -rf .claude/agents/test-skill
rm -rf .claude/agents/my-test-agent

echo "All tests completed!"