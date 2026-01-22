import React, { useEffect, useRef } from 'react';
import { useAnimationState } from '../../hooks/use-animation-state';
import { PerformanceMonitor, initializePerformanceMonitoring } from '../../utils/performance-utils';
import { optimizeAnimationForDevice } from '../../utils/animation-utils';

interface AvatarPerformanceMonitorProps {
  children: React.ReactNode;
  enabled?: boolean;
  fpsThreshold?: number;
  className?: string;
}

const AvatarPerformanceMonitor: React.FC<AvatarPerformanceMonitorProps> = ({
  children,
  enabled = true,
  fpsThreshold = 30,
  className = ''
}) => {
  const { performanceMetrics, updateUserPreferences } = useAnimationState();
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const lastCheckedRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!enabled) return;

    // Initialize performance monitoring
    const cleanup = initializePerformanceMonitoring();

    // Get the global performance monitor instance
    monitorRef.current = PerformanceMonitor.getInstance();

    // Subscribe to FPS changes
    const unsubscribeFPS = monitorRef.current.subscribeToFPS((fps) => {
      // Update performance metrics in the global context
      // This would typically update the state in useAnimationState hook
    });

    // Check performance periodically and adjust animations if needed
    const performanceCheckInterval = setInterval(() => {
      const currentFPS = monitorRef.current?.getCurrentFPS() || 60;
      const deviceCaps = optimizeAnimationForDevice();

      // If FPS drops below threshold, adjust animation preferences
      if (currentFPS < fpsThreshold && deviceCaps.isLowEnd) {
        // Reduce animation intensity
        updateUserPreferences({
          animationSpeed: Math.max(0.5, performanceMetrics.animationSpeed * 0.9),
          animationsEnabled: performanceMetrics.fps > 15, // Disable if really slow
        });
      } else if (currentFPS > fpsThreshold + 10) {
        // Gradually restore animation preferences if performance improves
        updateUserPreferences({
          animationSpeed: Math.min(1.0, performanceMetrics.animationSpeed * 1.05),
        });
      }
    }, 5000); // Check every 5 seconds

    return () => {
      unsubscribeFPS();
      clearInterval(performanceCheckInterval);
      if (cleanup) cleanup();
    };
  }, [enabled, fpsThreshold, updateUserPreferences, performanceMetrics]);

  // Performance overlay for debugging
  const PerformanceOverlay = () => {
    if (!enabled) return null;

    const currentFPS = monitorRef.current?.getCurrentFPS() || 0;
    const perfScore = monitorRef.current?.calculatePerformanceScore() || 100;
    const deviceCaps = optimizeAnimationForDevice();

    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded shadow-lg z-50">
        <div>FPS: {currentFPS}</div>
        <div>Score: {perfScore}/100</div>
        <div>Low End: {deviceCaps.isLowEnd ? 'Yes' : 'No'}</div>
        <div>Reduced Motion: {deviceCaps.reducedMotion ? 'Yes' : 'No'}</div>
        <div>Should Optimize: {deviceCaps.shouldOptimize ? 'Yes' : 'No'}</div>
      </div>
    );
  };

  return (
    <div className={className}>
      {children}
      <PerformanceOverlay />
    </div>
  );
};

// HOC to wrap avatar components with performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Partial<Omit<AvatarPerformanceMonitorProps, 'children'>>
) => {
  return (props: P) => (
    <AvatarPerformanceMonitor {...options}>
      <Component {...props} />
    </AvatarPerformanceMonitor>
  );
};

// Custom hook for performance-aware animations
export const usePerformanceAwareAnimation = () => {
  const { performanceMetrics, shouldAnimate } = useAnimationState();
  const monitor = PerformanceMonitor.getInstance();

  // Get current performance metrics
  const getPerformanceMetrics = () => {
    return monitor.getPerformanceMetrics();
  };

  // Check if animations should be simplified based on performance
  const shouldSimplifyAnimations = (): boolean => {
    const currentFPS = monitor.getCurrentFPS();
    const perfScore = monitor.calculatePerformanceScore();

    return (
      currentFPS < 20 ||
      perfScore < 60 ||
      performanceMetrics.shouldOptimize
    );
  };

  // Get optimized animation props based on performance
  const getOptimizedAnimationProps = (defaultProps: any) => {
    if (!shouldAnimate() || shouldSimplifyAnimations()) {
      return {
        ...defaultProps,
        transition: { duration: 0 }, // Instant animations when performance is poor
      };
    }

    // Adjust animation speed based on performance
    const perfScore = monitor.calculatePerformanceScore();
    const speedMultiplier = perfScore > 80 ? 1 : perfScore > 60 ? 0.8 : 0.5;

    return {
      ...defaultProps,
      transition: {
        ...defaultProps.transition,
        duration: (defaultProps.transition?.duration || 0.5) * speedMultiplier,
      },
    };
  };

  return {
    performanceMetrics: getPerformanceMetrics(),
    shouldSimplifyAnimations,
    getOptimizedAnimationProps,
    currentFPS: monitor.getCurrentFPS(),
    performanceScore: monitor.calculatePerformanceScore(),
  };
};

// Component to conditionally render optimized versions of avatars
interface ConditionalAvatarRendererProps {
  children: (optimized: boolean) => React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalAvatarRenderer: React.FC<ConditionalAvatarRendererProps> = ({
  children,
  fallback
}) => {
  const { shouldAnimate } = useAnimationState();
  const { shouldSimplifyAnimations } = usePerformanceAwareAnimation();

  const isOptimized = !shouldAnimate() || shouldSimplifyAnimations();

  if (isOptimized && fallback) {
    return <>{fallback}</>;
  }

  return <>{children(isOptimized)}</>;
};

export default AvatarPerformanceMonitor;