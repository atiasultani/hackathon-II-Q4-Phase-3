/**
 * Animation Testing Suite
 *
 * This file serves as a central aggregation point for all animation tests.
 * It imports and executes all individual test files in the animation-tests directory.
 */

import './animation-performance.test';
import './animation-state.test';
import './animation-accessibility.test';
import './animation-components.test';

console.log('Animation testing suite loaded successfully');

// Export test constants for reference
export const ANIMATION_TESTS = {
  performance: './animation-performance.test',
  state: './animation-state.test',
  accessibility: './animation-accessibility.test',
  components: './animation-components.test',
};

// Test suite configuration
export const TEST_SUITE_CONFIG = {
  name: 'AI Animated Frontend - Animation Test Suite',
  description: 'Comprehensive test suite for animation components and functionality',
  tests: Object.keys(ANIMATION_TESTS),
  coverage: {
    components: ['AIAvatar', 'AnimationSystem', 'TypingAnimations', 'ResponseAnimations'],
    features: ['Accessibility', 'Performance', 'StateManagement', 'Rendering'],
    utilities: ['animation-utils', 'device-detection', 'state-persistence'],
  },
};

// Run all tests when this module is imported
export default function runAnimationTests() {
  console.log('Running Animation Test Suite...');
  console.log(`Test Suite: ${TEST_SUITE_CONFIG.name}`);
  console.log(`Tests to run: ${TEST_SUITE_CONFIG.tests.length}`);

  // Note: Actual test execution is handled by the test runner (Jest)
  // This file just aggregates the test modules
}

// Type definitions for test results
export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  errors?: string[];
}

export interface TestSuiteResult {
  suite: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

// Example test result (for type reference)
export const EXAMPLE_TEST_RESULT: TestResult = {
  name: 'Example Animation Test',
  status: 'pass',
  duration: 100,
};

// Export all test modules for easy import in test runners
export * from './animation-performance.test';
export * from './animation-state.test';
export * from './animation-accessibility.test';
export * from './animation-components.test';

console.log('Animation test modules exported successfully');