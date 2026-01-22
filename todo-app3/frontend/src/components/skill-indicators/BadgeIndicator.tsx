import React from 'react';
import { motion } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import SkillIndicatorBase, { SkillStatus } from './SkillIndicatorBase';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

// Define badge types
type BadgeType = 'default' | 'outline' | 'filled' | 'pill' | 'dot';

// Props for badge indicator
interface BadgeIndicatorProps {
  skillName: string;
  status?: SkillStatus;
  priority?: 1 | 2 | 3 | 4 | 5;
  type?: BadgeType;
  isActive?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  animationDuration?: keyof typeof ANIMATION_DURATIONS | number;
}

const BadgeIndicator: React.FC<BadgeIndicatorProps> = ({
  skillName,
  status = 'idle',
  priority = 3,
  type = 'default',
  isActive = false,
  className = '',
  size = 'medium',
  showIcon = true,
  icon,
  onClick,
  animationDuration = 'normal'
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();

  // Size classes
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-base px-4 py-2',
  };

  // Type classes
  const typeClasses = {
    default: 'rounded-md',
    outline: 'border border-current rounded-md',
    filled: 'bg-current text-white rounded-md',
    pill: 'rounded-full',
    dot: 'rounded-full w-3 h-3',
  };

  // Status colors
  const statusColors = {
    idle: 'bg-gray-100 text-gray-800 border-gray-300',
    activating: 'bg-blue-100 text-blue-800 border-blue-300',
    active: 'bg-green-100 text-green-800 border-green-300',
    deactivating: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  // Determine animation duration value
  const durationValue =
    typeof animationDuration === 'number'
      ? animationDuration
      : ANIMATION_DURATIONS[animationDuration];

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled) {
    return (
      <div
        className={`inline-flex items-center font-medium border ${sizeClasses[size]} ${typeClasses[type]} ${statusColors[status]} ${className}`}
        onClick={onClick}
      >
        {showIcon && icon && <span className="mr-1">{icon}</span>}
        {type !== 'dot' && skillName}
      </div>
    );
  }

  // Animation variants
  const animationVariants = {
    initial: { opacity: 0, scale: 0.8, y: 10 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: durationValue,
        ease: EASING_PRESETS.easeOut,
      }
    },
    exit: { opacity: 0, scale: 0.8, y: -10 },
    active: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <SkillIndicatorBase
      type="badge"
      status={status}
      priority={priority}
      isActive={isActive}
      className={`${sizeClasses[size]} ${typeClasses[type]} ${statusColors[status]} ${className}`}
      animationDuration={animationDuration}
      tooltip={`Skill: ${skillName}, Status: ${status}`}
    >
      <motion.div
        variants={animationVariants}
        initial="initial"
        animate={['animate', status === 'active' ? 'active' : '']}
        exit="exit"
        whileHover={status === 'active' ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
        onClick={onClick}
        className="inline-flex items-center cursor-pointer"
      >
        {showIcon && icon && <span className="mr-1">{icon}</span>}
        {type !== 'dot' && (
          <span className="font-medium">
            {skillName}
            {priority > 3 && <span className="ml-1">★</span>}
          </span>
        )}
      </motion.div>
    </SkillIndicatorBase>
  );
};

// Predefined skill badge components
interface PredefinedSkillBadgeProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export const AddTaskBadge: React.FC<PredefinedSkillBadgeProps> = (props) => (
  <BadgeIndicator
    skillName="Add Task"
    status="idle"
    icon={<span>➕</span>}
    {...props}
  />
);

export const ListTasksBadge: React.FC<PredefinedSkillBadgeProps> = (props) => (
  <BadgeIndicator
    skillName="List Tasks"
    status="idle"
    icon={<span>📋</span>}
    {...props}
  />
);

export const CompleteTaskBadge: React.FC<PredefinedSkillBadgeProps> = (props) => (
  <BadgeIndicator
    skillName="Complete Task"
    status="idle"
    icon={<span>✅</span>}
    {...props}
  />
);

export const DeleteTaskBadge: React.FC<PredefinedSkillBadgeProps> = (props) => (
  <BadgeIndicator
    skillName="Delete Task"
    status="idle"
    icon={<span>🗑️</span>}
    {...props}
  />
);

export const UpdateTaskBadge: React.FC<PredefinedSkillBadgeProps> = (props) => (
  <BadgeIndicator
    skillName="Update Task"
    status="idle"
    icon={<span>✏️</span>}
    {...props}
  />
);

// Skill badge group component
interface SkillBadgeGroupProps {
  skills: Array<{
    name: string;
    status?: SkillStatus;
    priority?: 1 | 2 | 3 | 4 | 5;
    icon?: React.ReactNode;
  }>;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const SkillBadgeGroup: React.FC<SkillBadgeGroupProps> = ({
  skills,
  className = '',
  size = 'medium'
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {skills.map((skill, index) => (
        <BadgeIndicator
          key={`${skill.name}-${index}`}
          skillName={skill.name}
          status={skill.status || 'idle'}
          priority={skill.priority || 3}
          icon={skill.icon}
          size={size}
        />
      ))}
    </div>
  );
};

export default BadgeIndicator;