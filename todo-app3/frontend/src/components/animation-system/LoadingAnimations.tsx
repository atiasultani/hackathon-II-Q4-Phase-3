import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

// Define loading animation types
type LoadingType =
  | 'spinner'
  | 'dots'
  | 'bars'
  | 'pulse'
  | 'wave'
  | 'orbit'
  | 'fill'
  | 'bounce'
  | 'custom';

// Define loading sizes
type LoadingSize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';

// Props for loading animation
interface LoadingAnimationProps {
  type?: LoadingType;
  size?: LoadingSize;
  color?: string;
  loadingText?: string;
  isLoading?: boolean;
  progress?: number; // 0-100 for determinate loaders
  className?: string;
  animationDuration?: keyof typeof ANIMATION_DURATIONS | number;
  showProgress?: boolean;
  children?: React.ReactNode;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'spinner',
  size = 'medium',
  color = 'indigo',
  loadingText = 'Loading...',
  isLoading = true,
  progress,
  className = '',
  animationDuration = 'normal',
  showProgress = false,
  children
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();

  // Size classes
  const sizeClasses = {
    tiny: 'w-4 h-4 text-xs',
    small: 'w-6 h-6 text-sm',
    medium: 'w-8 h-8 text-base',
    large: 'w-12 h-12 text-lg',
    xlarge: 'w-16 h-16 text-xl',
  };

  // Determine animation duration value
  const durationValue =
    typeof animationDuration === 'number'
      ? animationDuration
      : ANIMATION_DURATIONS[animationDuration];

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {isLoading && (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span className="ml-2">{loadingText}</span>
          </>
        )}
        {!isLoading && children}
      </div>
    );
  }

  // Render different loading types
  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <motion.div
            className={`${sizeClasses[size]} border-4 border-current border-t-transparent rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );

      case 'dots':
        return (
          <div className={`flex ${sizeClasses[size].split(' ')[0]} space-x-1 items-center`}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`h-2 w-2 bg-current rounded-full`}
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: EASING_PRESETS.easeInOut
                }}
              />
            ))}
          </div>
        );

      case 'bars':
        return (
          <div className={`flex ${sizeClasses[size].split(' ')[0]} items-end space-x-1`}>
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className={`w-1 bg-current rounded-t`}
                style={{ height: `${size === 'tiny' ? 8 : size === 'small' ? 12 : size === 'medium' ? 16 : size === 'large' ? 24 : 32}px` }}
                animate={{
                  scaleY: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.1,
                  ease: EASING_PRESETS.easeInOut
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${sizeClasses[size]} bg-current rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: EASING_PRESETS.easeInOut
            }}
          />
        );

      case 'wave':
        return (
          <div className={`flex ${sizeClasses[size].split(' ')[0]} items-end space-x-1`}>
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className={`w-1 bg-current rounded-t`}
                style={{ height: `${size === 'tiny' ? 8 : size === 'small' ? 12 : size === 'medium' ? 16 : size === 'large' ? 24 : 32}px` }}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: EASING_PRESETS.easeInOut
                }}
              />
            ))}
          </div>
        );

      case 'orbit':
        return (
          <div className={`${sizeClasses[size]} relative`}>
            <motion.div
              className="absolute inset-0 border-2 border-current rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute top-0 left-1/2 w-2 h-2 bg-current rounded-full"
              animate={{
                x: [0, 20, 0, -20, 0],
                y: [0, -20, -40, -20, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: EASING_PRESETS.easeInOut
              }}
            />
          </div>
        );

      case 'fill':
        if (progress !== undefined) {
          return (
            <div className={`${sizeClasses[size]} w-full bg-gray-200 rounded-full overflow-hidden`}>
              <motion.div
                className="h-full bg-current rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{
                  duration: durationValue,
                  ease: EASING_PRESETS.easeInOut
                }}
              />
            </div>
          );
        }
        return (
          <motion.div
            className={`${sizeClasses[size]} bg-current rounded-full`}
            animate={{
              width: ["10%", "100%", "10%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: EASING_PRESETS.easeInOut
            }}
          />
        );

      case 'bounce':
        return (
          <motion.div
            className={`${sizeClasses[size]} bg-current rounded-full`}
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: EASING_PRESETS.easeInOut
            }}
          />
        );

      default:
        return (
          <motion.div
            className={`${sizeClasses[size]} border-4 border-current border-t-transparent rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        );
    }
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={`inline-flex flex-col items-center justify-center text-${color}-500 ${className}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {renderLoader()}

          {(loadingText || showProgress) && (
            <div className="mt-2 text-center">
              {loadingText && (
                <div className="text-sm font-medium text-gray-600">{loadingText}</div>
              )}
              {showProgress && progress !== undefined && (
                <div className="text-xs text-gray-500 mt-1">{progress}%</div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {!isLoading && children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Loading overlay component
interface LoadingOverlayProps {
  isLoading?: boolean;
  text?: string;
  type?: LoadingType;
  className?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = false,
  text = 'Loading...',
  type = 'spinner',
  className = '',
  children
}) => {
  return (
    <div className="relative">
      {children}

      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center">
              <LoadingAnimation type={type} isLoading={true} />
              <div className="mt-4 text-white text-center">{text}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Page loading component
interface PageLoadingProps {
  isLoading?: boolean;
  className?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  isLoading = false,
  className = ''
}) => {
  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 bg-white z-50 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingAnimation type="spinner" size="large" color="indigo" />
        <div className="mt-4 text-lg font-medium text-gray-700">Loading application...</div>
      </div>
    </div>
  );
};

// Skeleton loader component
interface SkeletonLoaderProps {
  type?: 'text' | 'image' | 'card' | 'list-item';
  count?: number;
  className?: string;
  animation?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  count = 1,
  className = '',
  animation = true
}) => {
  const skeletonClasses = {
    text: 'h-4 rounded',
    image: 'rounded-lg',
    card: 'rounded-xl',
    'list-item': 'h-16 rounded-lg',
  };

  const widths = {
    text: ['w-full', 'w-5/6', 'w-4/6'],
    image: ['w-full', 'h-48'],
    card: ['w-full', 'h-32'],
    'list-item': ['w-full'],
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={`bg-gray-200 ${skeletonClasses[type]} ${
            type === 'image' || type === 'card' ? 'aspect-video' : ''
          } ${widths[type].join(' ')}`}
          animate={animation ? {
            opacity: [0.6, 1, 0.6],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: EASING_PRESETS.easeInOut
          }}
        />
      ))}
    </div>
  );
};

// Loading context provider
interface LoadingContextProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
}

const LoadingContext = React.createContext<LoadingContextProps | undefined>(undefined);

export const useLoading = () => {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <LoadingContext.Provider value={{ loading, setLoading, progress, setProgress }}>
      {children}
      <LoadingOverlay isLoading={loading} />
    </LoadingContext.Provider>
  );
};

export default LoadingAnimation;