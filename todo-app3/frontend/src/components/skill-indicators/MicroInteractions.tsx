import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

// Define micro-interaction types
type MicroInteractionType =
  | 'hover'
  | 'click'
  | 'focus'
  | 'success'
  | 'error'
  | 'notification'
  | 'attention'
  | 'confirmation'
  | 'loading'
  | 'complete';

// Define micro-interaction sizes
type MicroInteractionSize = 'tiny' | 'small' | 'medium' | 'large';

// Props for micro-interaction wrapper
interface MicroInteractionWrapperProps {
  children: React.ReactNode;
  type?: MicroInteractionType;
  size?: MicroInteractionSize;
  className?: string;
  disabled?: boolean;
  animationDuration?: keyof typeof ANIMATION_DURATIONS | number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const MicroInteractionWrapper: React.FC<MicroInteractionWrapperProps> = ({
  children,
  type = 'hover',
  size = 'medium',
  className = '',
  disabled = false,
  animationDuration = 'quick',
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();

  // Size scale factors
  const sizeFactors = {
    tiny: 0.8,
    small: 0.9,
    medium: 1,
    large: 1.1,
  };

  const scaleFactor = sizeFactors[size];

  // Determine animation duration value
  const durationValue =
    typeof animationDuration === 'number'
      ? animationDuration
      : ANIMATION_DURATIONS[animationDuration];

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled || disabled) {
    return (
      <div
        className={className}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </div>
    );
  }

  // Interaction handlers
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation variants based on type
  const getAnimationVariants = () => {
    const baseVariants = {
      initial: { scale: 1 },
      animate: { scale: 1 },
      whileHover: { scale: 1 },
      whileTap: { scale: 1 },
    };

    switch (type) {
      case 'hover':
        return {
          ...baseVariants,
          whileHover: {
            scale: 1.05 * scaleFactor,
            transition: {
              duration: durationValue * 0.5,
              ease: EASING_PRESETS.easeOut
            }
          }
        };

      case 'click':
        return {
          ...baseVariants,
          whileTap: {
            scale: 0.95 * scaleFactor,
            transition: {
              duration: durationValue * 0.3,
              ease: EASING_PRESETS.easeIn
            }
          }
        };

      case 'focus':
        return {
          ...baseVariants,
          animate: {
            scale: isFocused ? 1.02 * scaleFactor : 1,
            boxShadow: isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.5)" : "none",
            transition: {
              duration: durationValue * 0.5,
              ease: EASING_PRESETS.easeInOut
            }
          }
        };

      case 'success':
        return {
          ...baseVariants,
          animate: {
            scale: [1, 1.1, 1],
            transition: {
              duration: 0.6,
              times: [0, 0.5, 1],
              ease: EASING_PRESETS.easeInOut
            }
          }
        };

      case 'error':
        return {
          ...baseVariants,
          animate: {
            x: [0, -5, 5, -5, 5, 0],
            transition: {
              duration: 0.6,
              ease: EASING_PRESETS.easeInOut
            }
          }
        };

      case 'notification':
        return {
          ...baseVariants,
          animate: {
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
            transition: {
              duration: 1,
              repeat: Infinity,
              repeatType: "loop",
              ease: EASING_PRESETS.easeInOut
            }
          }
        };

      case 'attention':
        return {
          ...baseVariants,
          animate: {
            scale: [1, 1.05, 1],
            transition: {
              duration: 2,
              repeat: Infinity,
              repeatType: "loop",
              ease: EASING_PRESETS.easeInOut
            }
          }
        };

      case 'confirmation':
        return {
          ...baseVariants,
          animate: {
            scale: [1, 1.2, 1.1, 1],
            transition: {
              duration: 0.5,
              times: [0, 0.3, 0.6, 1],
              ease: EASING_PRESETS.easeInOut
            }
          }
        };

      case 'loading':
        return {
          ...baseVariants,
          animate: {
            rotate: 360,
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }
          }
        };

      case 'complete':
        return {
          ...baseVariants,
          animate: {
            scale: [1, 1.1, 1],
            backgroundColor: ["transparent", "#10B981", "transparent"],
            transition: {
              duration: 0.5,
              times: [0, 0.5, 1],
              ease: EASING_PRESETS.easeInOut
            }
          }
        };

      default:
        return baseVariants;
    }
  };

  const variants = getAnimationVariants();

  // Handle mouse events
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onMouseEnter) onMouseEnter();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    if (onMouseLeave) onMouseLeave();
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      whileHover={!disabled ? "whileHover" : undefined}
      whileTap={!disabled ? "whileTap" : undefined}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {children}
    </motion.div>
  );
};

// Specialized micro-interaction components
interface SkillHoverIndicatorProps {
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

export const SkillHoverIndicator: React.FC<SkillHoverIndicatorProps> = ({
  children,
  className = '',
  tooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <MicroInteractionWrapper
      type="hover"
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      <AnimatePresence>
        {showTooltip && tooltip && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
          >
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </MicroInteractionWrapper>
  );
};

interface SkillClickFeedbackProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  successAnimation?: boolean;
  errorAnimation?: boolean;
}

export const SkillClickFeedback: React.FC<SkillClickFeedbackProps> = ({
  children,
  onClick,
  className = '',
  successAnimation = false,
  errorAnimation = false
}) => {
  const [clickType, setClickType] = useState<'none' | 'success' | 'error'>('none');

  const handleClick = () => {
    if (onClick) {
      onClick();
      // Set success/error animation based on props or result of onClick
      setClickType(successAnimation ? 'success' : errorAnimation ? 'error' : 'success');

      // Reset animation after a short delay
      setTimeout(() => setClickType('none'), 1000);
    }
  };

  return (
    <MicroInteractionWrapper
      type={clickType !== 'none' ? clickType : 'click'}
      onClick={handleClick}
      className={className}
    >
      {children}
    </MicroInteractionWrapper>
  );
};

interface SkillNotificationPulseProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  intensity?: number;
}

export const SkillNotificationPulse: React.FC<SkillNotificationPulseProps> = ({
  children,
  active = true,
  className = '',
  intensity = 1
}) => {
  if (!active) return <div className={className}>{children}</div>;

  return (
    <MicroInteractionWrapper
      type="notification"
      className={`relative ${className}`}
    >
      {children}

      <motion.div
        className="absolute inset-0 rounded-full opacity-50"
        animate={{
          scale: [1, 1.5 * intensity, 1.8 * intensity],
          opacity: [0.5, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    </MicroInteractionWrapper>
  );
};

interface SkillAttentionGrabberProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  frequency?: number; // Number of times per minute
}

export const SkillAttentionGrabber: React.FC<SkillAttentionGrabberProps> = ({
  children,
  active = true,
  className = '',
  frequency = 30
}) => {
  if (!active) return <div className={className}>{children}</div>;

  return (
    <MicroInteractionWrapper
      type="attention"
      className={className}
    >
      {children}
    </MicroInteractionWrapper>
  );
};

interface SkillConfirmationBounceProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export const SkillConfirmationBounce: React.FC<SkillConfirmationBounceProps> = ({
  children,
  active = true,
  className = ''
}) => {
  if (!active) return <div className={className}>{children}</div>;

  return (
    <MicroInteractionWrapper
      type="confirmation"
      className={className}
    >
      {children}
    </MicroInteractionWrapper>
  );
};

// Compound micro-interaction component for skill cards
interface SkillCardMicroInteractionProps {
  children: React.ReactNode;
  skillName: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const SkillCardMicroInteraction: React.FC<SkillCardMicroInteractionProps> = ({
  children,
  skillName,
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <SkillHoverIndicator tooltip={`${skillName} Skill`} className={className}>
      <SkillClickFeedback onClick={onClick} successAnimation={!disabled}>
        <div className={`cursor-pointer rounded-lg p-3 transition-all duration-200 ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 active:scale-95'
        }`}>
          {children}
        </div>
      </SkillClickFeedback>
    </SkillHoverIndicator>
  );
};

export default MicroInteractionWrapper;