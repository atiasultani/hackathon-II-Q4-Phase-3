import { useEffect } from 'react';
import { getWebSocketService, initializeWebSocketService } from './websocket-service';
import { useAnimationState } from '../hooks/use-animation-state';

// Interface for animation state updates
interface AnimationStateUpdate {
  event_type: 'animation_state_update';
  conversation_id: string;
  animation_state: {
    avatarExpression: string;
    animationSequence: string[];
    isActive: boolean;
    triggerEvent: string;
    duration: number;
    intensity: number;
  };
  timestamp: string;
}

// Interface for agent activity updates
interface AgentActivityUpdate {
  event_type: 'agent_activity_update';
  conversation_id: string;
  agent_activity: {
    agentName: string;
    status: 'idle' | 'activating' | 'active' | 'deactivating' | 'error' | 'success';
    visualIndicator: 'badge' | 'progress' | 'icon' | 'bar' | 'pulse' | 'notification';
    priority: number;
    progress?: number;
  };
  timestamp: string;
}

// Service class to manage avatar animations based on backend events
class AvatarAnimationService {
  private static instance: AvatarAnimationService | null = null;
  private wsService: any;
  private isInitialized: boolean = false;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): AvatarAnimationService {
    if (!AvatarAnimationService.instance) {
      AvatarAnimationService.instance = new AvatarAnimationService();
    }
    return AvatarAnimationService.instance;
  }

  // Initialize the service with WebSocket connection
  public initialize(wsUrl: string): void {
    if (!this.isInitialized) {
      this.wsService = initializeWebSocketService({
        url: wsUrl,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
      });
      this.isInitialized = true;
    }
  }

  // Connect to animation updates
  public connectToAnimationUpdates(
    conversationId: string,
    onUpdate: (data: AnimationStateUpdate) => void
  ): () => void {
    if (!this.wsService) {
      console.error('AvatarAnimationService not initialized. Call initialize first.');
      return () => {};
    }

    // Subscribe to animation updates for specific conversation
    const unsubscribe = this.wsService.subscribeToAnimationUpdates((data: AnimationStateUpdate) => {
      if (data.conversation_id === conversationId) {
        onUpdate(data);
      }
    });

    return unsubscribe;
  }

  // Connect to agent activity updates
  public connectToAgentUpdates(
    conversationId: string,
    onUpdate: (data: AgentActivityUpdate) => void
  ): () => void {
    if (!this.wsService) {
      console.error('AvatarAnimationService not initialized. Call initialize first.');
      return () => {};
    }

    // Subscribe to agent activity updates for specific conversation
    const unsubscribe = this.wsService.subscribeToAgentUpdates((data: AgentActivityUpdate) => {
      if (data.conversation_id === conversationId) {
        onUpdate(data);
      }
    });

    return unsubscribe;
  }

  // Send animation state update to backend
  public sendAnimationUpdate(conversationId: string, state: any): void {
    if (!this.wsService) {
      console.error('AvatarAnimationService not initialized. Call initialize first.');
      return;
    }

    const updateData = {
      event_type: 'animation_state_update',
      conversation_id: conversationId,
      animation_state: state,
      timestamp: new Date().toISOString(),
    };

    this.wsService.send(updateData);
  }

  // Get connection status
  public getConnectionStatus(): string {
    if (!this.wsService) {
      return 'disconnected';
    }
    return this.wsService.getConnectionStatus();
  }

  // Disconnect the service
  public disconnect(): void {
    if (this.wsService) {
      this.wsService.close();
      this.isInitialized = false;
      AvatarAnimationService.instance = null;
    }
  }
}

// React hook to connect avatar to backend animation states
export const useAvatarAnimationConnection = (conversationId: string | null) => {
  const { updateAnimationState, updateAgentActivity } = useAnimationState();

  // Initialize the service
  useEffect(() => {
    if (conversationId) {
      const animationService = AvatarAnimationService.getInstance();
      animationService.initialize('ws://localhost:8000/ws'); // Default backend WebSocket URL

      // Connect to animation updates
      const unsubscribeAnimation = animationService.connectToAnimationUpdates(
        conversationId,
        (data: AnimationStateUpdate) => {
          // Update the animation state in the global context
          updateAnimationState({
            avatarExpression: data.animation_state.avatarExpression,
            animationSequence: data.animation_state.animationSequence,
            isActive: data.animation_state.isActive,
            triggerEvent: data.animation_state.triggerEvent,
            duration: data.animation_state.duration,
            intensity: data.animation_state.intensity,
          });
        }
      );

      // Connect to agent activity updates
      const unsubscribeAgent = animationService.connectToAgentUpdates(
        conversationId,
        (data: AgentActivityUpdate) => {
          // Update agent activity in the global context
          updateAgentActivity(data.agent_activity.agentName, {
            status: data.agent_activity.status,
            visualIndicator: data.agent_activity.visualIndicator,
            priority: data.agent_activity.priority,
          });
        }
      );

      // Cleanup on unmount
      return () => {
        unsubscribeAnimation();
        unsubscribeAgent();
      };
    }
  }, [conversationId, updateAnimationState, updateAgentActivity]);

  // Function to manually trigger animation state updates
  const triggerAnimationState = (expression: string, event: string, intensity: number = 5) => {
    if (conversationId) {
      const animationService = AvatarAnimationService.getInstance();
      animationService.sendAnimationUpdate(conversationId, {
        avatarExpression: expression,
        animationSequence: [],
        isActive: true,
        triggerEvent: event,
        duration: 300,
        intensity: intensity,
      });
    }
  };

  return {
    triggerAnimationState,
    connectionStatus: AvatarAnimationService.getInstance().getConnectionStatus(),
  };
};

// Export the service class
export default AvatarAnimationService;