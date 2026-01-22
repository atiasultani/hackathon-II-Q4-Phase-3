import React, { useEffect, useState } from 'react';
import { useAnimationState } from '../../hooks/use-animation-state';
import { getWebSocketService } from '../../services/websocket-service';
import { AvatarExpressionType } from './AvatarExpressions';

interface AvatarControllerProps {
  conversationId?: string;
  userId?: string;
  className?: string;
}

// Define animation states that correspond to different AI processing stages
export type AnimationStateType =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'thinking'
  | 'responding'
  | 'error'
  | 'greeting'
  | 'farewell';

// Mapping from animation states to avatar expressions
const animationStateToExpression: Record<AnimationStateType, AvatarExpressionType> = {
  idle: 'neutral',
  listening: 'listening',
  processing: 'processing',
  thinking: 'thinking',
  responding: 'happy',
  error: 'confused',
  greeting: 'greeting',
  farewell: 'happy',
};

const AvatarController: React.FC<AvatarControllerProps> = ({
  conversationId,
  userId,
  className = ''
}) => {
  const {
    animationState,
    updateAnimationState,
    updateAgentActivity,
    performanceMetrics
  } = useAnimationState();

  const [currentAnimationState, setCurrentAnimationState] = useState<AnimationStateType>('idle');
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [lastAiResponse, setLastAiResponse] = useState<string>('');

  // Subscribe to WebSocket events to update animation state
  useEffect(() => {
    if (!conversationId) return;

    const wsService = getWebSocketService();

    const unsubscribeAnimation = wsService.subscribeToAnimationUpdates((data) => {
      if (data.conversation_id === conversationId) {
        // Update animation state based on trigger event
        let newState: AnimationStateType = 'idle';

        if (data.animation_state.triggerEvent.includes('userMessage')) {
          newState = 'listening';
        } else if (data.animation_state.triggerEvent.includes('processing')) {
          newState = 'processing';
        } else if (data.animation_state.triggerEvent.includes('response')) {
          newState = 'responding';
        } else if (data.animation_state.triggerEvent.includes('error')) {
          newState = 'error';
        }

        setCurrentAnimationState(newState);

        // Update the global animation state
        updateAnimationState({
          avatarExpression: animationStateToExpression[newState],
          animationSequence: data.animation_state.animationSequence,
          isActive: data.animation_state.isActive,
          triggerEvent: data.animation_state.triggerEvent,
          duration: data.animation_state.duration,
          intensity: data.animation_state.intensity,
        });
      }
    });

    const unsubscribeAgent = wsService.subscribeToAgentUpdates((data) => {
      if (data.conversation_id === conversationId) {
        // Update agent activity
        updateAgentActivity(data.agent_activity.agentName, {
          status: data.agent_activity.status as any,
          visualIndicator: data.agent_activity.visualIndicator,
          priority: data.agent_activity.priority,
        });

        // Adjust animation state based on agent activity
        let agentState: AnimationStateType = 'idle';
        switch (data.agent_activity.status) {
          case 'active':
            agentState = 'processing';
            break;
          case 'error':
            agentState = 'error';
            break;
          default:
            agentState = 'idle';
        }

        setCurrentAnimationState(agentState);
      }
    });

    return () => {
      if (unsubscribeAnimation) unsubscribeAnimation();
      if (unsubscribeAgent) unsubscribeAgent();
    };
  }, [conversationId, updateAnimationState, updateAgentActivity]);

  // Update animation based on local state changes
  useEffect(() => {
    const expression = animationStateToExpression[currentAnimationState];

    updateAnimationState({
      avatarExpression: expression,
      isActive: true,
      triggerEvent: `state_change_${currentAnimationState}`,
      intensity: getIntensityForState(currentAnimationState),
    });
  }, [currentAnimationState, updateAnimationState]);

  // Helper function to get intensity based on animation state
  const getIntensityForState = (state: AnimationStateType): number => {
    switch (state) {
      case 'processing':
      case 'thinking':
        return 7;
      case 'listening':
        return 5;
      case 'responding':
        return 6;
      case 'error':
        return 8;
      case 'greeting':
        return 5;
      case 'farewell':
        return 4;
      default:
        return 3;
    }
  };

  // Function to manually trigger animation state changes
  const triggerAnimationState = (state: AnimationStateType, message?: string) => {
    setCurrentAnimationState(state);

    if (message) {
      if (state === 'listening') {
        setLastUserMessage(message);
      } else if (state === 'responding') {
        setLastAiResponse(message);
      }
    }
  };

  // Function to reset to idle state
  const resetToIdle = () => {
    setCurrentAnimationState('idle');
    updateAnimationState({
      avatarExpression: 'neutral',
      isActive: false,
      triggerEvent: 'reset_to_idle',
      intensity: 1,
    });
  };

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize) {
    // If performance optimization is needed, render a simpler version
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center">
          <span className="text-white text-lg">AI</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* The actual avatar component would be rendered here */}
      <div className="text-sm text-gray-600 mb-2">
        State: {currentAnimationState} | Expression: {animationState.avatarExpression}
      </div>

      {/* Debug information for development */}
      <div className="text-xs text-gray-500">
        Last message: {lastUserMessage.substring(0, 20)}...
      </div>
      <div className="text-xs text-gray-500">
        Last response: {lastAiResponse.substring(0, 20)}...
      </div>
    </div>
  );
};

export { AvatarController, type AnimationStateType };
export default AvatarController;