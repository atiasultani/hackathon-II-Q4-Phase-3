#!/bin/bash

# Test script for assign-agent-skills skill

echo "Testing assign-agent-skills skill..."

# Create a test agent and its skills.md file
TEST_AGENT="test-assign-skills"
mkdir -p ".claude/agents/$TEST_AGENT"
cat > ".claude/agents/$TEST_AGENT/skills.md" << EOF
# Skills and Capabilities

## Placeholder
This is a placeholder file for testing.
EOF

# Test 1: Assign skills to the agent
echo "Test 1: Assigning skills to agent..."
result=$(./.claude/skills/assign-agent-skills/assign-agent-skills.sh "$TEST_AGENT" "code-review,documentation,testing" 2>&1)
if [[ "$result" == *"Skills successfully assigned to agent"* ]]; then
    echo "✓ Test 1 passed: Skill assignment works"
else
    echo "✗ Test 1 failed: $result"
fi

# Verify that the skills.md file was updated
if [[ -f ".claude/agents/$TEST_AGENT/skills.md" ]] && grep -q "Core Skills" ".claude/agents/$TEST_AGENT/skills.md"; then
    echo "✓ Test 1a: Skills.md file was updated with Core Skills"
else
    echo "✗ Test 1a: Skills.md file was not properly updated"
fi

# Verify that the file contains both primary and optional skills sections
if grep -q "Core Skills" ".claude/agents/$TEST_AGENT/skills.md" && grep -q "Optional/Extended Skills" ".claude/agents/$TEST_AGENT/skills.md"; then
    echo "✓ Test 1b: Both primary and extended skills sections exist"
else
    echo "✗ Test 1b: Missing primary or extended skills sections"
fi

# Test 2: Try to assign skills to non-existent agent directory
echo "Test 2: Testing non-existent agent directory..."
result=$(./.claude/skills/assign-agent-skills/assign-agent-skills.sh "non-existent-agent" "skill1,skill2" 2>&1)
if [[ "$result" == *"Error: Agent directory"* && "$result" == *"does not exist"* ]]; then
    echo "✓ Test 2 passed: Directory validation works"
else
    echo "✗ Test 2 failed: $result"
fi

# Test 3: Try to assign skills when skills.md doesn't exist
mkdir -p ".claude/agents/no-skills-file"
echo "Test 3: Testing missing skills.md file..."
result=$(./.claude/skills/assign-agent-skills/assign-agent-skills.sh "no-skills-file" "skill1,skill2" 2>&1)
if [[ "$result" == *"Error: Skills file"* && "$result" == *"does not exist"* ]]; then
    echo "✓ Test 3 passed: Skills file validation works"
else
    echo "✗ Test 3 failed: $result"
fi

# Test 4: Test with missing parameters
echo "Test 4: Testing missing parameters..."
result=$(./.claude/skills/assign-agent-skills/assign-agent-skills.sh 2>&1)
if [[ "$result" == *"Error: agent_name and list_of_skills are required"* ]]; then
    echo "✓ Test 4 passed: Parameter validation works"
else
    echo "✗ Test 4 failed: $result"
fi

# Test 5: Test with a single skill (edge case)
TEST_AGENT2="test-single-skill"
mkdir -p ".claude/agents/$TEST_AGENT2"
cat > ".claude/agents/$TEST_AGENT2/skills.md" << EOF
# Skills and Capabilities

## Placeholder
This is a placeholder file for testing single skill.
EOF

echo "Test 5: Testing single skill assignment..."
result=$(./.claude/skills/assign-agent-skills/assign-agent-skills.sh "$TEST_AGENT2" "code-review" 2>&1)
if [[ "$result" == *"Skills successfully assigned to agent"* ]]; then
    echo "✓ Test 5 passed: Single skill assignment works"
else
    echo "✗ Test 5 failed: $result"
fi

# Verify that with a single skill, it's categorized as a primary skill
if grep -q "Core Skills" ".claude/agents/$TEST_AGENT2/skills.md" && ! grep -q "Optional/Extended Skills" ".claude/agents/$TEST_AGENT2/skills.md"; then
    echo "✓ Test 5a: Single skill is properly categorized as primary"
else
    echo "✗ Test 5a: Single skill categorization issue"
fi

# Cleanup
rm -rf ".claude/agents/$TEST_AGENT"
rm -rf ".claude/agents/no-skills-file"
rm -rf ".claude/agents/$TEST_AGENT2"

echo "All tests completed!"