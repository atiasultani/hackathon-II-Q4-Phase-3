import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import AIAvatar from '../../components/ai-avatar/AIAvatar';
import { TypingAnimation, TypingTextEffect } from '../../components/ai-avatar/TypingAnimations';
import { ResponseAnimation } from '../../components/ai-avatar/ResponseAnimations';
import { BaseAnimation } from '../../components/animation-system/BaseAnimation';
import { useAnimationState } from '../../hooks/use-animation-state';

// Mock the animation state hook
jest.mock('../../hooks/use-animation-state', () => ({
  useAnimationState: jest.fn()
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-motion-test {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span data-motion-test {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <div data-animate-presence>{children}</div>,
}));

describe('Animation Performance Tests', () => {
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
      updateAnimationState: jest.fn(),
      shouldAnimate: jest.fn(() => true),
    });
  });

  test('AIAvatar renders without crashing', async () => {
    act(() => {
      render(<AIAvatar />);
    });

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('TypingAnimation component renders correctly', () => {
    render(<TypingAnimation isTyping={true} variant="dots" />);

    const dots = screen.getAllByTestId(/dot/);
    expect(dots.length).toBeGreaterThan(0);
  });

  test('TypingTextEffect renders text with proper animation', async () => {
    const text = 'Hello, world!';

    act(() => {
      render(<TypingTextEffect text={text} speed={20} />);
    });

    // Initially should show empty or partial text
    expect(screen.queryByText(text)).not.toBeInTheDocument();

    // After some time, should show full text
    await waitFor(() => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  test('ResponseAnimation renders with correct variants', () => {
    const testText = 'Test response';

    render(
      <ResponseAnimation isVisible={true} variant="fadeIn">
        <div>{testText}</div>
      </ResponseAnimation>
    );

    expect(screen.getByText(testText)).toBeInTheDocument();
    expect(screen.getByTestId('motion-test')).toBeInTheDocument();
  });

  test('BaseAnimation handles different animation variants', () => {
    const testText = 'Base animation test';

    render(
      <BaseAnimation variant="slide" direction="up">
        <div>{testText}</div>
      </BaseAnimation>
    );

    expect(screen.getByText(testText)).toBeInTheDocument();
    expect(screen.getByTestId('motion-test')).toBeInTheDocument();
  });
});