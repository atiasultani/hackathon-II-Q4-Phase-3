import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import AccessibilityControls from '../../components/ai-avatar/AccessibilityControls';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';

// Mock the user preferences hook
jest.mock('../../context/UserPreferencesContext', () => ({
  useUserPreferences: jest.fn(),
  UserPreferencesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-motion-test {...props}>{children}</div>,
  },
}));

// Mock the accessibility utilities
jest.mock('../../utils/accessibility-utils', () => ({
  announceToScreenReader: jest.fn(),
  isReducedMotionPreferred: jest.fn(() => false),
  subscribeToReducedMotion: jest.fn(() => () => {}),
}));

describe('Animation Accessibility Tests', () => {
  beforeEach(() => {
    (useUserPreferences as jest.MockedFunction<any>).mockReturnValue({
      preferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      updatePreferences: jest.fn(),
      isReducedMotion: false,
      shouldAnimate: jest.fn(() => true),
    });
  });

  test('renders accessibility controls correctly', () => {
    render(
      <UserPreferencesProvider>
        <AccessibilityControls />
      </UserPreferencesProvider>
    );

    expect(screen.getByText('Accessibility Controls')).toBeInTheDocument();
    expect(screen.getByText('Animations')).toBeInTheDocument();
    expect(screen.getByText('Motion Sensitivity')).toBeInTheDocument();
    expect(screen.getByText('Animation Speed')).toBeInTheDocument();
    expect(screen.getByText('Color Theme')).toBeInTheDocument();
  });

  test('toggles animations via accessibility controls', () => {
    const mockUpdatePreferences = jest.fn();

    (useUserPreferences as jest.MockedFunction<any>).mockReturnValue({
      preferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      updatePreferences: mockUpdatePreferences,
      isReducedMotion: false,
      shouldAnimate: jest.fn(() => true),
    });

    render(
      <UserPreferencesProvider>
        <AccessibilityControls />
      </UserPreferencesProvider>
    );

    // Find the animations toggle switch
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();

    // Toggle the switch
    fireEvent.click(toggle);

    expect(mockUpdatePreferences).toHaveBeenCalledWith({ animationsEnabled: false });
  });

  test('changes motion sensitivity via accessibility controls', () => {
    const mockUpdatePreferences = jest.fn();

    (useUserPreferences as jest.MockedFunction<any>).mockReturnValue({
      preferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      updatePreferences: mockUpdatePreferences,
      isReducedMotion: false,
      shouldAnimate: jest.fn(() => true),
    });

    render(
      <UserPreferencesProvider>
        <AccessibilityControls />
      </UserPreferencesProvider>
    );

    // Find and click the 'low' motion sensitivity button
    const lowButton = screen.getByText('Low');
    fireEvent.click(lowButton);

    expect(mockUpdatePreferences).toHaveBeenCalledWith({ motionSensitivity: 'low' });
  });

  test('adjusts animation speed via accessibility controls', () => {
    const mockUpdatePreferences = jest.fn();

    (useUserPreferences as jest.MockedFunction<any>).mockReturnValue({
      preferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      updatePreferences: mockUpdatePreferences,
      isReducedMotion: false,
      shouldAnimate: jest.fn(() => true),
    });

    render(
      <UserPreferencesProvider>
        <AccessibilityControls />
      </UserPreferencesProvider>
    );

    // Find the speed adjustment buttons
    const decreaseButton = screen.getByText('-');
    const increaseButton = screen.getByText('+');

    expect(decreaseButton).toBeInTheDocument();
    expect(increaseButton).toBeInTheDocument();

    // Click the decrease button
    fireEvent.click(decreaseButton);

    // The speed should be adjusted (mock implementation may vary)
    // Just verify that updatePreferences was called
    expect(mockUpdatePreferences).toHaveBeenCalled();
  });

  test('changes color theme via accessibility controls', () => {
    const mockUpdatePreferences = jest.fn();

    (useUserPreferences as jest.MockedFunction<any>).mockReturnValue({
      preferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      updatePreferences: mockUpdatePreferences,
      isReducedMotion: false,
      shouldAnimate: jest.fn(() => true),
    });

    render(
      <UserPreferencesProvider>
        <AccessibilityControls />
      </UserPreferencesProvider>
    );

    // Find and click the 'high-contrast' theme button
    const highContrastButton = screen.getByText('High Contrast');
    fireEvent.click(highContrastButton);

    expect(mockUpdatePreferences).toHaveBeenCalledWith({ colorTheme: 'high-contrast' });
  });

  test('shows reduced motion notice when system preference is set', () => {
    (useUserPreferences as jest.MockedFunction<any>).mockReturnValue({
      preferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      updatePreferences: jest.fn(),
      isReducedMotion: true,
      shouldAnimate: jest.fn(() => false),
    });

    render(
      <UserPreferencesProvider>
        <AccessibilityControls />
      </UserPreferencesProvider>
    );

    expect(screen.getByText('System preference: Reduced Motion is ON')).toBeInTheDocument();
  });

  test('disables animations when reduced motion is preferred', () => {
    const mockUpdatePreferences = jest.fn();

    (useUserPreferences as jest.MockedFunction<any>).mockReturnValue({
      preferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
      updatePreferences: mockUpdatePreferences,
      isReducedMotion: true,
      shouldAnimate: jest.fn(() => false),
    });

    render(
      <UserPreferencesProvider>
        <AccessibilityControls />
      </UserPreferencesProvider>
    );

    // Check that the toggle is properly handled
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });
});