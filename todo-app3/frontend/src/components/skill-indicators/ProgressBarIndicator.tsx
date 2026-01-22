import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

// Define progress bar types
type ProgressBarType = 'linear' | 'circular' | 'determinate' | 'indeterminate';

// Define progress bar sizes
type ProgressBarSize = 'small' | 'medium' | 'large';

// Props for progress bar indicator
interface ProgressBarIndicatorProps {
  skillName: string;
  progress?: number; // 0-100 percentage
  status?: 'idle' | 'activating' | 'active' | 'deactivating' | 'error' | 'success' | 'warning';
  priority?: 1 | 2 | 3 | 4 | 5;
  type?: ProgressBarType;
  size?: ProgressBarSize;
  className?: string;
  showLabel?: boolean;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  animationDuration?: keyof typeof ANIMATION_DURATIONS | number;
  color?: string;
  backgroundColor?: string;
  height?: number; // For linear progress bars
  strokeWidth?: number; // For circular progress bars
}

const ProgressBarIndicator: React.FC<ProgressBarIndicatorProps> = ({
  skillName,
  progress = 0,
  status = 'idle',
  priority = 3,
  type = 'linear',
  size = 'medium',
  className = '',
  showLabel = true,
  labelPosition = 'top',
  animationDuration = 'normal',
  color = 'bg-blue-500',
  backgroundColor = 'bg-gray-200',
  height = 8,
  strokeWidth = 8
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();
  const [localProgress, setLocalProgress] = useState(progress);

  // Size classes
  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  // Status colors override
  const statusColors = {
    idle: 'bg-gray-500',
    activating: 'bg-blue-500',
    active: 'bg-green-500',
    deactivating: 'bg-yellow-500',
    error: 'bg-red-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
  };

  // Determine animation duration value
  const durationValue =
    typeof animationDuration === 'number'
      ? animationDuration
      : ANIMATION_DURATIONS[animationDuration];

  // Update local progress when prop changes
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled) {
    return (
      <div className={`flex flex-col ${sizeClasses[size]} ${className}`}>
        {showLabel && labelPosition === 'top' && (
          <div className="mb-1 text-xs text-gray-600">{skillName} {localProgress}%</div>
        )}

        <div className={`w-full ${backgroundColor} rounded-full overflow-hidden`}>
          <div
            className={`${statusColors[status]} h-${height} rounded-full`}
            style={{ width: `${localProgress}%` }}
          />
        </div>

        {showLabel && labelPosition === 'bottom' && (
          <div className="mt-1 text-xs text-gray-600">{skillName} {localProgress}%</div>
        )}
      </div>
    );
  }

  // Linear progress bar component
  const LinearProgressBar = () => (
    <div className="w-full relative">
      <div className={`${backgroundColor} w-full h-${height} rounded-full overflow-hidden`}>
        <motion.div
          className={`${statusColors[status]} h-full rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${localProgress}%` }}
          transition={{
            duration: durationValue,
            ease: EASING_PRESETS.easeInOut,
          }}
          style={{ minWidth: '5%' }} // Ensure visibility even at low progress
        />
      </div>

      {/* Pulsing effect for active state */}
      {status === 'active' && (
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [`transparent`, `rgba(255,255,255,0.2)`, `transparent`],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  );

  // Circular progress bar component
  const CircularProgressBar = () => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (localProgress / 100) * circumference;

    return (
      <div className="relative">
        <svg
          width={strokeWidth * 5}
          height={strokeWidth * 5}
          viewBox="0 0 100 100"
          className="transform -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={status === 'idle' ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.3)'}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            stroke={statusColors[status].replace('bg-', '')}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeDashoffset }}
            transition={{
              duration: durationValue,
              ease: EASING_PRESETS.easeInOut,
            }}
          />
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {localProgress}%
          </div>
        )}
      </div>
    );
  };

  // Indeterminate progress bar component
  const IndeterminateProgressBar = () => (
    <div className="w-full relative">
      <div className={`${backgroundColor} w-full h-${height} rounded-full overflow-hidden`}>
        <motion.div
          className={`${statusColors[status]} h-full rounded-full`}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    </div>
  );

  // Select the appropriate progress bar component
  const renderProgressBar = () => {
    if (type === 'indeterminate') {
      return <IndeterminateProgressBar />;
    } else if (type === 'circular') {
      return <CircularProgressBar />;
    } else {
      return <LinearProgressBar />;
    }
  };

  // Label positioning
  const renderWithLabel = () => {
    switch (labelPosition) {
      case 'top':
        return (
          <div className="flex flex-col items-center">
            {showLabel && (
              <div className="mb-1 text-xs text-gray-600 font-medium">
                {skillName} {localProgress}%
                {priority > 3 && <span className="ml-1 text-yellow-500">★</span>}
              </div>
            )}
            {renderProgressBar()}
          </div>
        );
      case 'bottom':
        return (
          <div className="flex flex-col items-center">
            {renderProgressBar()}
            {showLabel && (
              <div className="mt-1 text-xs text-gray-600 font-medium">
                {skillName} {localProgress}%
                {priority > 3 && <span className="ml-1 text-yellow-500">★</span>}
              </div>
            )}
          </div>
        );
      case 'left':
        return (
          <div className="flex items-center">
            {showLabel && (
              <div className="mr-2 text-xs text-gray-600 font-medium min-w-[100px]">
                {skillName} {localProgress}%
                {priority > 3 && <span className="ml-1 text-yellow-500">★</span>}
              </div>
            )}
            {renderProgressBar()}
          </div>
        );
      case 'right':
        return (
          <div className="flex items-center">
            {renderProgressBar()}
            {showLabel && (
              <div className="ml-2 text-xs text-gray-600 font-medium min-w-[100px]">
                {skillName} {localProgress}%
                {priority > 3 && <span className="ml-1 text-yellow-500">★</span>}
              </div>
            )}
          </div>
        );
      default:
        return renderProgressBar();
    }
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {renderWithLabel()}
    </div>
  );
};

// Skill progress tracker component
interface SkillProgressTrackerProps {
  skills: Array<{
    name: string;
    progress: number;
    status: 'idle' | 'activating' | 'active' | 'deactivating' | 'error' | 'success' | 'warning';
    priority?: 1 | 2 | 3 | 4 | 5;
  }>;
  type?: ProgressBarType;
  size?: ProgressBarSize;
  className?: string;
}

export const SkillProgressTracker: React.FC<SkillProgressTrackerProps> = ({
  skills,
  type = 'linear',
  size = 'medium',
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {skills.map((skill, index) => (
        <ProgressBarIndicator
          key={`${skill.name}-${index}`}
          skillName={skill.name}
          progress={skill.progress}
          status={skill.status}
          priority={skill.priority || 3}
          type={type}
          size={size}
        />
      ))}
    </div>
  );
};

// Animated skill processing indicator
interface AnimatedSkillProcessorProps {
  skillName: string;
  processingTime?: number; // Estimated time in seconds
  onComplete?: () => void;
  className?: string;
}

export const AnimatedSkillProcessor: React.FC<AnimatedSkillProcessorProps> = ({
  skillName,
  processingTime = 5,
  onComplete,
  className = ''
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'activating' | 'active' | 'deactivating' | 'success' | 'error'>('activating');

  useEffect(() => {
    setStatus('activating');

    const timer = setTimeout(() => {
      setStatus('active');

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (processingTime * 10));

          if (newProgress >= 100) {
            clearInterval(progressInterval);
            setStatus('deactivating');

            setTimeout(() => {
              setStatus('success');
              if (onComplete) onComplete();
            }, 500);

            return 100;
          }

          return newProgress;
        });
      }, 100);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [processingTime, onComplete]);

  return (
    <div className={`p-3 bg-white rounded-lg shadow ${className}`}>
      <ProgressBarIndicator
        skillName={skillName}
        progress={progress}
        status={status}
        priority={5}
        type="linear"
        showLabel={true}
      />
    </div>
  );
};

export default ProgressBarIndicator;