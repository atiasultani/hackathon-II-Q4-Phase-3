import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceMonitor } from '../utils/performance-utils';
import { useAnimationState } from '../hooks/use-animation-state';

// Animation optimization configuration
interface AnimationOptimizerConfig {
  targetFPS: number;
  maxConcurrentAnimations: number;
  complexityThreshold: number; // 0-1 scale for animation complexity
  performanceSamplingInterval: number; // ms between performance samples
  fpsRecoveryThreshold: number; // FPS at which to increase complexity
  complexityReductionFactor: number; // How much to reduce complexity when needed
  animationBatchSize: number; // How many animations to batch together
}

// Default configuration
const DEFAULT_CONFIG: AnimationOptimizerConfig = {
  targetFPS: 30,
  maxConcurrentAnimations: 10,
  complexityThreshold: 0.7, // 70% complexity as the threshold
  performanceSamplingInterval: 1000, // Sample performance every second
  fpsRecoveryThreshold: 35, // Increase complexity when FPS goes above this
  complexityReductionFactor: 0.8, // Reduce to 80% when performance drops
  animationBatchSize: 5, // Process animations in batches of 5
};

// Animation complexity levels
export type AnimationComplexity = 'low' | 'medium' | 'high' | 'adaptive';

// Animation optimization service
class AnimationOptimizerService {
  private static instance: AnimationOptimizerService | null = null;
  private config: AnimationOptimizerConfig;
  private performanceMonitor: PerformanceMonitor;
  private currentComplexity: AnimationComplexity = 'adaptive';
  private activeAnimations: Set<string> = new Set();
  private complexityLevel: number = 1.0; // 0-1 scale
  private samplingInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(complexity: number, fps: number) => void> = [];

  private constructor(config: AnimationOptimizerConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.startPerformanceSampling();
  }

  // Singleton pattern
  static getInstance(config?: AnimationOptimizerConfig): AnimationOptimizerService {
    if (!AnimationOptimizerService.instance) {
      AnimationOptimizerService.instance = new AnimationOptimizerService(config);
    }
    return AnimationOptimizerService.instance;
  }

  // Start performance sampling
  private startPerformanceSampling(): void {
    this.samplingInterval = setInterval(() => {
      this.samplePerformance();
    }, this.config.performanceSamplingInterval);
  }

  // Sample performance and adjust complexity
  private samplePerformance(): void {
    const currentFPS = this.performanceMonitor.getCurrentFPS();
    const perfScore = this.performanceMonitor.calculatePerformanceScore();

    // Adjust complexity based on FPS
    if (currentFPS < this.config.targetFPS * 0.8) {
      // Performance is dropping, reduce complexity
      this.reduceComplexity();
    } else if (currentFPS > this.config.fpsRecoveryThreshold) {
      // Performance is recovering, gradually increase complexity
      this.increaseComplexity();
    }

    // Notify listeners
    this.notifyListeners();
  }

  // Reduce animation complexity
  private reduceComplexity(): void {
    if (this.complexityLevel > 0.2) { // Don't go below 20% complexity
      this.complexityLevel = Math.max(
        0.2,
        this.complexityLevel * this.config.complexityReductionFactor
      );
    }
  }

  // Increase animation complexity
  private increaseComplexity(): void {
    if (this.complexityLevel < 1.0) { // Don't exceed 100% complexity
      this.complexityLevel = Math.min(
        1.0,
        this.complexityLevel * 1.1 // Increase by 10%
      );
    }
  }

  // Add complexity listener
  public addComplexityListener(callback: (complexity: number, fps: number) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify complexity listeners
  private notifyListeners(): void {
    const currentFPS = this.performanceMonitor.getCurrentFPS();
    this.listeners.forEach(listener => {
      try {
        listener(this.complexityLevel, currentFPS);
      } catch (error) {
        console.error('Error in complexity listener:', error);
      }
    });
  }

  // Register an active animation
  public registerAnimation(animationId: string): boolean {
    if (this.activeAnimations.size >= this.config.maxConcurrentAnimations) {
      // Too many animations, reject this one
      return false;
    }

    this.activeAnimations.add(animationId);
    return true;
  }

  // Unregister an animation
  public unregisterAnimation(animationId: string): void {
    this.activeAnimations.delete(animationId);
  }

  // Get current complexity level (0-1 scale)
  public getComplexityLevel(): number {
    return this.complexityLevel;
  }

  // Get current animation count
  public getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  // Get current FPS
  public getCurrentFPS(): number {
    return this.performanceMonitor.getCurrentFPS();
  }

  // Get performance score
  public getPerformanceScore(): number {
    return this.performanceMonitor.calculatePerformanceScore();
  }

  // Optimize animation properties based on current complexity
  public optimizeAnimationProps(props: any): any {
    if (this.complexityLevel >= 0.9) {
      // High complexity - use full properties
      return props;
    } else if (this.complexityLevel >= 0.6) {
      // Medium complexity - reduce some properties
      return {
        ...props,
        duration: props.duration ? props.duration * 1.2 : 0.5,
        repeat: props.repeat ? 1 : undefined,
        easing: props.easing || 'easeInOut',
      };
    } else {
      // Low complexity - simplify significantly
      return {
        ...props,
        duration: props.duration ? Math.max(props.duration * 1.5, 0.3) : 0.3,
        repeat: 0,
        type: 'tween', // Use simpler animation type
      };
    }
  }

  // Batch animations for performance
  public batchAnimations(animations: Array<() => void>): void {
    const batchSize = this.config.animationBatchSize;

    for (let i = 0; i < animations.length; i += batchSize) {
      const batch = animations.slice(i, i + batchSize);

      // Execute batch with slight delay to prevent blocking
      setTimeout(() => {
        batch.forEach(anim => anim());
      }, 0);
    }
  }

  // Check if we should skip animations for performance
  public shouldSkipAnimations(): boolean {
    const currentFPS = this.getCurrentFPS();
    return currentFPS < this.config.targetFPS * 0.6; // Skip if FPS is below 60% of target
  }

  // Get optimized animation configuration
  public getOptimizedConfig(): AnimationOptimizerConfig {
    return {
      ...this.config,
      complexityThreshold: this.complexityLevel,
    };
  }

  // Set animation complexity directly (for manual control)
  public setComplexity(complexity: number): void {
    this.complexityLevel = Math.max(0.1, Math.min(1.0, complexity));
    this.notifyListeners();
  }

  // Cleanup method
  public destroy(): void {
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
    this.listeners = [];
    this.activeAnimations.clear();
  }
}

// React hook for animation optimization
export const useAnimationOptimizer = (config?: AnimationOptimizerConfig) => {
  const [complexity, setComplexity] = useState<number>(1.0);
  const [currentFPS, setCurrentFPS] = useState<number>(60);
  const [activeAnimations, setActiveAnimations] = useState<number>(0);
  const { performanceMetrics } = useAnimationState();

  const optimizer = AnimationOptimizerService.getInstance(config);

  useEffect(() => {
    const unsubscribe = optimizer.addComplexityListener((level, fps) => {
      setComplexity(level);
      setCurrentFPS(fps);
      setActiveAnimations(optimizer.getActiveAnimationCount());
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const registerAnimation = useCallback((id: string) => {
    return optimizer.registerAnimation(id);
  }, []);

  const unregisterAnimation = useCallback((id: string) => {
    optimizer.unregisterAnimation(id);
  }, []);

  const optimizeProps = useCallback((props: any) => {
    return optimizer.optimizeAnimationProps(props);
  }, []);

  const shouldSkipAnimations = useCallback(() => {
    return optimizer.shouldSkipAnimations() || performanceMetrics.shouldOptimize;
  }, [performanceMetrics]);

  return {
    complexity,
    currentFPS,
    activeAnimations,
    registerAnimation,
    unregisterAnimation,
    optimizeProps,
    shouldSkipAnimations,
    setComplexity: optimizer.setComplexity.bind(optimizer),
    getPerformanceScore: optimizer.getPerformanceScore.bind(optimizer),
    getOptimizedConfig: optimizer.getOptimizedConfig.bind(optimizer),
  };
};

// Animation optimizer component
interface AnimationOptimizerProps {
  children: React.ReactNode;
  config?: AnimationOptimizerConfig;
  className?: string;
}

export const AnimationOptimizer: React.FC<AnimationOptimizerProps> = ({
  children,
  config,
  className = ''
}) => {
  const { complexity, currentFPS, shouldSkipAnimations } = useAnimationOptimizer(config);

  // Apply optimization classes based on complexity
  const optimizedClassName = `${className} ${
    complexity < 0.5 ? 'low-complexity' :
    complexity < 0.8 ? 'medium-complexity' : 'high-complexity'
  }`;

  // Show performance overlay in development
  const showPerformanceOverlay = process.env.NODE_ENV === 'development';

  return (
    <div className={optimizedClassName}>
      {children}

      {showPerformanceOverlay && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-50">
          <div>FPS: {currentFPS}</div>
          <div>Complexity: {(complexity * 100).toFixed(0)}%</div>
          <div>Skipping: {shouldSkipAnimations() ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

// High-order component for optimizing animations
export const withAnimationOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  config?: AnimationOptimizerConfig
) => {
  return (props: P) => (
    <AnimationOptimizer config={config}>
      <Component {...props} />
    </AnimationOptimizer>
  );
};

// Animation complexity context
interface AnimationComplexityContextType {
  complexity: number;
  currentFPS: number;
  registerAnimation: (id: string) => boolean;
  unregisterAnimation: (id: string) => void;
  optimizeProps: (props: any) => any;
  shouldSkipAnimations: () => boolean;
  getPerformanceScore: () => number;
}

const AnimationComplexityContext = React.createContext<AnimationComplexityContextType | undefined>(undefined);

export const useAnimationComplexity = (): AnimationComplexityContextType => {
  const context = React.useContext(AnimationComplexityContext);
  if (!context) {
    throw new Error('useAnimationComplexity must be used within an AnimationComplexityProvider');
  }
  return context;
};

interface AnimationComplexityProviderProps {
  children: React.ReactNode;
  config?: AnimationOptimizerConfig;
}

export const AnimationComplexityProvider: React.FC<AnimationComplexityProviderProps> = ({
  children,
  config
}) => {
  const optimizer = useAnimationOptimizer(config);

  const contextValue: AnimationComplexityContextType = {
    complexity: optimizer.complexity,
    currentFPS: optimizer.currentFPS,
    registerAnimation: optimizer.registerAnimation,
    unregisterAnimation: optimizer.unregisterAnimation,
    optimizeProps: optimizer.optimizeProps,
    shouldSkipAnimations: optimizer.shouldSkipAnimations,
    getPerformanceScore: optimizer.getPerformanceScore,
  };

  return (
    <AnimationComplexityContext.Provider value={contextValue}>
      {children}
    </AnimationComplexityContext.Provider>
  );
};

// Utility function to cap frame rate
export const capFrameRate = (callback: FrameRequestCallback, targetFPS: number = 30) => {
  const interval = 1000 / targetFPS;
  let lastTime = 0;

  const cappedCallback = (time: number) => {
    if (time >= lastTime + interval) {
      lastTime = time;
      callback(time);
    }
    requestAnimationFrame(cappedCallback);
  };

  requestAnimationFrame(cappedCallback);
};

// Export the service instance
export default AnimationOptimizerService.getInstance();