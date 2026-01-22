import React, { useState, useEffect, useRef } from 'react';
import { useAnimationState } from '../../hooks/use-animation-state';
import { PerformanceMonitor } from '../../utils/performance-utils';
import { FPSCounter } from '../performance/FPSCounter';
import { AnimationTimeline } from './AnimationTimeline';
import { AnimationInspector } from './AnimationInspector';

/**
 * Developer Debug Panel for Animation System
 * Provides real-time insights into animation performance and state
 */
const AnimationDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});

  const { animationState, agentActivities, userPreferences, performanceMetrics: perfMetrics } = useAnimationState();
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);

  // Initialize performance monitor
  useEffect(() => {
    if (isVisible) {
      performanceMonitorRef.current = new PerformanceMonitor();
      performanceMonitorRef.current.startMonitoring();

      const interval = setInterval(() => {
        if (performanceMonitorRef.current) {
          setPerformanceMetrics(performanceMonitorRef.current.getMetrics());
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        performanceMonitorRef.current?.stopMonitoring();
      };
    }
  }, [isVisible]);

  // Toggle debug panel visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Collect debug data
  useEffect(() => {
    if (isVisible) {
      setDebugData({
        animationState,
        agentActivities,
        userPreferences,
        performanceMetrics,
        timestamp: Date.now()
      });
    }
  }, [animationState, agentActivities, userPreferences, performanceMetrics, isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
        aria-label="Open Animation Debug Panel"
      >
        🎨 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-gray-900 text-white border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-2 flex justify-between items-center">
        <h3 className="font-bold">Animation Debugger</h3>
        <div className="flex space-x-2">
          <FPSCounter />
          <button
            onClick={toggleVisibility}
            className="text-red-400 hover:text-red-300"
            aria-label="Close debug panel"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button className="px-3 py-1 bg-gray-700 text-white text-sm">Overview</button>
        <button className="px-3 py-1 text-gray-400 hover:text-white text-sm">Timeline</button>
        <button className="px-3 py-1 text-gray-400 hover:text-white text-sm">Inspector</button>
        <button className="px-3 py-1 text-gray-400 hover:text-white text-sm">Performance</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        <div className="space-y-3">
          {/* Animation State */}
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Animation State</h4>
            <pre className="bg-gray-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(animationState, null, 2)}
            </pre>
          </div>

          {/* Agent Activities */}
          <div>
            <h4 className="font-semibold text-green-400 mb-1">Active Agents ({agentActivities.length})</h4>
            <div className="bg-gray-800 p-2 rounded">
              {agentActivities.map((activity, index) => (
                <div key={index} className="mb-1 last:mb-0">
                  <span className="text-yellow-300">{activity.agentId}</span>: {activity.status}
                </div>
              ))}
            </div>
          </div>

          {/* User Preferences */}
          <div>
            <h4 className="font-semibold text-purple-400 mb-1">User Preferences</h4>
            <pre className="bg-gray-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(userPreferences, null, 2)}
            </pre>
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="font-semibold text-orange-400 mb-1">Performance</h4>
            <div className="bg-gray-800 p-2 rounded grid grid-cols-2 gap-2">
              <div>FPS: {perfMetrics.fps || 'N/A'}</div>
              <div>Should Optimize: {perfMetrics.shouldOptimize ? 'Yes' : 'No'}</div>
              <div>Reduced Motion: {perfMetrics.reducedMotion ? 'Yes' : 'No'}</div>
              <div>Low End: {perfMetrics.isLowEnd ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Debug Controls */}
          <div>
            <h4 className="font-semibold text-red-400 mb-1">Debug Controls</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="bg-red-700 hover:bg-red-600 p-1 rounded text-xs"
                onClick={() => console.log('Animation State:', animationState)}
              >
                Log State
              </button>
              <button
                className="bg-yellow-700 hover:bg-yellow-600 p-1 rounded text-xs"
                onClick={() => console.log('Full Debug Data:', debugData)}
              >
                Log All
              </button>
              <button
                className="bg-green-700 hover:bg-green-600 p-1 rounded text-xs"
                onClick={() => performanceMonitorRef.current?.forceGC()}
              >
                Force GC
              </button>
              <button
                className="bg-blue-700 hover:bg-blue-600 p-1 rounded text-xs"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 p-1 text-xs text-gray-400 text-center">
        AI Animated Frontend Debugger • {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AnimationDebugPanel;