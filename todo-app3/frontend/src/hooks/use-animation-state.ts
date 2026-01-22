import { useState, useEffect, useCallback } from 'react';
import { optimizeAnimationForDevice } from '../utils/animation-utils';

// Types for animation state
export type AnimationState = {
  avatarExpression: string;
  animationSequence: string[];
  isActive: boolean;
  triggerEvent: string;
  duration: number;
  intensity: number;
};

export type AgentActivity = {
  agentName: string;
  status: 'idle' | 'activating' | 'active' | 'deactivating' | 'error';
  startTime: Date;
  endTime?: Date;
  visualIndicator: string;
  priority: number;
  conversationId?: string;
};

export type UserPreference = {
  animationsEnabled: boolean;
  animationSpeed: number;
  motionSensitivity: 'low' | 'medium' | 'high';
  colorTheme: string;
  avatarStyle: string;
};

// Hook for managing animation state
export const useAnimationState = () => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    avatarExpression: 'neutral',
    animationSequence: [],
    isActive: false,
    triggerEvent: '',
    duration: 300,
    intensity: 5,
  });

  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreference>({
    animationsEnabled: true,
    animationSpeed: 1,
    motionSensitivity: 'medium',
    colorTheme: 'default',
    avatarStyle: 'default',
  });

  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 60,
    shouldOptimize: false,
    reducedMotion: false,
    isLowEnd: false,
  });

  // Initialize performance metrics
  useEffect(() => {
    const perfData = optimizeAnimationForDevice();

    setPerformanceMetrics(prev => ({
      ...prev,
      shouldOptimize: perfData.shouldOptimize,
      reducedMotion: perfData.reducedMotion,
      isLowEnd: perfData.isLowEnd,
    }));

    // Monitor FPS if needed
    // In a real implementation, you would connect this to actual FPS monitoring
  }, []);

  // Update animation state based on trigger event
  const updateAnimationState = useCallback((newState: Partial<AnimationState>) => {
    setAnimationState(prev => ({ ...prev, ...newState }));
  }, []);

  // Update agent activity
  const updateAgentActivity = useCallback((agentName: string, activity: Partial<AgentActivity>) => {
    setAgentActivities(prev => {
      const existingIndex = prev.findIndex(a => a.agentName === agentName);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...activity };
        return updated;
      } else {
        return [
          ...prev,
          {
            agentName,
            status: 'idle',
            startTime: new Date(),
            visualIndicator: 'default',
            priority: 3,
            ...activity,
          },
        ];
      }
    });
  }, []);

  // Reset animation state
  const resetAnimationState = useCallback(() => {
    setAnimationState({
      avatarExpression: 'neutral',
      animationSequence: [],
      isActive: false,
      triggerEvent: '',
      duration: 300,
      intensity: 5,
    });
  }, []);

  // Update user preferences
  const updateUserPreferences = useCallback((preferences: Partial<UserPreference>) => {
    setUserPreferences(prev => ({ ...prev, ...preferences }));
  }, []);

  // Check if animations should run based on preferences and performance
  const shouldAnimate = useCallback(() => {
    return (
      userPreferences.animationsEnabled &&
      !performanceMetrics.reducedMotion &&
      !performanceMetrics.shouldOptimize
    );
  }, [userPreferences.animationsEnabled, performanceMetrics.reducedMotion, performanceMetrics.shouldOptimize]);

  return {
    animationState,
    agentActivities,
    userPreferences,
    performanceMetrics,
    updateAnimationState,
    updateAgentActivity,
    resetAnimationState,
    updateUserPreferences,
    shouldAnimate,
  };
};