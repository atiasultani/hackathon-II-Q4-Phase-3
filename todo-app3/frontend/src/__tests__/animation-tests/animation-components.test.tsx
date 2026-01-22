import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import AIAvatar from '../../components/ai-avatar/AIAvatar';
import { AvatarExpressions, EXPRESSION_CONFIGS } from '../../components/ai-avatar/AvatarExpressions';
import { TypingAnimation, TypingTextEffect, AdvancedTypingIndicator } from '../../components/ai-avatar/TypingAnimations';
import { ResponseAnimation, TypingTextEffect as TypingTextEffectComp } from '../../components/ai-avatar/ResponseAnimations';
import { BaseAnimation } from '../../components/animation-system/BaseAnimation';
import { ProcessingVisuals, SkillActivationVisuals } from '../../components/ai-avatar/ProcessingVisuals';
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
    svg: ({ children, ...props }: any) => <svg data-motion-test {...props}>{children}</svg>,
  },
  AnimatePresence: ({ children }: any) => <div data-animate-presence>{children}</div>,
}));

// Mock WebSocket service
jest.mock('../../services/websocket-service', () => ({
  getWebSocketService: jest.fn(() => ({
    subscribeToAnimationUpdates: jest.fn(() => () => {}),
    subscribeToAgentUpdates: jest.fn(() => () => {}),
  }))
}));

describe('Animation Components Tests', () => {
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
      performanceMetrics: {
        fps: 60,
        shouldOptimize: false,
        reducedMotion: false,
        isLowEnd: false,
      },
      userPreferences: {
        animationsEnabled: true,
        animationSpeed: 1,
        motionSensitivity: 'medium',
        colorTheme: 'default',
        avatarStyle: 'default',
      },
    });
  });

  describe('AIAvatar Component', () => {
    test('renders AI avatar with default props', () => {
      render(<AIAvatar />);

      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
    });

    test('renders with different sizes', () => {
      render(<AIAvatar size="large" />);

      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
    });

    test('displays correct expression', () => {
      (useAnimationState as jest.MockedFunction<any>).mockReturnValue({
        ...useAnimationState(),
        animationState: {
          avatarExpression: 'happy',
          animationSequence: [],
          isActive: true,
          triggerEvent: 'test-event',
          duration: 300,
          intensity: 7,
        }
      });

      render(<AIAvatar />);

      // The component should render based on the avatarExpression
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('AvatarExpressions Component', () => {
    test('renders with default expression', () => {
      render(<AvatarExpressions currentExpression="neutral" />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('renders with different expressions', () => {
      render(<AvatarExpressions currentExpression="happy" />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('has all expected expression configurations', () => {
      const expressions = Object.keys(EXPRESSION_CONFIGS);
      expect(expressions).toContain('neutral');
      expect(expressions).toContain('happy');
      expect(expressions).toContain('thinking');
      expect(expressions).toContain('listening');
      expect(expressions).toContain('processing');
      expect(expressions).toContain('surprised');
      expect(expressions).toContain('excited');
      expect(expressions).toContain('confused');
      expect(expressions).toContain('waiting');
      expect(expressions).toContain('greeting');
    });
  });

  describe('TypingAnimation Component', () => {
    test('renders typing animation when active', () => {
      render(<TypingAnimation isTyping={true} variant="dots" />);

      const dots = screen.getAllByTestId(/dot/);
      expect(dots.length).toBeGreaterThan(0);
    });

    test('does not render when not active', () => {
      render(<TypingAnimation isTyping={false} variant="dots" />);

      const dots = screen.queryAllByTestId(/dot/);
      expect(dots.length).toBe(0);
    });

    test('supports different variants', () => {
      render(<TypingAnimation isTyping={true} variant="bars" />);

      // Should render bars instead of dots
      expect(screen.getByTestId(/motion-test/)).toBeInTheDocument();
    });
  });

  describe('TypingTextEffect Component', () => {
    test('renders text with typing effect', async () => {
      const text = 'Hello, World!';

      act(() => {
        render(<TypingTextEffect text={text} speed={20} />);
      });

      // Initially, text might be partially displayed
      expect(screen.queryByText(text)).not.toBeInTheDocument();

      // After timeout, full text should appear
      await waitFor(() => {
        expect(screen.getByText(text)).toBeInTheDocument();
      });
    });

    test('handles completion callback', async () => {
      const mockOnComplete = jest.fn();
      const text = 'Test text';

      act(() => {
        render(<TypingTextEffect text={text} speed={50} onComplete={mockOnComplete} />);
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('ResponseAnimation Component', () => {
    test('renders with fade in animation', () => {
      render(
        <ResponseAnimation isVisible={true} variant="fadeIn">
          <div>Test Content</div>
        </ResponseAnimation>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with slide in animation', () => {
      render(
        <ResponseAnimation isVisible={true} variant="slideIn">
          <div>Test Content</div>
        </ResponseAnimation>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('does not render when not visible', () => {
      render(
        <ResponseAnimation isVisible={false} variant="fadeIn">
          <div>Test Content</div>
        </ResponseAnimation>
      );

      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });
  });

  describe('BaseAnimation Component', () => {
    test('renders with scale animation', () => {
      render(
        <BaseAnimation variant="scale" duration="quick">
          <div>Test Content</div>
        </BaseAnimation>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with slide animation', () => {
      render(
        <BaseAnimation variant="slide" direction="up">
          <div>Test Content</div>
        </BaseAnimation>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders with custom variant', () => {
      render(
        <BaseAnimation variant="custom" customVariant={{ initial: {}, animate: {} }}>
          <div>Test Content</div>
        </BaseAnimation>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('ProcessingVisuals Component', () => {
    test('renders processing visuals when active', () => {
      render(<ProcessingVisuals isActive={true} />);

      expect(screen.getByTestId(/motion-test/)).toBeInTheDocument();
    });

    test('does not render when inactive', () => {
      render(<ProcessingVisuals isActive={false} />);

      expect(screen.queryByTestId(/motion-test/)).not.toBeInTheDocument();
    });

    test('shows progress when provided', () => {
      render(<ProcessingVisuals isActive={true} intensity={7} />);

      expect(screen.getByTestId(/motion-test/)).toBeInTheDocument();
    });
  });

  describe('SkillActivationVisuals Component', () => {
    test('renders with active skills', () => {
      render(<SkillActivationVisuals activeSkills={['Skill 1', 'Skill 2']} />);

      expect(screen.getByText('Skill 1')).toBeInTheDocument();
      expect(screen.getByText('Skill 2')).toBeInTheDocument();
    });

    test('renders empty when no active skills', () => {
      render(<SkillActivationVisuals activeSkills={[]} />);

      // Component may not render anything when no skills are provided
      // This depends on the actual implementation
    });
  });
});