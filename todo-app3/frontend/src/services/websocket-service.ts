/**
 * WebSocket Service for Real-time Animation Sync
 * Manages WebSocket connections for synchronizing animations with backend processing states
 */

interface WebSocketServiceOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

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

interface AgentActivityUpdate {
  event_type: 'agent_activity_update';
  conversation_id: string;
  agent_activity: {
    agentName: string;
    status: string;
    visualIndicator: string;
    priority: number;
  };
  timestamp: string;
}

type WebSocketEvent = AnimationStateUpdate | AgentActivityUpdate;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private heartbeatTimer: number | null = null;
  private isManuallyClosed: boolean = false;

  constructor(options: WebSocketServiceOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval ?? 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000; // 30 seconds
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.isManuallyClosed = false;

          // Start heartbeat
          this.startHeartbeat();

          // Notify listeners
          this.emit('open');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            this.emit('error', { type: 'parse_error', error });
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.stopHeartbeat();

          if (!this.isManuallyClosed) {
            this.attemptReconnect();
          }

          this.emit('close', event);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }

  /**
   * Close the WebSocket connection
   */
  public close(): void {
    this.isManuallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
  }

  /**
   * Subscribe to WebSocket events
   */
  public subscribe(eventType: string, listener: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)?.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  private emit(eventType: string, data?: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: WebSocketEvent): void {
    // Emit general message event
    this.emit('message', data);

    // Emit specific event type
    this.emit(data.event_type, data);

    // Handle specific message types
    switch (data.event_type) {
      case 'animation_state_update':
        this.emit('animation_state_update', data);
        break;
      case 'agent_activity_update':
        this.emit('agent_activity_update', data);
        break;
      default:
        console.warn('Unknown event type received:', data);
    }
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isManuallyClosed) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          this.attemptReconnect(); // Try again
        });
      }, this.reconnectInterval);
    } else if (!this.isManuallyClosed) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts');
    }
  }

  /**
   * Start sending heartbeat messages to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat

    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping message
        this.send({ type: 'ping', timestamp: Date.now() });
      } else {
        // If connection is not open, clear the timer
        this.stopHeartbeat();
      }
    }, this.heartbeatInterval) as unknown as number;
  }

  /**
   * Stop the heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'DISCONNECTED' {
    if (!this.ws) return 'DISCONNECTED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'DISCONNECTED';
    }
  }

  /**
   * Subscribe to animation state updates
   */
  public subscribeToAnimationUpdates(
    callback: (data: AnimationStateUpdate) => void
  ): () => void {
    return this.subscribe('animation_state_update', callback);
  }

  /**
   * Subscribe to agent activity updates
   */
  public subscribeToAgentUpdates(
    callback: (data: AgentActivityUpdate) => void
  ): () => void {
    return this.subscribe('agent_activity_update', callback);
  }
}

// Global instance for the app
let websocketService: WebSocketService | null = null;

/**
 * Get or create the WebSocket service instance
 */
export const getWebSocketService = (options?: WebSocketServiceOptions): WebSocketService => {
  if (!websocketService && options) {
    websocketService = new WebSocketService(options);
  } else if (!websocketService) {
    throw new Error('WebSocket service not initialized. Call with options first.');
  }

  return websocketService;
};

/**
 * Initialize the WebSocket service with options
 */
export const initializeWebSocketService = (options: WebSocketServiceOptions): WebSocketService => {
  websocketService = new WebSocketService(options);
  return websocketService;
};

/**
 * Disconnect and clean up the WebSocket service
 */
export const disconnectWebSocketService = (): void => {
  if (websocketService) {
    websocketService.close();
    websocketService = null;
  }
};

export default WebSocketService;