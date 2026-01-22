/**
 * Performance Monitoring Utilities for Animation System
 * Measures and optimizes animation performance
 */

// FPS counter
export class FPSCounter {
  private frameCount: number;
  private lastTime: number;
  private fps: number;
  private callbacks: ((fps: number) => void)[];

  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.callbacks = [];
  }

  public tick = () => {
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Notify all callbacks
      this.callbacks.forEach(callback => callback(this.fps));
    }
  };

  public subscribe = (callback: (fps: number) => void) => {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  };

  public getFPS = (): number => {
    return this.fps;
  };
}

// Performance monitor singleton
let performanceMonitorInstance: PerformanceMonitor | null = null;

export class PerformanceMonitor {
  private fpsCounter: FPSCounter;
  private observers: PerformanceObserverEntryList[];
  private memoryUsage: number | null;
  private isMonitoring: boolean;

  constructor() {
    this.fpsCounter = new FPSCounter();
    this.observers = [];
    this.memoryUsage = null;
    this.isMonitoring = false;
  }

  // Singleton pattern
  static getInstance(): PerformanceMonitor {
    if (!performanceMonitorInstance) {
      performanceMonitorInstance = new PerformanceMonitor();
    }
    return performanceMonitorInstance;
  }

  // Start monitoring
  public startMonitoring = () => {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor FPS
    const fpsInterval = setInterval(() => {
      this.fpsCounter.tick();
    }, 1000 / 60); // ~60 times per second

    // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => {
        this.memoryUsage = (performance as any).memory.usedJSHeapSize;
      }, 5000);
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new (window as any).PerformanceObserver((list: any) => {
        const perfEntries = list.getEntries();
        for (let i = 0; i < perfEntries.length; i++) {
          if (perfEntries[i].duration > 50) { // Long task threshold (50ms)
            console.warn('Long task detected:', perfEntries[i]);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }

    // Cleanup function
    return () => {
      clearInterval(fpsInterval);
      this.observers.forEach(obs => obs.disconnect());
      this.isMonitoring = false;
    };
  };

  // Get current FPS
  public getCurrentFPS = (): number => {
    return this.fpsCounter.getFPS();
  };

  // Subscribe to FPS changes
  public subscribeToFPS = (callback: (fps: number) => void) => {
    return this.fpsCounter.subscribe(callback);
  };

  // Get memory usage
  public getMemoryUsage = (): number | null => {
    return this.memoryUsage;
  };

  // Check if performance is degrading
  public isPerformanceDegraded = (threshold: number = 30): boolean => {
    const currentFPS = this.getCurrentFPS();
    return currentFPS < threshold;
  };

  // Get performance metrics
  public getPerformanceMetrics = () => {
    return {
      fps: this.getCurrentFPS(),
      memoryUsage: this.memoryUsage,
      isMonitoring: this.isMonitoring,
      isPerformanceDegraded: this.isPerformanceDegraded(),
    };
  };

  // Calculate performance score
  public calculatePerformanceScore = (): number => {
    const fps = this.getCurrentFPS();
    const memoryUsage = this.memoryUsage || 0;

    // Normalize FPS (0-100 based on 0-60 FPS range)
    const fpsScore = Math.min(100, Math.max(0, (fps / 60) * 100));

    // Memory score (assuming 100MB as baseline, decrease score with higher memory usage)
    const memoryScore = Math.max(0, 100 - (memoryUsage / (100 * 1024 * 1024)) * 20);

    // Weighted average
    return Math.round((fpsScore * 0.7) + (memoryScore * 0.3));
  };
}

// Animation performance optimizer
export const optimizeAnimationPerformance = (targetFPS: number = 30) => {
  let lastTime = 0;
  const interval = 1000 / targetFPS;

  return (callback: (time: number) => void) => {
    const throttledCallback = (time: number) => {
      if (time >= lastTime + interval) {
        lastTime = time;
        callback(time);
      }
      requestAnimationFrame(throttledCallback);
    };

    requestAnimationFrame(throttledCallback);
  };
};

// Animation frame limiter
export class AnimationFrameLimiter {
  private maxFPS: number;
  private interval: number;
  private lastTime: number;

  constructor(maxFPS: number = 60) {
    this.maxFPS = maxFPS;
    this.interval = 1000 / maxFPS;
    this.lastTime = 0;
  }

  public execute = (callback: () => void) => {
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + this.interval) {
      this.lastTime = currentTime;
      callback();
      return true;
    }
    return false;
  };
}

// Device capability detector
export const detectDeviceCapabilities = () => {
  if (typeof navigator === 'undefined') {
    return {
      hardwareConcurrency: 4,
      deviceMemory: 4,
      supportsWebGL: false,
      isMobile: false,
    };
  }

  const nav = navigator as any;

  return {
    hardwareConcurrency: nav.hardwareConcurrency || 4,
    deviceMemory: nav.deviceMemory || 4,
    supportsWebGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
                  (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    })(),
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  };
};

// Performance recommendation engine
export const getPerformanceRecommendations = (currentFPS: number, deviceCapabilities: any) => {
  const recommendations: string[] = [];

  if (currentFPS < 20) {
    recommendations.push('Significant performance degradation detected - consider simplifying animations');
  } else if (currentFPS < 30) {
    recommendations.push('Performance below target - consider reducing animation complexity');
  }

  if (deviceCapabilities.hardwareConcurrency <= 2) {
    recommendations.push('Low CPU core count detected - optimize animations for performance');
  }

  if (deviceCapabilities.deviceMemory <= 2) {
    recommendations.push('Limited memory detected - reduce animation memory footprint');
  }

  if (!deviceCapabilities.supportsWebGL) {
    recommendations.push('WebGL not supported - falling back to CSS animations');
  }

  return recommendations;
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  const monitor = PerformanceMonitor.getInstance();
  return monitor.startMonitoring();
};