import React, { useState, useEffect } from 'react';

/**
 * FPS Counter Component for Performance Monitoring
 */
const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsValue = 0;

    const updateFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        // Calculate FPS over the last second
        fpsValue = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(fpsValue);

        // Reset counters
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(updateFPS);
    };

    const animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const getFPSColor = () => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`text-xs font-mono ${getFPSColor()} px-2 py-1 rounded bg-gray-700`}>
      {fps} FPS
    </div>
  );
};

export { FPSCounter };