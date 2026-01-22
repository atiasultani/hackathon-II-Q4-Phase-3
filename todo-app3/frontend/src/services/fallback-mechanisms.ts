import React, { useState, useEffect, useCallback } from 'react';
import { useAnimationState } from '../hooks/use-animation-state';
import { getWebSocketService } from './websocket-service';
import { ConnectionHandler } from './connection-handler';

// Fallback state types
export type FallbackState =
  | 'normal'
  | 'degraded'
  | 'offline'
  | 'limited'
  | 'recovery'
  | 'critical';

// Fallback configuration
interface FallbackConfig {
  offlineTimeout: number; // ms to wait before assuming offline
  retryInterval: number; // ms between retry attempts
  maxRetries: number; // maximum retry attempts
  cacheDuration: number; // ms to cache fallback data
  recoveryDelay: number; // ms to wait before attempting recovery
  notificationTimeout: number; // ms to show offline notifications
}

// Default fallback configuration
const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  offlineTimeout: 10000, // 10 seconds
  retryInterval: 5000, // 5 seconds
  maxRetries: 10, // 10 retries
  cacheDuration: 300000, // 5 minutes
  recoveryDelay: 2000, // 2 seconds
  notificationTimeout: 5000, // 5 seconds
};

// Cached data interface
interface CachedData {
  data: any;
  timestamp: number;
  expiry: number;
}

// Fallback service class
class FallbackService {
  private static instance: FallbackService | null = null;
  private config: FallbackConfig;
  private fallbackState: FallbackState = 'normal';
  private retryCount: number = 0;
  private cache: Map<string, CachedData> = new Map();
  private stateListeners: Array<(state: FallbackState) => void> = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  private constructor(config: FallbackConfig = DEFAULT_FALLBACK_CONFIG) {
    this.config = config;
    this.setupConnectionMonitoring();
  }

  // Singleton pattern
  static getInstance(config?: FallbackConfig): FallbackService {
    if (!FallbackService.instance) {
      FallbackService.instance = new FallbackService(config);
    }
    return FallbackService.instance;
  }

  // Set up connection monitoring
  private setupConnectionMonitoring(): void {
    const wsService = getWebSocketService();

    // Listen to connection events
    wsService.subscribe('close', () => {
      this.handleDisconnection();
    });

    wsService.subscribe('error', () => {
      this.handleConnectionError();
    });

    wsService.subscribe('open', () => {
      this.handleReconnection();
    });
  }

  // Handle disconnection
  private handleDisconnection(): void {
    console.log('Connection disconnected, initiating fallback procedures');

    // Set timeout to switch to offline state if reconnection doesn't happen
    this.timeoutId = setTimeout(() => {
      this.setFallbackState('offline');
      this.attemptReconnection();
    }, this.config.offlineTimeout);

    // Switch to degraded state immediately
    this.setFallbackState('degraded');
  }

  // Handle connection error
  private handleConnectionError(): void {
    console.log('Connection error occurred, adjusting fallback state');

    if (this.retryCount < this.config.maxRetries) {
      this.setFallbackState('degraded');
    } else {
      this.setFallbackState('offline');
    }
  }

  // Handle reconnection
  private handleReconnection(): void {
    console.log('Connection reestablished, initiating recovery');

    // Clear any timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    // Set recovery state temporarily
    this.setFallbackState('recovery');

    // After recovery delay, switch back to normal
    setTimeout(() => {
      this.setFallbackState('normal');
      this.retryCount = 0; // Reset retry count
    }, this.config.recoveryDelay);
  }

  // Attempt reconnection
  private attemptReconnection(): void {
    if (this.retryCount >= this.config.maxRetries) {
      console.log('Max retry attempts reached, staying in offline state');
      return;
    }

    console.log(`Attempting reconnection... (attempt ${this.retryCount + 1}/${this.config.maxRetries})`);

    this.retryCount++;

    this.retryTimeoutId = setTimeout(() => {
      const wsService = getWebSocketService();

      if (!wsService.isConnected()) {
        // Try to reconnect
        try {
          // In a real implementation, this would reconnect the WebSocket
          // wsService.reconnect();
          this.attemptReconnection(); // Recursive call to try again
        } catch (error) {
          console.error('Reconnection failed:', error);
          this.attemptReconnection(); // Try again
        }
      } else {
        // Connection restored
        this.handleReconnection();
      }
    }, this.config.retryInterval);
  }

  // Set fallback state and notify listeners
  private setFallbackState(state: FallbackState): void {
    if (this.fallbackState !== state) {
      this.fallbackState = state;
      this.notifyStateListeners();
    }
  }

  // Add state listener
  public addStateListener(callback: (state: FallbackState) => void): () => void {
    this.stateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.stateListeners.indexOf(callback);
      if (index > -1) {
        this.stateListeners.splice(index, 1);
      }
    };
  }

  // Notify state listeners
  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      try {
        listener(this.fallbackState);
      } catch (error) {
        console.error('Error in fallback state listener:', error);
      }
    });
  }

  // Get current fallback state
  public getState(): FallbackState {
    return this.fallbackState;
  }

  // Cache data for offline use
  public cacheData(key: string, data: any): void {
    const timestamp = Date.now();
    const expiry = timestamp + this.config.cacheDuration;

    this.cache.set(key, {
      data,
      timestamp,
      expiry
    });
  }

  // Get cached data
  public getCachedData(key: string): any | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Execute operation with fallback
  public async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => T,
    key?: string
  ): Promise<T> {
    try {
      if (this.fallbackState === 'offline' || this.fallbackState === 'critical') {
        // Use fallback operation
        const result = fallbackOperation();

        // Cache the result if key is provided
        if (key) {
          this.cacheData(key, result);
        }

        return result;
      }

      // Try primary operation
      const result = await primaryOperation();

      // Cache the result if key is provided
      if (key) {
        this.cacheData(key, result);
      }

      return result;
    } catch (error) {
      console.error('Primary operation failed, using fallback:', error);

      // If primary fails, try cached data first
      if (key) {
        const cachedResult = this.getCachedData(key);
        if (cachedResult !== null) {
          console.log('Using cached data as fallback');
          return cachedResult;
        }
      }

      // Otherwise use fallback operation
      const result = fallbackOperation();

      // Cache the fallback result
      if (key) {
        this.cacheData(key, result);
      }

      return result;
    }
  }

  // Get offline-ready data
  public getOfflineReadyData<T>(primaryData: T, fallbackData: T): T {
    return this.fallbackState === 'offline' || this.fallbackState === 'critical'
      ? fallbackData
      : primaryData;
  }

  // Force offline mode (for testing)
  public forceOffline(): void {
    this.setFallbackState('offline');
  }

  // Restore online mode (for testing)
  public restoreOnline(): void {
    this.setFallbackState('recovery');
    setTimeout(() => {
      this.setFallbackState('normal');
    }, this.config.recoveryDelay);
  }

  // Get retry count
  public getRetryCount(): number {
    return this.retryCount;
  }

  // Reset retry count
  public resetRetryCount(): void {
    this.retryCount = 0;
  }

  // Cleanup method
  public destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.stateListeners = [];
    this.cache.clear();
  }
}

// React hook for fallback mechanisms
export const useFallbackMechanisms = (config?: FallbackConfig) => {
  const [fallbackState, setFallbackState] = useState<FallbackState>('normal');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const fallbackService = FallbackService.getInstance(config);

  useEffect(() => {
    const unsubscribe = fallbackService.addStateListener((state) => {
      setFallbackState(state);
      setIsOffline(state === 'offline' || state === 'critical');
      setRetryCount(fallbackService.getRetryCount());
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const executeWithFallback = useCallback(
    async <T>(
      primaryOperation: () => Promise<T>,
      fallbackOperation: () => T,
      key?: string
    ): Promise<T> => {
      return fallbackService.executeWithFallback(primaryOperation, fallbackOperation, key);
    },
    []
  );

  const getOfflineReadyData = useCallback(
    <T>(primaryData: T, fallbackData: T): T => {
      return fallbackService.getOfflineReadyData(primaryData, fallbackData);
    },
    []
  );

  return {
    fallbackState,
    retryCount,
    isOffline,
    executeWithFallback,
    getOfflineReadyData,
    forceOffline: fallbackService.forceOffline.bind(fallbackService),
    restoreOnline: fallbackService.restoreOnline.bind(fallbackService),
    resetRetryCount: fallbackService.resetRetryCount.bind(fallbackService),
    getCachedData: fallbackService.getCachedData.bind(fallbackService),
    cacheData: fallbackService.cacheData.bind(fallbackService),
  };
};

// Fallback provider component
interface FallbackProviderProps {
  children: React.ReactNode;
  config?: FallbackConfig;
}

export const FallbackProvider: React.FC<FallbackProviderProps> = ({ children, config }) => {
  const { fallbackState, isOffline } = useFallbackMechanisms(config);

  return (
    <div className={`fallback-wrapper ${isOffline ? 'offline-mode' : 'online-mode'}`}>
      {children}

      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
          Working Offline
        </div>
      )}

      {/* Degraded mode indicator */}
      {fallbackState === 'degraded' && !isOffline && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded shadow-lg z-50">
          Limited Connectivity
        </div>
      )}
    </div>
  );
};

// Offline-aware component
interface OfflineAwareProps {
  onlineComponent: React.ReactNode;
  offlineComponent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const OfflineAware: React.FC<OfflineAwareProps> = ({
  onlineComponent,
  offlineComponent,
  children,
  className = ''
}) => {
  const { isOffline } = useFallbackMechanisms();

  return (
    <div className={className}>
      {isOffline
        ? (offlineComponent || children || <div>You are currently offline</div>)
        : (children || onlineComponent)}
    </div>
  );
};

// Fallback animation component
interface FallbackAnimationProps {
  children: React.ReactNode;
  fallbackChildren?: React.ReactNode;
  className?: string;
}

export const FallbackAnimation: React.FC<FallbackAnimationProps> = ({
  children,
  fallbackChildren,
  className = ''
}) => {
  const { fallbackState } = useFallbackMechanisms();
  const { performanceMetrics } = useAnimationState();

  // If we're offline or performance is degraded, use fallback
  const shouldUseFallback = fallbackState === 'offline' ||
                           fallbackState === 'critical' ||
                           performanceMetrics.shouldOptimize;

  return (
    <div className={className}>
      {shouldUseFallback
        ? (fallbackChildren || <div>Fallback content</div>)
        : children}
    </div>
  );
};

// Cache-first data loader
interface CacheFirstLoaderProps<T> {
  loadData: () => Promise<T>;
  fallbackData: T;
  cacheKey: string;
  children: (data: T, isLoading: boolean, isOffline: boolean) => React.ReactNode;
}

export const CacheFirstLoader = <T extends {}>({
  loadData,
  fallbackData,
  cacheKey,
  children
}: CacheFirstLoaderProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { executeWithFallback, getCachedData } = useFallbackMechanisms();
  const { isOffline } = useFallbackMechanisms();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // First, try to get cached data
      const cached = getCachedData(cacheKey) as T | null;
      if (cached) {
        setData(cached);
      }

      // Then try to load fresh data
      const result = await executeWithFallback(
        loadData,
        () => fallbackData,
        cacheKey
      );

      setData(result);
      setIsLoading(false);
    };

    fetchData();
  }, [cacheKey, loadData, executeWithFallback, getCachedData, fallbackData]);

  return <>{children(data || fallbackData, isLoading, isOffline)}</>;
};

// Export the service instance
export default FallbackService.getInstance();