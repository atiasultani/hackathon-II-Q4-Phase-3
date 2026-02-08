import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import BaseAnimation from '../animation-system/BaseAnimation';
import { getWebSocketService } from '../../services/websocket-service';

interface AIAvatarProps {
  conversationId?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const AIAvatar: React.FC<AIAvatarProps> = ({
  conversationId,
  size = 'medium',
  className = ''
}) => {
  const { animationState, updateAnimationState } = useAnimationState();
  const [currentExpression, setCurrentExpression] = useState(animationState.avatarExpression);
  const [isProcessing, setIsProcessing] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeClasses = {
    small: 'w-12 h-12 text-sm',
    medium: 'w-16 h-16 text-base',
    large: 'w-24 h-24 text-lg',
  };

  // Expression configurations
  const expressionConfig = {
    neutral: {
      faceColor: '#4F46E5',
      eyes: 'normal',
      mouth: 'straight',
      description: 'Neutral expression'
    },
    happy: {
      faceColor: '#10B981',
      eyes: 'smile',
      mouth: 'smile',
      description: 'Happy expression'
    },
    thinking: {
      faceColor: '#F59E0B',
      eyes: 'thinking',
      mouth: 'line',
      description: 'Thinking expression'
    },
    listening: {
      faceColor: '#8B5CF6',
      eyes: 'listening',
      mouth: 'open',
      description: 'Listening expression'
    },
    processing: {
      faceColor: '#EF4444',
      eyes: 'busy',
      mouth: 'pulse',
      description: 'Processing expression'
    },
  };

  // Subscribe to animation updates via WebSocket
  useEffect(() => {
    if (!conversationId) return;

    // Initialize WebSocket service with the specific conversation endpoint
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/animation/${conversationId}`;

    // Get or create WebSocket service with the conversation-specific URL
    const wsService = getWebSocketService({
      url: wsUrl,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
    });

    const unsubscribe = wsService.subscribeToAnimationUpdates((data) => {
      if (data.conversation_id === conversationId) {
        updateAnimationState({
          avatarExpression: data.animation_state.avatarExpression,
          animationSequence: data.animation_state.animationSequence,
          isActive: data.animation_state.isActive,
          triggerEvent: data.animation_state.triggerEvent,
          duration: data.animation_state.duration,
          intensity: data.animation_state.intensity,
        });

        setCurrentExpression(data.animation_state.avatarExpression);
        setIsProcessing(data.animation_state.triggerEvent.includes('processing'));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, updateAnimationState]);

  // Update local state when animationState changes
  useEffect(() => {
    setCurrentExpression(animationState.avatarExpression);
    setIsProcessing(animationState.triggerEvent.includes('processing'));
  }, [animationState]);

  // Get current expression config
  const currentConfig = expressionConfig[currentExpression as keyof typeof expressionConfig] ||
                       expressionConfig.neutral;

  // Avatar face component
  const AvatarFace = () => (
    <div
      className={`relative rounded-full flex items-center justify-center bg-gradient-to-br ${currentConfig.faceColor} ${sizeClasses[size]} ${className}`}
      aria-label={currentConfig.description}
    >
      {/* Eyes */}
      <div className="absolute top-1/4 flex space-x-2">
        {currentConfig.eyes === 'normal' && (
          <>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </>
        )}
        {currentConfig.eyes === 'smile' && (
          <>
            <div className="w-2 h-1 bg-white rounded-full transform rotate-12"></div>
            <div className="w-2 h-1 bg-white rounded-full transform -rotate-12"></div>
          </>
        )}
        {currentConfig.eyes === 'thinking' && (
          <>
            <div className="w-2 h-1 bg-white rounded-full transform -skew-x-12"></div>
            <div className="w-2 h-1 bg-white rounded-full transform skew-x-12"></div>
          </>
        )}
        {currentConfig.eyes === 'listening' && (
          <>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </>
        )}
        {currentConfig.eyes === 'busy' && (
          <>
            <div className="w-2 h-1 bg-white rounded-full animate-spin"></div>
            <div className="w-2 h-1 bg-white rounded-full animate-spin"></div>
          </>
        )}
      </div>

      {/* Mouth */}
      <div className="absolute bottom-1/4">
        {currentConfig.mouth === 'straight' && (
          <div className="w-4 h-0.5 bg-white"></div>
        )}
        {currentConfig.mouth === 'smile' && (
          <div className="w-4 h-2 border-b-2 border-l-2 border-r-2 border-white rounded-b-full"></div>
        )}
        {currentConfig.mouth === 'line' && (
          <div className="w-3 h-0.5 bg-white opacity-70"></div>
        )}
        {currentConfig.mouth === 'open' && (
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        )}
        {currentConfig.mouth === 'pulse' && (
          <div className="w-3 h-1 bg-white rounded-full animate-ping"></div>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
          <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );

  return (
    <BaseAnimation variant="scale" duration="quick" triggerEvent={currentExpression}>
      <div ref={avatarRef} className="flex flex-col items-center">
        <AvatarFace />

        {/* Expression label for accessibility */}
        <span className="sr-only">{currentConfig.description}</span>

        {/* Optional name label */}
        <span className="mt-2 text-xs text-gray-500">AI Assistant</span>
      </div>
    </BaseAnimation>
  );
};

export default AIAvatar;