import { useState, useEffect, useCallback } from 'react';
import { useAnimationState } from '../hooks/use-animation-state';
import { getWebSocketService } from './websocket-service';

// Health check status types
export type HealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'error' | 'monitoring';

// Backend service status
export interface BackendServiceStatus {
  api: HealthStatus;
  database: HealthStatus;
  websocket: HealthStatus;
  cache: HealthStatus;
  queue: HealthStatus;
  timestamp: number;
}

// Health check response
export interface HealthCheckResponse {
  status: HealthStatus;
  services: BackendServiceStatus;
  responseTime: number;
  timestamp: number;
}

// Health check configuration
export interface HealthCheckConfig {
  endpoint: string;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  maxRetries: number;
  degradedThreshold: number; // response time in ms for degraded status
  unavailableThreshold: number; // response time in ms for unavailable status
}

// Default health check configuration
const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  endpoint: '/health',
  interval: 30000, // 30 seconds
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  degradedThreshold: 1000, // 1 second
  unavailableThreshold: 5000 // 5 seconds
};

// Health check service class
class HealthCheckService {
  private static instance: HealthCheckService | null = null;
  private config: HealthCheckConfig;
  private healthStatus: HealthStatus = 'monitoring';
  private serviceStatus: BackendServiceStatus | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Array<(status: HealthStatus, details: BackendServiceStatus | null) => void> = [];
  private animationListeners: Array<(status: HealthStatus) => void> = [];
  private lastCheckTime: number = 0;

  private constructor(config: HealthCheckConfig = DEFAULT_HEALTH_CHECK_CONFIG) {
    this.config = config;
  }

  // Singleton pattern
  static getInstance(config?: HealthCheckConfig): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService(config);
    }
    return HealthCheckService.instance;
  }

  // Initialize health checks
  public initialize(config?: HealthCheckConfig): void {
    if (config) {
      this.config = { ...DEFAULT_HEALTH_CHECK_CONFIG, ...config };
    }

    // Start periodic health checks
    this.startHealthChecks();
  }

  // Start periodic health checks
  private startHealthChecks(): void {
    // Perform initial check
    this.performHealthCheck();

    // Set up recurring checks
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval);
  }

  // Perform a health check
  private async performHealthCheck(): Promise<void> {
    try {
      this.lastCheckTime = Date.now();

      // In a real implementation, this would call the backend health endpoint
      // For now, we'll simulate a health check
      const response = await this.simulateHealthCheck();

      // Update status
      this.healthStatus = response.status;
      this.serviceStatus = response.services;

      // Notify listeners
      this.notifyListeners();

      // Update animations based on health status
      this.updateAnimationsForHealthStatus(response.status);

    } catch (error) {
      console.error('Health check failed:', error);

      // Update to error state
      this.healthStatus = 'error';
      this.notifyListeners();
      this.updateAnimationsForHealthStatus('error');
    }
  }

  // Simulate health check (in real app, this would be an API call)
  private async simulateHealthCheck(): Promise<HealthCheckResponse> {
    // In a real implementation, this would be:
    // const startTime = Date.now();
    // const response = await fetch(`${this.config.endpoint}`);
    // const responseTime = Date.now() - startTime;

    const startTime = Date.now();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

    const responseTime = Date.now() - startTime;

    // Determine status based on response time
    let status: HealthStatus;
    if (responseTime > this.config.unavailableThreshold) {
      status = 'unavailable';
    } else if (responseTime > this.config.degradedThreshold) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // Simulate service statuses
    const services: BackendServiceStatus = {
      api: status,
      database: Math.random() > 0.1 ? 'healthy' : 'degraded', // 10% chance of db issues
      websocket: getWebSocketService().isConnected() ? 'healthy' : 'unavailable',
      cache: Math.random() > 0.05 ? 'healthy' : 'degraded', // 5% chance of cache issues
      queue: Math.random() > 0.02 ? 'healthy' : 'degraded', // 2% chance of queue issues
      timestamp: Date.now()
    };

    return {
      status,
      services,
      responseTime,
      timestamp: Date.now()
    };
  }

  // Add health status listener
  public addHealthListener(callback: (status: HealthStatus, details: BackendServiceStatus | null) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Add animation listener
  public addAnimationListener(callback: (status: HealthStatus) => void): () => void {
    this.animationListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.animationListeners.indexOf(callback);
      if (index > -1) {
        this.animationListeners.splice(index, 1);
      }
    };
  }

  // Notify health status listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.healthStatus, this.serviceStatus);
      } catch (error) {
        console.error('Error in health listener:', error);
      }
    });
  }

  // Update animations based on health status
  private updateAnimationsForHealthStatus(status: HealthStatus): void {
    this.animationListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in animation listener:', error);
      }
    });

    // Update animation state based on health status
    const { updateAnimationState, updateAgentActivity } = useAnimationState();

    // Since we can't directly call the hook here, we'll need to provide a way for consumers
    // to update the animation state based on health status
    this.updateAnimationStateForHealth(status);
  }

  // Update animation state for health status (would be called by consumers)
  private updateAnimationStateForHealth(status: HealthStatus): void {
    // This method would typically be called by the React component that uses the hook
    // For now, we'll just log the status
    console.log(`Health status changed to: ${status}`);
  }

  // Get current health status
  public getHealthStatus(): HealthStatus {
    return this.healthStatus;
  }

  // Get current service status
  public getServiceStatus(): BackendServiceStatus | null {
    return this.serviceStatus;
  }

  // Get last check time
  public getLastCheckTime(): number {
    return this.lastCheckTime;
  }

  // Manual health check
  public async manualHealthCheck(): Promise<HealthCheckResponse> {
    await this.performHealthCheck();
    return {
      status: this.healthStatus,
      services: this.serviceStatus!,
      responseTime: Date.now() - this.lastCheckTime,
      timestamp: Date.now()
    };
  }

  // Pause health checks
  public pauseHealthChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Resume health checks
  public resumeHealthChecks(): void {
    if (!this.intervalId) {
      this.startHealthChecks();
    }
  }

  // Stop health checks
  public stopHealthChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Get health status as a percentage (0-100)
  public getHealthPercentage(): number {
    switch (this.healthStatus) {
      case 'healthy': return 100;
      case 'degraded': return 50;
      case 'unavailable':
      case 'error': return 0;
      case 'monitoring': return 75; // Still establishing
      default: return 75;
    }
  }

  // Check if services are operational
  public areServicesOperational(): boolean {
    if (!this.serviceStatus) return false;

    return this.serviceStatus.api === 'healthy' &&
           this.serviceStatus.database !== 'unavailable';
  }
}

// React hook for health checks
export const useHealthCheck = (config?: HealthCheckConfig) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('monitoring');
  const [serviceStatus, setServiceStatus] = useState<BackendServiceStatus | null>(null);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const healthService = HealthCheckService.getInstance(config);

  useEffect(() => {
    // Initialize health checks
    healthService.initialize(config);

    const unsubscribe = healthService.addHealthListener((status, details) => {
      setHealthStatus(status);
      setServiceStatus(details);
      setLastCheck(Date.now());
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const manualCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      await healthService.manualHealthCheck();
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    healthStatus,
    serviceStatus,
    lastCheck,
    isChecking,
    manualCheck,
    getHealthPercentage: healthService.getHealthPercentage.bind(healthService),
    areServicesOperational: healthService.areServicesOperational.bind(healthService),
    pauseHealthChecks: healthService.pauseHealthChecks.bind(healthService),
    resumeHealthChecks: healthService.resumeHealthChecks.bind(healthService),
  };
};

// Health indicator component
interface HealthIndicatorProps {
  status: HealthStatus;
  className?: string;
  showLabel?: boolean;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  status,
  className = '',
  showLabel = true
}) => {
  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unavailable: 'bg-red-500',
    error: 'bg-red-700',
    monitoring: 'bg-blue-500',
  };

  const statusLabels = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    unavailable: 'Unavailable',
    error: 'Error',
    monitoring: 'Monitoring',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`w-3 h-3 rounded-full ${statusColors[status]} mr-2`} />
      {showLabel && <span className="text-sm">{statusLabels[status]}</span>}
    </div>
  );
};

// Health status banner component
interface HealthStatusBannerProps {
  className?: string;
}

export const HealthStatusBanner: React.FC<HealthStatusBannerProps> = ({ className = '' }) => {
  const { healthStatus, serviceStatus, lastCheck } = useHealthCheck();

  if (healthStatus === 'healthy') {
    return null; // Don't show banner for healthy status
  }

  const statusMessages = {
    degraded: 'System performance is degraded',
    unavailable: 'System is currently unavailable',
    error: 'System error detected',
    monitoring: 'System status is being monitored',
  };

  const statusColors = {
    degraded: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    unavailable: 'bg-red-100 border-red-500 text-red-800',
    error: 'bg-red-200 border-red-700 text-red-900',
    monitoring: 'bg-blue-100 border-blue-500 text-blue-800',
  };

  return (
    <div className={`border-l-4 p-4 ${statusColors[healthStatus]} ${className}`}>
      <div className="flex items-center">
        <HealthIndicator status={healthStatus} showLabel={false} />
        <div className="ml-2">
          <p className="font-medium">{statusMessages[healthStatus]}</p>
          {lastCheck && (
            <p className="text-sm mt-1 opacity-80">
              Last checked: {new Date(lastCheck).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Health-aware animation component
interface HealthAwareAnimationProps {
  children: React.ReactNode;
  healthyComponent?: React.ReactNode;
  degradedComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
}

export const HealthAwareAnimation: React.FC<HealthAwareAnimationProps> = ({
  children,
  healthyComponent,
  degradedComponent,
  errorComponent,
  className = ''
}) => {
  const { healthStatus } = useHealthCheck();

  let displayComponent = children;

  switch (healthStatus) {
    case 'healthy':
      displayComponent = healthyComponent || children;
      break;
    case 'degraded':
      displayComponent = degradedComponent || children;
      break;
    case 'error':
    case 'unavailable':
      displayComponent = errorComponent || children;
      break;
    default:
      displayComponent = children;
  }

  return <div className={className}>{displayComponent}</div>;
};

// Export the service instance
export default HealthCheckService.getInstance();