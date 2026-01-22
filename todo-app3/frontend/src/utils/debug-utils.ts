/**
 * Animation Debugging Utilities
 *
 * This file contains utilities for debugging and visualizing the animation system
 */

import { AnimationState, AgentActivity, UserPreferences } from '../types/animation-types';

// Debug event types
export enum DebugEventType {
  EXPRESSION_CHANGE = 'expression_change',
  TYPING_START = 'typing_start',
  TYPING_END = 'typing_end',
  RESPONSE_ANIMATION = 'response_animation',
  PROCESSING_START = 'processing_start',
  PROCESSING_END = 'processing_end',
  PERFORMANCE_UPDATE = 'performance_update',
  AGENT_ACTIVITY = 'agent_activity',
  USER_PREF_CHANGE = 'user_pref_change'
}

// Debug event interface
export interface DebugEvent {
  timestamp: number;
  type: DebugEventType;
  data: any;
  component?: string;
  performance?: {
    fps: number;
    memory: number;
    renderTime: number;
  };
}

// Animation timeline class
export class AnimationTimeline {
  private events: DebugEvent[] = [];
  private maxEvents: number = 1000; // Limit stored events

  /**
   * Add a new event to the timeline
   */
  public addEvent(event: Omit<DebugEvent, 'timestamp'>): void {
    const debugEvent: DebugEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(debugEvent);

    // Maintain maximum event count
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Get all events from the timeline
   */
  public getEvents(): DebugEvent[] {
    return [...this.events];
  }

  /**
   * Get events filtered by type
   */
  public getEventsByType(type: DebugEventType): DebugEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Get events within a time range
   */
  public getEventsInRange(startTime: number, endTime: number): DebugEvent[] {
    return this.events.filter(event =>
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Clear all events
   */
  public clear(): void {
    this.events = [];
  }

  /**
   * Export timeline data as JSON
   */
  public export(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Import timeline data from JSON
   */
  public import(jsonData: string): void {
    try {
      const events = JSON.parse(jsonData);
      if (Array.isArray(events)) {
        this.events = events;
      }
    } catch (error) {
      console.error('Failed to import timeline data:', error);
    }
  }
}

// Debug logger utility
export class DebugLogger {
  private enabled: boolean = true;
  private timeline: AnimationTimeline;

  constructor(timeline: AnimationTimeline) {
    this.timeline = timeline;
  }

  /**
   * Enable or disable logging
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log an animation event
   */
  public logEvent(type: DebugEventType, data: any, component?: string): void {
    if (!this.enabled) return;

    const event: DebugEvent = {
      type,
      data,
      component,
      timestamp: Date.now()
    };

    this.timeline.addEvent(event);

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🎨 Animation Debug: ${type}`);
      console.log('Component:', component || 'Unknown');
      console.log('Data:', data);
      console.log('Timestamp:', new Date(event.timestamp).toISOString());
      console.groupEnd();
    }
  }

  /**
   * Log animation state changes
   */
  public logStateChange(newState: Partial<AnimationState>, prevState: Partial<AnimationState>): void {
    const changes: any = {};
    Object.keys(newState).forEach(key => {
      const typedKey = key as keyof AnimationState;
      if (JSON.stringify(prevState[typedKey]) !== JSON.stringify(newState[typedKey])) {
        changes[key] = {
          from: prevState[typedKey],
          to: newState[typedKey]
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      this.logEvent(DebugEventType.EXPRESSION_CHANGE, {
        changes,
        currentState: newState
      }, 'AnimationState');
    }
  }

  /**
   * Log agent activity changes
   */
  public logAgentActivity(activity: AgentActivity): void {
    this.logEvent(DebugEventType.AGENT_ACTIVITY, activity, 'AgentManager');
  }

  /**
   * Log user preference changes
   */
  public logUserPreferenceChange(newPrefs: Partial<UserPreferences>, oldPrefs: Partial<UserPreferences>): void {
    const changes: any = {};
    Object.keys(newPrefs).forEach(key => {
      const typedKey = key as keyof UserPreferences;
      if (JSON.stringify(oldPrefs[typedKey]) !== JSON.stringify(newPrefs[typedKey])) {
        changes[key] = {
          from: oldPrefs[typedKey],
          to: newPrefs[typedKey]
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      this.logEvent(DebugEventType.USER_PREF_CHANGE, {
        changes,
        currentPrefs: newPrefs
      }, 'UserPreferences');
    }
  }

  /**
   * Log performance metrics
   */
  public logPerformance(fps: number, memory: number, renderTime: number): void {
    this.logEvent(DebugEventType.PERFORMANCE_UPDATE, {
      fps,
      memory,
      renderTime,
      timestamp: Date.now()
    }, 'PerformanceMonitor');
  }
}

// Global debug instance
let globalTimeline: AnimationTimeline | null = null;
let globalLogger: DebugLogger | null = null;

/**
 * Get the global animation timeline instance
 */
export const getGlobalTimeline = (): AnimationTimeline => {
  if (!globalTimeline) {
    globalTimeline = new AnimationTimeline();
  }
  return globalTimeline;
};

/**
 * Get the global debug logger instance
 */
export const getGlobalLogger = (): DebugLogger => {
  if (!globalLogger) {
    globalLogger = new DebugLogger(getGlobalTimeline());
  }
  return globalLogger;
};

/**
 * Utility function to measure animation performance
 */
export const measureAnimationPerformance = (callback: () => void): { renderTime: number, fps: number } => {
  const start = performance.now();
  const frameStart = performance.now();

  callback();

  const renderTime = performance.now() - start;

  // Calculate approximate FPS based on render time
  // This is a simplified calculation - in practice, FPS should be measured over time
  const fps = renderTime > 0 ? Math.min(60, Math.floor(1000 / renderTime)) : 60;

  return { renderTime, fps };
};

/**
 * Debug utility to visualize animation properties
 */
export const visualizeAnimationState = (state: AnimationState): string => {
  const { avatarExpression, animationSequence, isActive, intensity, duration } = state;

  return `
Animation State Visualization:
├─ Expression: ${avatarExpression}
├─ Active: ${isActive ? '✓' : '✗'}
├─ Sequence Length: ${animationSequence.length}
├─ Intensity: ${intensity}/10
├─ Duration: ${duration}ms
└─ ${animationSequence.map((anim, idx) => `├─ Seq[${idx}]: ${anim}`).join('\n    ')}
  `;
};

/**
 * Format animation state for debugging display
 */
export const formatAnimationState = (state: AnimationState): any => {
  return {
    expression: state.avatarExpression,
    isActive: state.isActive,
    sequence: state.animationSequence.length,
    intensity: state.intensity,
    duration: state.duration,
    trigger: state.triggerEvent,
    lastUpdate: new Date().toISOString()
  };
};

// Export timeline visualization functions
export const timelineVisualizer = {
  /**
   * Generate ASCII timeline visualization
   */
  asciiTimeline: (events: DebugEvent[], width: number = 50): string => {
    if (events.length === 0) return 'No events to display';

    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;
    const totalTime = endTime - startTime;

    if (totalTime === 0) return 'Insufficient timeline data';

    const timeline: string[] = new Array(width).fill('·');

    events.forEach(event => {
      const position = Math.floor(((event.timestamp - startTime) / totalTime) * (width - 1));
      const symbol = event.type.charAt(0).toUpperCase();
      if (position >= 0 && position < width) {
        timeline[position] = symbol;
      }
    });

    return timeline.join('');
  },

  /**
   * Get timeline statistics
   */
  getStats: (events: DebugEvent[]): any => {
    const stats: any = {
      totalEvents: events.length,
      types: {} as Record<string, number>,
      timeRange: {
        start: events.length > 0 ? new Date(events[0].timestamp).toISOString() : null,
        end: events.length > 0 ? new Date(events[events.length - 1].timestamp).toISOString() : null
      }
    };

    events.forEach(event => {
      stats.types[event.type] = (stats.types[event.type] || 0) + 1;
    });

    return stats;
  }
};