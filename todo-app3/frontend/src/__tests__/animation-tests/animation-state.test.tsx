import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useAnimationState } from '../../hooks/use-animation-state';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';
import { StatePersistenceProvider } from '../../utils/state-persistence';

// Mock the animation state hook
jest.mock('../../hooks/use-animation-state', () => ({
  useAnimationState: jest.fn()
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-motion-test {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div data-animate-presence>{children}</div>,
}));

// Test component that uses the animation state
const TestAnimationComponent: React.FC = () => {
  const {
    animationState,
    agentActivities,
    userPreferences,
    updateAnimationState,
    updateAgentActivity,
    updateUserPreferences,
    shouldAnimate
  } = useAnimationState();

  return (
    <div>
      <div data-testid="avatar-expression">{animationState.avatarExpression}</div>
      <div data-testid="animation-is-active">{String(animationState.isActive)}</div>
      <div data-testid="agent-count">{agentActivities.length}</div>
      <div data-testid="animations-enabled">{String(userPreferences.animationsEnabled)}</div>
      <button
        data-testid="update-animation"
        onClick={() => updateAnimationState({ avatarExpression: 'happy' })}
      >
        Update Animation
      </button>
      <button
        data-testid="update-agent"
        onClick={() => updateAgentActivity('test-agent', { status: 'active' })}
      >
        Update Agent
      </button>
      <button
        data-testid="toggle-animations"
        onClick={() => updateUserPreferences({ animationsEnabled: !userPreferences.animationsEnabled })}
      >
        Toggle Animations
      </button>
      <div data-testid="should-animate">{String(shouldAnimate())}</div>
    </div>
  );
};

describe('Animation State Management Tests', () => {
  beforeEach(() => {
    (useAnimationState as jest.MockedFunction<any>).mockReturnValue({
      animationState: {
        avatarExpression: 'neutral',
        animationSequence: [],
        isActive: false,
        triggerEvent: '',
        duration: 300,
        intensity: 5,
      },
      agentActivities: [],
      userPreferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      performanceMetrics: {
        fps: 60,
        shouldOptimize: false,
        reducedMotion: false,
        isLowEnd: false,
      },
      updateAnimationState: jest.fn(),
      updateAgentActivity: jest.fn(),
      updateUserPreferences: jest.fn(),
      shouldAnimate: jest.fn(() => true),
    });
  });

  test('renders animation state correctly', () => {
    render(
      <UserPreferencesProvider>
        <StatePersistenceProvider>
          <TestAnimationComponent />
        </StatePersistenceProvider>
      </UserPreferencesProvider>
    );

    expect(screen.getByTestId('avatar-expression')).toHaveTextContent('neutral');
    expect(screen.getByTestId('animation-is-active')).toHaveTextContent('false');
    expect(screen.getByTestId('agent-count')).toHaveTextContent('0');
    expect(screen.getByTestId('animations-enabled')).toHaveTextContent('true');
  });

  test('updates animation state when button is clicked', () => {
    const mockUpdateAnimationState = jest.fn();

    (useAnimationState as jest.MockedFunction<any>).mockReturnValue({
      animationState: {
        avatarExpression: 'neutral',
        animationSequence: [],
        isActive: false,
        triggerEvent: '',
        duration: 300,
        intensity: 5,
      },
      agentActivities: [],
      userPreferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      performanceMetrics: {
        fps: 60,
        shouldOptimize: false,
        reducedMotion: false,
        isLowEnd: false,
      },
      updateAnimationState: mockUpdateAnimationState,
      updateAgentActivity: jest.fn(),
      updateUserPreferences: jest.fn(),
      shouldAnimate: jest.fn(() => true),
    });

    render(
      <UserPreferencesProvider>
        <StatePersistenceProvider>
          <TestAnimationComponent />
        </StatePersistenceProvider>
      </UserPreferencesProvider>
    );

    fireEvent.click(screen.getByTestId('update-animation'));
    expect(mockUpdateAnimationState).toHaveBeenCalledWith({ avatarExpression: 'happy' });
  });

  test('updates agent activity when button is clicked', () => {
    const mockUpdateAgentActivity = jest.fn();

    (useAnimationState as jest.MockedFunction<any>).mockReturnValue({
      ...useAnimationState(),
      updateAgentActivity: mockUpdateAgentActivity,
    });

    render(
      <UserPreferencesProvider>
        <StatePersistenceProvider>
          <TestAnimationComponent />
        </StatePersistenceProvider>
      </UserPreferencesProvider>
    );

    fireEvent.click(screen.getByTestId('update-agent'));
    expect(mockUpdateAgentActivity).toHaveBeenCalledWith('test-agent', { status: 'active' });
  });

  test('toggles animations when button is clicked', () => {
    const mockUpdateUserPreferences = jest.fn();

    (useAnimationState as jest.MockedFunction<any>).mockReturnValue({
      ...useAnimationState(),
      updateUserPreferences: mockUpdateUserPreferences,
    });

    render(
      <UserPreferencesProvider>
        <StatePersistenceProvider>
          <TestAnimationComponent />
        </StatePersistenceProvider>
      </UserPreferencesProvider>
    );

    fireEvent.click(screen.getByTestId('toggle-animations'));
    expect(mockUpdateUserPreferences).toHaveBeenCalledWith({ animationsEnabled: false });
  });

  test('shouldAnimate returns correct value', () => {
    const mockShouldAnimate = jest.fn(() => true);

    (useAnimationState as jest.MockedFunction<any>).mockReturnValue({
      ...useAnimationState(),
      shouldAnimate: mockShouldAnimate,
    });

    render(
      <UserPreferencesProvider>
        <StatePersistenceProvider>
          <TestAnimationComponent />
        </StatePersistenceProvider>
      </UserPreferencesProvider>
    );

    expect(screen.getByTestId('should-animate')).toHaveTextContent('true');
    expect(mockShouldAnimate).toHaveBeenCalled();
  });
});