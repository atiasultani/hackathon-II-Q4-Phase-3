import React from 'react';
import { motion } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

// Define skill indicator types
export type SkillIndicatorType =
  | 'badge'
  | 'progress'
  | 'icon'
  | 'bar'
  | 'pulse'
  | 'notification'
  | 'status';

// Define skill status types
export type SkillStatus =
  | 'idle'
  | 'activating'
  | 'active'
  | 'deactivating'
  | 'error'
  | 'success'
  | 'warning';

// Define skill priority levels
export type SkillPriority = 1 | 2 | 3 | 4 | 5;

// Props for the base skill indicator
interface SkillIndicatorBaseProps {
  children: React.ReactNode;
  type?: SkillIndicatorType;
  status?: SkillStatus;
  priority?: SkillPriority;
  isActive?: boolean;
  className?: string;
  animationDuration?: keyof typeof ANIMATION_DURATIONS | number;
  showLabel?: boolean;
  label?: string;
  tooltip?: string;
}

const SkillIndicatorBase: React.FC<SkillIndicatorBaseProps> = ({
  children,
  type = 'badge',
  status = 'idle',
  priority = 3,
  isActive = false,
  className = '',
  animationDuration = 'normal',
  showLabel = true,
  label,
  tooltip
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();

  // Determine animation duration value
  const durationValue =
    typeof animationDuration === 'number'
      ? animationDuration
      : ANIMATION_DURATIONS[animationDuration];

  // Status colors mapping
  const statusColors = {
    idle: 'bg-gray-200 text-gray-700',
    activating: 'bg-blue-200 text-blue-700',
    active: 'bg-green-200 text-green-700',
    deactivating: 'bg-yellow-200 text-yellow-700',
    error: 'bg-red-200 text-red-700',
    success: 'bg-green-200 text-green-700',
    warning: 'bg-yellow-200 text-yellow-700',
  };

  // Priority-based styling
  const priorityStyles = {
    1: 'opacity-50',
    2: 'opacity-70',
    3: 'opacity-100',
    4: 'opacity-100 ring-1 ring-offset-1 ring-blue-300',
    5: 'opacity-100 ring-2 ring-offset-1 ring-blue-500 scale-105',
  };

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled) {
    return (
      <div
        className={`inline-flex items-center ${priorityStyles[priority]} ${statusColors[status]} ${className}`}
        title={tooltip}
      >
        {children}
        {showLabel && label && <span className="ml-1 text-xs">{label}</span>}
      </div>
    );
  }

  // Animation variants based on status
  const getAnimationVariants = () => {
    const baseVariants = {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
    };

    switch (status) {
      case 'active':
        return {
          ...baseVariants,
          animate: {
            ...baseVariants.animate,
            scale: [1, 1.05, 1],
          }
        };
      case 'error':
        return {
          ...baseVariants,
          animate: {
            ...baseVariants.animate,
            x: [0, -2, 2, -2, 2, 0],
          }
        };
      case 'success':
        return {
          ...baseVariants,
          animate: {
            ...baseVariants.animate,
            scale: [1, 1.1, 1],
          }
        };
      default:
        return baseVariants;
    }
  };

  const animationVariants = getAnimationVariants();

  return (
    <motion.div
      className={`inline-flex items-center ${priorityStyles[priority]} ${statusColors[status]} ${className}`}
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      exit={animationVariants.exit}
      transition={{
        duration: durationValue,
        ease: EASING_PRESETS.easeInOut,
      }}
      title={tooltip}
    >
      {children}
      {showLabel && label && <span className="ml-1 text-xs">{label}</span>}
    </motion.div>
  );
};

// Export types
export type { SkillIndicatorType, SkillStatus, SkillPriority };

// Export the component
export default SkillIndicatorBase;