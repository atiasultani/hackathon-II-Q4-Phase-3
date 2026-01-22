/**
 * Shared Animation Utility Functions
 * Provides common animation utilities for the AI Animated Frontend
 */

// Animation easing presets
export const EASING_PRESETS = {
  easeInOut: [0.455, 0.03, 0.515, 0.955],
  easeIn: [0.55, 0.085, 0.68, 0.53],
  easeOut: [0.25, 0.46, 0.45, 0.94],
  linear: [0.25, 0.25, 0.75, 0.75],
};

// Animation duration presets
export const ANIMATION_DURATIONS = {
  instant: 0.1,
  quick: 0.2,
  normal: 0.3,
  slow: 0.5,
  extraSlow: 0.8,
};

// Animation variants factory function
export const createAnimationVariants = (config: {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
}) => ({
  initial: config.initial || {},
  animate: config.animate || {},
  exit: config.exit || {},
  transition: config.transition || {},
});

// FPS monitoring utility
export const monitorFPS = (callback: (fps: number) => void) => {
  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;

  const updateFPS = () => {
    const currentTime = performance.now();
    frameCount++;

    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      callback(fps);

      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(updateFPS);
  };

  requestAnimationFrame(updateFPS);
  return { stop: () => {} }; // Simple implementation
};

// Animation performance optimizer
export const optimizeAnimationForDevice = () => {
  // Check if prefers-reduced-motion is enabled
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check device performance capabilities
  const isLowEndDevice = () => {
    const nav = navigator as any;
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 4;

    return cores <= 2 || memory <= 2;
  };

  return {
    reducedMotion,
    isLowEnd: isLowEndDevice(),
    shouldOptimize: reducedMotion || isLowEndDevice(),
  };
};

// Animation state utilities
export const calculateAnimationIntensity = (baseIntensity: number, userPreference: number = 1) => {
  return Math.min(baseIntensity * userPreference, 10);
};

// Frame rate cap utility
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