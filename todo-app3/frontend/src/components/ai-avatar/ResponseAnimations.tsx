import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

interface ResponseAnimationProps {
  children: React.ReactNode;
  isVisible?: boolean;
  triggerEvent?: string;
  variant?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn' | 'typewriter';
  duration?: keyof typeof ANIMATION_DURATIONS | number;
  className?: string;
}

const ResponseAnimation: React.FC<ResponseAnimationProps> = ({
  children,
  isVisible = true,
  triggerEvent,
  variant = 'fadeIn',
  duration = 'normal',
  className = ''
}) => {
  const { shouldAnimate, performanceMetrics } = useAnimationState();

  // Determine actual duration value
  const durationValue =
    typeof duration === 'number' ? duration : ANIMATION_DURATIONS[duration];

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  // Define variants based on type
  const getVariantConfig = () => {
    switch (variant) {
      case 'fadeIn':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };

      case 'slideIn':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
        };

      case 'scaleIn':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 },
        };

      case 'bounceIn':
        return {
          initial: { opacity: 0, scale: 0.3, y: 20 },
          animate: {
            opacity: 1,
            scale: [0.3, 1.05, 0.95, 1],
            y: [20, -10, 5, 0],
          },
          exit: { opacity: 0, scale: 0.9, y: -10 },
        };

      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variantConfig = getVariantConfig();

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={variantConfig.initial}
          animate={variantConfig.animate}
          exit={variantConfig.exit}
          transition={{
            duration: durationValue,
            ease: EASING_PRESETS.easeInOut,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface TypewriterAnimationProps {
  text: string;
  speed?: number; // Characters per second
  className?: string;
  onComplete?: () => void;
  startDelay?: number; // Delay before starting the animation
}

const TypewriterAnimation: React.FC<TypewriterAnimationProps> = ({
  text,
  speed = 15, // Default 15 characters per second
  className = '',
  onComplete,
  startDelay = 0
}) => {
  const { shouldAnimate, performanceMetrics } = useAnimationState();
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !shouldAnimate()) {
    return <div className={className}>{text}</div>;
  }

  useEffect(() => {
    if (isCompleted) return;

    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else if (!isCompleted) {
        setIsCompleted(true);
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000 / speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, isCompleted, onComplete]);

  // Reset when text changes
  useEffect(() => {
    if (startDelay === 0) {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsCompleted(false);
    } else {
      const delayTimer = setTimeout(() => {
        setDisplayedText('');
        setCurrentIndex(0);
        setIsCompleted(false);
      }, startDelay);

      return () => clearTimeout(delayTimer);
    }
  }, [text, startDelay]);

  return (
    <div className={`inline-block ${className}`}>
      <span>{displayedText}</span>
      {!isCompleted && (
        <motion.span
          className="ml-0.5 inline-block w-0.5 h-4 bg-current"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </div>
  );
};

interface StaggeredListAnimationProps {
  items: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

const StaggeredListAnimation: React.FC<StaggeredListAnimationProps> = ({
  items,
  className = '',
  itemClassName = '',
  staggerDelay = 0.1
}) => {
  const { shouldAnimate, performanceMetrics } = useAnimationState();

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !shouldAnimate()) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={index} className={itemClassName}>
            {item}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * staggerDelay,
            duration: 0.5,
            ease: EASING_PRESETS.easeOut,
          }}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
};

interface PulseHighlightProps {
  children: React.ReactNode;
  isActive?: boolean;
  pulseColor?: string;
  className?: string;
}

const PulseHighlight: React.FC<PulseHighlightProps> = ({
  children,
  isActive = false,
  pulseColor = 'rgba(79, 70, 229, 0.3)', // indigo-500 with opacity
  className = ''
}) => {
  const { shouldAnimate, performanceMetrics } = useAnimationState();

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !shouldAnimate() || !isActive) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `0 0 0 0 ${pulseColor}`,
          `0 0 0 10px rgba(79, 70, 229, 0)`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

interface WaveAnimationProps {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({
  children,
  isActive = false,
  className = ''
}) => {
  const { shouldAnimate, performanceMetrics } = useAnimationState();

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !shouldAnimate() || !isActive) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -5, 0],
        rotate: [0, 2, -2, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

interface ResponseTransitionGroupProps {
  children: React.ReactNode;
  mode?: 'popLayout' | 'wait' | 'sync';
  className?: string;
}

const ResponseTransitionGroup: React.FC<ResponseTransitionGroupProps> = ({
  children,
  mode = 'wait',
  className = ''
}) => {
  const { shouldAnimate, performanceMetrics } = useAnimationState();

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode={mode}>
      <div className={className}>{children}</div>
    </AnimatePresence>
  );
};

export {
  ResponseAnimation,
  TypewriterAnimation,
  StaggeredListAnimation,
  PulseHighlight,
  WaveAnimation,
  ResponseTransitionGroup
};
export default ResponseAnimation;