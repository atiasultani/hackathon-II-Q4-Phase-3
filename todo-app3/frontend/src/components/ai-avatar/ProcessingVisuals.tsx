import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { getWebSocketService } from '../../services/websocket-service';
import { calculateAnimationIntensity } from '../../utils/animation-utils';

interface ProcessingVisualsProps {
  isActive?: boolean;
  conversationId?: string;
  className?: string;
  intensity?: number;
}

const ProcessingVisuals: React.FC<ProcessingVisualsProps> = ({
  isActive = false,
  conversationId,
  className = '',
  intensity = 5
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();
  const [isProcessing, setIsProcessing] = useState(isActive);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Subscribe to WebSocket events for processing updates
  useEffect(() => {
    if (!conversationId) return;

    const wsService = getWebSocketService();

    const unsubscribe = wsService.subscribeToAnimationUpdates((data) => {
      if (data.conversation_id === conversationId) {
        if (data.animation_state.triggerEvent.includes('processing')) {
          setIsProcessing(true);

          // Update processing step based on the processing stage
          if (data.animation_state.triggerEvent.includes('skill_activation')) {
            setProcessingStep(1);
          } else if (data.animation_state.triggerEvent.includes('data_fetching')) {
            setProcessingStep(2);
          } else if (data.animation_state.triggerEvent.includes('response_generation')) {
            setProcessingStep(3);
          }

          // Update progress
          setProcessingProgress(data.animation_state.intensity * 10);
        } else if (data.animation_state.triggerEvent.includes('response')) {
          setIsProcessing(false);
          setProcessingStep(0);
          setProcessingProgress(0);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId]);

  // Update local state when prop changes
  useEffect(() => {
    setIsProcessing(isActive);
  }, [isActive]);

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {isProcessing && (
          <div className="text-sm text-gray-600">Processing...</div>
        )}
      </div>
    );
  }

  // Calculate adjusted intensity based on user preferences
  const adjustedIntensity = calculateAnimationIntensity(intensity, userPreferences.animationSpeed);

  // Processing ring component
  const ProcessingRing = () => (
    <div className="relative w-16 h-16">
      {/* Outer ring */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * processingProgress) / 100}
          transform="rotate(-90 50 50)"
          initial={{ strokeDashoffset: 283 }}
          animate={{ strokeDashoffset: 283 - (283 * processingProgress) / 100 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Processing dots */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute w-2 h-2 bg-indigo-500 rounded-full"
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.8, repeat: Infinity, delay: index * 0.2 },
            }}
            style={{
              x: 30 * Math.cos((index * 120 * Math.PI) / 180),
              y: 30 * Math.sin((index * 120 * Math.PI) / 180),
            }}
          />
        ))}
      </div>
    </div>
  );

  // Processing bars component
  const ProcessingBars = () => (
    <div className="flex items-end justify-center space-x-1 h-8">
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          className="w-1.5 bg-indigo-500 rounded-t"
          animate={{
            height: [10, 20, 15, 25, 10],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
          style={{
            height: `${Math.random() * 20 + 10}px`,
          }}
        />
      ))}
    </div>
  );

  // Processing waves component
  const ProcessingWaves = () => (
    <div className="flex items-end justify-center space-x-1 h-6">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <motion.div
          key={index}
          className="w-1 bg-indigo-500 rounded-t"
          animate={{
            height: [8, 24, 12, 28, 16, 32, 8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );

  // Processing status text
  const getStatusText = () => {
    switch (processingStep) {
      case 1:
        return "Activating skills...";
      case 2:
        return "Fetching data...";
      case 3:
        return "Generating response...";
      default:
        return "Processing...";
    }
  };

  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.div
          className={`flex flex-col items-center justify-center ${className}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Choose visualization based on intensity */}
          {adjustedIntensity > 7 ? <ProcessingRing /> : adjustedIntensity > 4 ? <ProcessingBars /> : <ProcessingWaves />}

          <motion.div
            className="mt-2 text-sm text-gray-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {getStatusText()}
          </motion.div>

          {/* Progress bar */}
          <div className="mt-2 w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${processingProgress}%` }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>

          {/* Processing step indicator */}
          <div className="mt-2 flex space-x-1">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step <= processingStep ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SkillActivationVisualsProps {
  activeSkills: string[];
  className?: string;
}

const SkillActivationVisuals: React.FC<SkillActivationVisualsProps> = ({
  activeSkills,
  className = ''
}) => {
  const { performanceMetrics } = useAnimationState();

  if (performanceMetrics.shouldOptimize || activeSkills.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      {activeSkills.map((skill, index) => (
        <motion.div
          key={skill}
          className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full flex items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <motion.span
            className="w-2 h-2 bg-indigo-500 rounded-full mr-1"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.1 }}
          />
          {skill}
        </motion.div>
      ))}
    </div>
  );
};

export { ProcessingVisuals, SkillActivationVisuals };
export default ProcessingVisuals;