import { useState, useEffect, createContext, useContext } from 'react';
import { getWebSocketService } from './websocket-service';
import { useAnimationState } from '../hooks/use-animation-state';

// Connection state types
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'
  | 'slow';

// Connection metrics interface
export interface ConnectionMetrics {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  lastPing: number;
  consecutiveFailures: number;
  retryCount: number;
}

// Network delay handler class
class ConnectionHandler {
  private static instance: ConnectionHandler | null = null;
  private wsService: any;
  private connectionState: ConnectionState = 'disconnected';
  private metrics: ConnectionMetrics = {
    latency: 0,
    packetLoss: 0,
    bandwidth: 0,
    lastPing: 0,
    consecutiveFailures: 0,
    retryCount: 0
  };
  private stateListeners: Array<(state: ConnectionState, metrics: ConnectionMetrics) => void> = [];
  private networkQualityListeners: Array<(quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline') => void> = [];
  private slowConnectionThreshold: number = 1000; // ms
  private timeoutId: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeMetrics();
  }

  // Singleton pattern
  static getInstance(): ConnectionHandler {
    if (!ConnectionHandler.instance) {
      ConnectionHandler.instance = new ConnectionHandler();
    }
    return ConnectionHandler.instance;
  }

  // Initialize metrics
  private initializeMetrics(): void {
    // Set up periodic metrics collection
    setInterval(() => {
      this.updateLatency();
    }, 5000); // Update latency every 5 seconds
  }

  // Initialize connection handler
  public initialize(wsUrl: string): void {
    try {
      this.wsService = getWebSocketService({
        url: wsUrl,
        reconnectInterval: 3000,
        maxReconnectAttempts: 20,
        heartbeatInterval: 15000
      });

      // Listen to connection events
      this.wsService.subscribe('open', () => {
        this.connectionState = 'connected';
        this.metrics.consecutiveFailures = 0;
        this.notifyStateListeners();
        this.evaluateNetworkQuality();
      });

      this.wsService.subscribe('close', (event: any) => {
        if (this.metrics.consecutiveFailures === 0) {
          this.connectionState = 'disconnected';
          this.notifyStateListeners();
        }
      });

      this.wsService.subscribe('error', (error: any) => {
        this.connectionState = 'error';
        this.metrics.consecutiveFailures++;
        this.notifyStateListeners();
        this.evaluateNetworkQuality();
      });

      // Set up ping/pong mechanism
      this.setupPingPong();
    } catch (error) {
      console.error('Failed to initialize connection handler:', error);
      this.connectionState = 'error';
      this.notifyStateListeners();
    }
  }

  // Set up ping/pong mechanism for connection health
  private setupPingPong(): void {
    // Send ping periodically
    setInterval(() => {
      if (this.wsService?.isConnected()) {
        const pingTime = Date.now();
        this.wsService.send({ type: 'ping', timestamp: pingTime });

        // Set timeout to detect slow responses
        this.timeoutId = setTimeout(() => {
          if (this.metrics.latency > this.slowConnectionThreshold) {
            this.connectionState = 'slow';
            this.notifyStateListeners();
          }
        }, this.slowConnectionThreshold);
      }
    }, 10000); // Ping every 10 seconds

    // Listen for pong responses
    this.wsService.subscribe('message', (data: any) => {
      if (data.type === 'pong') {
        const responseTime = Date.now();
        const latency = responseTime - data.pingTimestamp;
        this.metrics.latency = latency;
        this.metrics.lastPing = responseTime;

        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }

        // Update connection state based on latency
        if (this.connectionState === 'slow' && latency <= this.slowConnectionThreshold) {
          this.connectionState = 'connected';
          this.notifyStateListeners();
        }
      }
    });
  }

  // Update latency measurement
  private updateLatency(): void {
    if (this.wsService?.isConnected()) {
      const startTime = Date.now();
      this.wsService.send({ type: 'ping', timestamp: startTime });

      // Wait for response to calculate latency
      setTimeout(() => {
        if (this.metrics.lastPing < startTime) {
          // No response received, connection might be slow
          this.connectionState = 'slow';
          this.notifyStateListeners();
        }
      }, 5000); // Wait up to 5 seconds for response
    }
  }

  // Evaluate network quality based on metrics
  private evaluateNetworkQuality(): void {
    let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

    if (this.connectionState === 'disconnected' || this.connectionState === 'error') {
      quality = 'offline';
    } else if (this.metrics.latency < 50) {
      quality = 'excellent';
    } else if (this.metrics.latency < 150) {
      quality = 'good';
    } else if (this.metrics.latency < 300) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    this.notifyNetworkQualityListeners(quality);
  }

  // Add connection state listener
  public addStateListener(callback: (state: ConnectionState, metrics: ConnectionMetrics) => void): () => void {
    this.stateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.stateListeners.indexOf(callback);
      if (index > -1) {
        this.stateListeners.splice(index, 1);
      }
    };
  }

  // Add network quality listener
  public addNetworkQualityListener(callback: (quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline') => void): () => void {
    this.networkQualityListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.networkQualityListeners.indexOf(callback);
      if (index > -1) {
        this.networkQualityListeners.splice(index, 1);
      }
    };
  }

  // Notify state listeners
  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      try {
        listener(this.connectionState, { ...this.metrics });
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    });
  }

  // Notify network quality listeners
  private notifyNetworkQualityListeners(quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline'): void {
    this.networkQualityListeners.forEach(listener => {
      try {
        listener(quality);
      } catch (error) {
        console.error('Error in network quality listener:', error);
      }
    });
  }

  // Get current connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Get current metrics
  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  // Send data with network-aware handling
  public sendData(data: any, options?: { timeout?: number, retry?: boolean }): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check connection state first
      if (!this.wsService?.isConnected()) {
        if (this.connectionState === 'connecting') {
          // Wait a bit for connection to establish
          setTimeout(() => {
            this.sendData(data, options).then(resolve).catch(reject);
          }, 500);
          return;
        } else {
          reject(new Error('Connection unavailable'));
          return;
        }
      }

      // Add timeout if specified
      const timeout = options?.timeout || 10000; // 10 second default
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      try {
        // Send the data
        this.wsService.send(data);

        // For requests that expect a response, we'd handle that here
        // This is a simplified version - in a real implementation you'd track request IDs
        clearTimeout(timeoutId);
        resolve({ success: true });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Handle slow connection by adjusting animations
  public handleSlowConnection(): void {
    if (this.metrics.latency > this.slowConnectionThreshold) {
      // Reduce animation complexity
      this.reduceAnimations();
    }
  }

  // Reduce animations for better performance on slow connections
  private reduceAnimations(): void {
    // This would typically interact with the animation system to reduce complexity
    console.log('Reducing animations due to slow connection');

    // In a real implementation, this would notify the animation system
    // to use simpler animations or reduce frame rates
  }

  // Check if connection is healthy
  public isHealthy(): boolean {
    return this.connectionState === 'connected' && this.metrics.latency <= 500;
  }

  // Get connection quality as a percentage (0-100)
  public getConnectionQuality(): number {
    if (this.connectionState === 'disconnected' || this.connectionState === 'error') {
      return 0;
    }

    // Calculate quality based on latency (lower is better)
    const latencyQuality = Math.max(0, 100 - (this.metrics.latency / 10)); // 10ms = 1 quality point

    // Factor in consecutive failures (more failures = lower quality)
    const failurePenalty = this.metrics.consecutiveFailures * 10;

    const quality = Math.max(0, latencyQuality - failurePenalty);
    return Math.round(quality);
  }

  // Retry failed operations
  public retryOperation(operation: () => Promise<any>, maxRetries: number = 3): Promise<any> {
    let attempts = 0;

    const attempt = (): Promise<any> => {
      return operation().catch(error => {
        attempts++;
        if (attempts < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempts) * 1000; // 2^attempt * 1000ms

          return new Promise(resolve => {
            setTimeout(() => {
              resolve(attempt());
            }, delay);
          });
        } else {
          throw error;
        }
      });
    };

    return attempt();
  }
}

// React hook for connection handling
export const useConnectionHandler = (wsUrl: string) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    latency: 0,
    packetLoss: 0,
    bandwidth: 0,
    lastPing: 0,
    consecutiveFailures: 0,
    retryCount: 0
  });
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | 'offline'>('offline');

  useEffect(() => {
    const handler = ConnectionHandler.getInstance();
    handler.initialize(wsUrl);

    const stateUnsubscribe = handler.addStateListener((state, metrics) => {
      setConnectionState(state);
      setConnectionMetrics(metrics);
    });

    const qualityUnsubscribe = handler.addNetworkQualityListener((quality) => {
      setNetworkQuality(quality);
    });

    // Cleanup on unmount
    return () => {
      if (stateUnsubscribe) stateUnsubscribe();
      if (qualityUnsubscribe) qualityUnsubscribe();
    };
  }, [wsUrl]);

  return {
    connectionState,
    connectionMetrics,
    networkQuality,
    isHealthy: connectionState === 'connected' && connectionMetrics.latency <= 500,
    connectionQualityPercent: ConnectionHandler.getInstance().getConnectionQuality(),
    sendData: (data: any, options?: { timeout?: number, retry?: boolean }) =>
      ConnectionHandler.getInstance().sendData(data, options),
    retryOperation: (operation: () => Promise<any>, maxRetries: number = 3) =>
      ConnectionHandler.getInstance().retryOperation(operation, maxRetries)
  };
};

// Utility function to detect network status
export const detectNetworkStatus = (): 'online' | 'offline' | 'slow' => {
  if (typeof navigator === 'undefined') return 'online';

  // Check for browser online/offline events
  if (!navigator.onLine) {
    return 'offline';
  }

  // Check for slow connection based on connection API if available
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
      return 'slow';
    }
  }

  return 'online';
};

// Network status context provider
interface NetworkStatusContextType {
  status: 'online' | 'offline' | 'slow';
  connectionState: ConnectionState;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  connectionQualityPercent: number;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const useNetworkStatus = (): NetworkStatusContextType => {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
};

interface NetworkStatusProviderProps {
  wsUrl: string;
  children: React.ReactNode;
}

export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({ wsUrl, children }) => {
  const {
    connectionState,
    networkQuality,
    connectionQualityPercent
  } = useConnectionHandler(wsUrl);

  const [status, setStatus] = useState<'online' | 'offline' | 'slow'>('online');

  useEffect(() => {
    // Update browser online/offline status
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for slow connection based on our connection handler
    if (connectionState === 'slow') {
      setStatus('slow');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionState]);

  const contextValue: NetworkStatusContextType = {
    status,
    connectionState,
    networkQuality,
    connectionQualityPercent
  };

  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

// Export the instance
export default ConnectionHandler.getInstance();