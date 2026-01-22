import React, { useState, useEffect } from 'react';
import { useAnimationState } from '../../hooks/use-animation-state';
import { getGlobalTimeline, timelineVisualizer } from '../../utils/debug-utils';

/**
 * Debug Overlay Component
 * Displays real-time animation metrics and state information
 */
const DebugOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0
  });

  const { animationState, agentActivities, userPreferences, performanceMetrics } = useAnimationState();
  const timeline = getGlobalTimeline();

  // Toggle overlay visibility with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Simulate metrics updates
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        fps: Math.floor(Math.random() * 15) + 45, // Simulate FPS between 45-60
        memory: Math.floor(Math.random() * 20) + 80, // Simulate memory usage
        renderTime: Math.floor(Math.random() * 5) + 1 // Simulate render time
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const events = timeline.getEvents();
  const timelineAscii = timelineVisualizer.asciiTimeline(events.slice(-20), 40);
  const stats = timelineVisualizer.getStats(events);

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-80 text-green-400 font-mono text-xs p-3 rounded z-50 max-w-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-green-300">Animation Debug Overlay</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300 ml-2"
        >
          [X]
        </button>
      </div>

      <div className="space-y-2">
        {/* Performance Metrics */}
        <div className="border border-green-600 p-2 rounded">
          <div className="grid grid-cols-3 gap-2">
            <div>FPS: <span className={metrics.fps > 50 ? 'text-green-300' : metrics.fps > 30 ? 'text-yellow-300' : 'text-red-300'}>{metrics.fps}</span></div>
            <div>Mem: {metrics.memory}MB</div>
            <div>RT: {metrics.renderTime}ms</div>
          </div>
        </div>

        {/* Animation State */}
        <div className="border border-blue-600 p-2 rounded">
          <div className="text-blue-300 font-semibold mb-1">Animation State</div>
          <div>Expression: {animationState.avatarExpression}</div>
          <div>Active: {animationState.isActive ? 'Yes' : 'No'}</div>
          <div>Intensity: {animationState.intensity}/10</div>
          <div>Seq: {animationState.animationSequence.length}</div>
        </div>

        {/* Agent Activities */}
        <div className="border border-purple-600 p-2 rounded">
          <div className="text-purple-300 font-semibold mb-1">Agents ({agentActivities.length})</div>
          {agentActivities.slice(0, 3).map((activity, idx) => (
            <div key={idx} className="truncate">
              {activity.agentId}: {activity.status}
            </div>
          ))}
          {agentActivities.length > 3 && (
            <div>+{agentActivities.length - 3} more</div>
          )}
        </div>

        {/* User Preferences */}
        <div className="border border-yellow-600 p-2 rounded">
          <div className="text-yellow-300 font-semibold mb-1">Preferences</div>
          <div>Anims: {userPreferences.animationsEnabled ? 'On' : 'Off'}</div>
          <div>Speed: {userPreferences.animationSpeed}x</div>
          <div>Motion: {userPreferences.motionSensitivity}</div>
        </div>

        {/* Timeline Preview */}
        <div className="border border-cyan-600 p-2 rounded">
          <div className="text-cyan-300 font-semibold mb-1">Timeline (Last 20)</div>
          <div className="bg-gray-900 p-1 rounded text-[8px]">{timelineAscii}</div>
          <div className="text-[8px] mt-1">
            Events: {stats.totalEvents} | Types: {Object.keys(stats.types).length}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-red-600 p-2 rounded">
          <div className="text-red-300 font-semibold mb-1">Actions</div>
          <div className="flex flex-wrap gap-1">
            <button className="bg-red-800 hover:bg-red-700 px-1 py-0 text-[8px] rounded">Reset State</button>
            <button className="bg-blue-800 hover:bg-blue-700 px-1 py-0 text-[8px] rounded">Export Timeline</button>
            <button className="bg-green-800 hover:bg-green-700 px-1 py-0 text-[8px] rounded">Log State</button>
          </div>
        </div>
      </div>

      <div className="text-[8px] text-gray-400 mt-2">
        Press Ctrl+Shift+D to toggle
      </div>
    </div>
  );
};

export default DebugOverlay;