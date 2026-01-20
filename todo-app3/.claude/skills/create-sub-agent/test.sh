#!/bin/bash

# Test script for create-sub-agent skill

echo "Testing create-sub-agent skill..."

# Create a test parent agent directory
TEST_PARENT="test-parent-agent"
mkdir -p ".claude/agents/$TEST_PARENT"

# Test 1: Create a sub-agent
echo "Test 1: Creating a sub-agent..."
result=$(./.claude/skills/create-sub-agent/create-sub-agent.sh "$TEST_PARENT" "test-sub-agent" "Handles testing tasks for the parent agent" 2>&1)
if [[ "$result" == *"Sub-agent test-sub-agent created successfully"* ]]; then
    echo "✓ Test 1 passed: Sub-agent creation works"
else
    echo "✗ Test 1 failed: $result"
fi

# Verify that the sub-agent directory and files were created
SUB_AGENT_DIR=".claude/agents/$TEST_PARENT/test-sub-agent"
if [[ -d "$SUB_AGENT_DIR" ]] &&
   [[ -f "$SUB_AGENT_DIR/purpose.md" ]] &&
   [[ -f "$SUB_AGENT_DIR/responsibilities.md" ]] &&
   [[ -f "$SUB_AGENT_DIR/skills.md" ]]; then
    echo "✓ Test 1a: Sub-agent directory and files were created"
else
    echo "✗ Test 1a: Sub-agent directory or files are missing"
fi

# Verify that the parent's sub-agents file was updated
if [[ -f ".claude/agents/$TEST_PARENT/sub-agents.md" ]] && grep -q "test-sub-agent" ".claude/agents/$TEST_PARENT/sub-agents.md"; then
    echo "✓ Test 1b: Parent's sub-agents file was updated"
else
    echo "✗ Test 1b: Parent's sub-agents file was not updated"
fi

# Test 2: Try to create the same sub-agent again (should fail)
echo "Test 2: Testing duplicate sub-agent prevention..."
result=$(./.claude/skills/create-sub-agent/create-sub-agent.sh "$TEST_PARENT" "test-sub-agent" "Handles testing tasks" 2>&1)
if [[ "$result" == *"Error: Sub-agent directory"* && "$result" == *"already exists"* ]]; then
    echo "✓ Test 2 passed: Duplicate prevention works"
else
    echo "✗ Test 2 failed: $result"
fi

# Test 3: Try to create sub-agent with non-existent parent
echo "Test 3: Testing non-existent parent agent..."
result=$(./.claude/skills/create-sub-agent/create-sub-agent.sh "non-existent-parent" "test-sub" "Test purpose" 2>&1)
if [[ "$result" == *"Error: Parent agent directory"* && "$result" == *"does not exist"* ]]; then
    echo "✓ Test 3 passed: Parent validation works"
else
    echo "✗ Test 3 failed: $result"
fi

# Test 4: Test with missing parameters
echo "Test 4: Testing missing parameters..."
result=$(./.claude/skills/create-sub-agent/create-sub-agent.sh 2>&1)
if [[ "$result" == *"Error: parent_agent, sub_agent_name, and purpose are required"* ]]; then
    echo "✓ Test 4 passed: Parameter validation works"
else
    echo "✗ Test 4 failed: $result"
fi

# Test 5: Create another sub-agent under the same parent
echo "Test 5: Creating another sub-agent under same parent..."
result=$(./.claude/skills/create-sub-agent/create-sub-agent.sh "$TEST_PARENT" "second-sub-agent" "Handles secondary tasks" 2>&1)
if [[ "$result" == *"Sub-agent second-sub-agent created successfully"* ]]; then
    echo "✓ Test 5 passed: Multiple sub-agents work"
else
    echo "✗ Test 5 failed: $result"
fi

# Verify that both sub-agents are listed in the parent's sub-agents file
if grep -q "test-sub-agent" ".claude/agents/$TEST_PARENT/sub-agents.md" && grep -q "second-sub-agent" ".claude/agents/$TEST_PARENT/sub-agents.md"; then
    echo "✓ Test 5a: Both sub-agents are in parent's list"
else
    echo "✗ Test 5a: Not all sub-agents found in parent's list"
fi

# Cleanup
rm -rf ".claude/agents/$TEST_PARENT"

echo "All tests completed!"