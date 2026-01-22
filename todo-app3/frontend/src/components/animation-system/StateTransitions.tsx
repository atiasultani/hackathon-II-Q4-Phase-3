import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

// Define transition types
type TransitionType =
  | 'fade'
  | 'slide'
  | 'scale'
  | 'slide-fade'
  | 'scale-fade'
  | 'flip'
  | 'rotate'
  | 'blur'
  | 'swoosh'
  | 'zoom';

// Define transition directions
type TransitionDirection =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'center'
  | 'in'
  | 'out';

// Define transition presets
interface TransitionPreset {
  initial: any;
  animate: any;
  exit: any;
  transition?: any;
}

// Props for state transition
interface StateTransitionProps {
  children: React.ReactNode;
  currentState: string;
  previousState?: string;
  type?: TransitionType;
  direction?: TransitionDirection;
  duration?: keyof typeof ANIMATION_DURATIONS | number;
  easing?: keyof typeof EASING_PRESETS | [number, number, number, number];
  className?: string;
  mode?: 'popLayout' | 'wait' | 'sync'; // AnimatePresence mode
  disableAnimations?: boolean;
  customPreset?: TransitionPreset;
}

const StateTransition: React.FC<StateTransitionProps> = ({
  children,
  currentState,
  previousState,
  type = 'fade',
  direction = 'center',
  duration = 'normal',
  easing = 'easeInOut',
  className = '',
  mode = 'wait',
  disableAnimations = false,
  customPreset
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();

  // Determine animation duration value
  const durationValue =
    typeof duration === 'number' ? duration : ANIMATION_DURATIONS[duration];

  // Determine easing value
  const easingValue =
    Array.isArray(easing) || typeof easing === 'string'
      ? easing
      : EASING_PRESETS[easing];

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled || disableAnimations) {
    return <div className={className}>{children}</div>;
  }

  // Define transition presets based on type and direction
  const getPreset = (): TransitionPreset => {
    if (customPreset) return customPreset;

    const distance = direction === 'left' || direction === 'right' ? 20 :
                   direction === 'up' || direction === 'down' ? 20 : 10;

    switch (type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };

      case 'slide':
        return {
          initial: {
            x: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
            y: direction === 'up' ? -distance : direction === 'down' ? distance : 0,
            opacity: 0
          },
          animate: { x: 0, y: 0, opacity: 1 },
          exit: {
            x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
            y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
            opacity: 0
          },
        };

      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
        };

      case 'slide-fade':
        return {
          initial: {
            x: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
            y: direction === 'up' ? -distance : direction === 'down' ? distance : 0,
            opacity: 0
          },
          animate: { x: 0, y: 0, opacity: 1 },
          exit: {
            x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
            y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
            opacity: 0
          },
        };

      case 'scale-fade':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
        };

      case 'flip':
        return {
          initial: { rotateY: 90, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          exit: { rotateY: -90, opacity: 0 },
        };

      case 'rotate':
        return {
          initial: { rotate: direction === 'left' ? -90 : 90, opacity: 0 },
          animate: { rotate: 0, opacity: 1 },
          exit: { rotate: direction === 'left' ? 90 : -90, opacity: 0 },
        };

      case 'blur':
        return {
          initial: { filter: 'blur(4px)', opacity: 0 },
          animate: { filter: 'blur(0px)', opacity: 1 },
          exit: { filter: 'blur(4px)', opacity: 0 },
        };

      case 'swoosh':
        return {
          initial: {
            x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
            opacity: 0,
            clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'
          },
          animate: {
            x: 0,
            opacity: 1,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
          },
          exit: {
            x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
            opacity: 0,
            clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'
          },
        };

      case 'zoom':
        return {
          initial: { scale: 0.5, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.2, opacity: 0 },
        };

      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const preset = getPreset();

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={currentState}
        initial={preset.initial}
        animate={preset.animate}
        exit={preset.exit}
        transition={{
          duration: durationValue,
          ease: easingValue,
          ...preset.transition
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// State transition manager component
interface StateTransitionManagerProps {
  children: React.ReactNode;
  currentState: string;
  states: Record<string, React.ReactNode>;
  type?: TransitionType;
  direction?: TransitionDirection;
  duration?: keyof typeof ANIMATION_DURATIONS | number;
  className?: string;
  mode?: 'popLayout' | 'wait' | 'sync';
}

export const StateTransitionManager: React.FC<StateTransitionManagerProps> = ({
  children,
  currentState,
  states,
  type = 'fade',
  direction = 'center',
  duration = 'normal',
  className = '',
  mode = 'wait'
}) => {
  const currentView = states[currentState] || children;

  return (
    <StateTransition
      currentState={currentState}
      type={type}
      direction={direction}
      duration={duration}
      mode={mode}
      className={className}
    >
      {currentView}
    </StateTransition>
  );
};

// Tab transition component
interface TabTransitionProps {
  activeTab: string;
  tabs: Record<string, React.ReactNode>;
  type?: TransitionType;
  duration?: keyof typeof ANIMATION_DURATIONS | number;
  className?: string;
}

export const TabTransition: React.FC<TabTransitionProps> = ({
  activeTab,
  tabs,
  type = 'slide-fade',
  duration = 'normal',
  className = ''
}) => {
  return (
    <StateTransition
      currentState={activeTab}
      type={type}
      duration={duration}
      mode="wait"
      className={className}
    >
      {tabs[activeTab] || <div>No content for tab: {activeTab}</div>}
    </StateTransition>
  );
};

// Modal transition component
interface ModalTransitionProps {
  isOpen: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  type?: TransitionType;
  duration?: keyof typeof ANIMATION_DURATIONS | number;
  className?: string;
}

export const ModalTransition: React.FC<ModalTransitionProps> = ({
  isOpen,
  children,
  onClose,
  type = 'scale-fade',
  duration = 'normal',
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <StateTransition
            currentState={isOpen ? 'open' : 'closed'}
            type={type}
            duration={duration}
            mode="wait"
            className={className}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </StateTransition>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Page transition component
interface PageTransitionProps {
  children: React.ReactNode;
  currentPage: string;
  type?: TransitionType;
  direction?: TransitionDirection;
  duration?: keyof typeof ANIMATION_DURATIONS | number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  currentPage,
  type = 'fade',
  direction = 'left',
  duration = 'normal',
  className = ''
}) => {
  return (
    <StateTransition
      currentState={currentPage}
      type={type}
      direction={direction}
      duration={duration}
      mode="popLayout"
      className={`w-full h-full ${className}`}
    >
      {children}
    </StateTransition>
  );
};

// State transition hook for programmatic control
interface UseStateTransitionReturn {
  currentState: string;
  transitionTo: (state: string) => void;
  isTransitioning: boolean;
}

export const useStateTransition = (initialState: string): UseStateTransitionReturn => {
  const [currentState, setCurrentState] = useState(initialState);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionTo = (newState: string) => {
    setIsTransitioning(true);
    setCurrentState(newState);

    // Reset transitioning state after animation duration
    setTimeout(() => setIsTransitioning(false), 300); // Default duration
  };

  return {
    currentState,
    transitionTo,
    isTransitioning
  };
};

// Preset transitions for common use cases
export const PresetTransitions = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideInRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
  slideInLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
  zoomIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
  },
};

export default StateTransition;