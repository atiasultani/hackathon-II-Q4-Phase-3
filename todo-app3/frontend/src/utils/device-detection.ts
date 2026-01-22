import React, { useState, useEffect, useCallback } from 'react';

// Device capability detection for adaptive animations

// Device capability interface
export interface DeviceCapabilities {
  hardwareConcurrency: number;
  deviceMemory: number | null;
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  supportsWebAssembly: boolean;
  supportsCSSAnimation: boolean;
  supportsCSSTransforms: boolean;
  supportsCSS3DTransforms: boolean;
  screenResolution: {
    width: number;
    height: number;
  };
  pixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isTouchCapable: boolean;
  isLowEndDevice: boolean;
  batteryLevel: number | null;
  connectionType: 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'other' | 'unknown';
  effectiveConnectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'lte' | 'ethernet' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // Round-trip time in ms
  cpuClass: string | null;
  platform: string;
  userAgent: string;
}

// Device class interface
export type DeviceClass = 'high-end' | 'mid-range' | 'low-end' | 'unknown';

// Capability thresholds for classification
interface CapabilityThresholds {
  minCores: number;
  minMemory: number;
  minBatteryLevel: number;
  minConnectionSpeed: number; // Mbps
  maxRTT: number; // ms
}

const DEFAULT_THRESHOLDS: CapabilityThresholds = {
  minCores: 4,
  minMemory: 4, // GB
  minBatteryLevel: 0.2, // 20%
  minConnectionSpeed: 10, // Mbps
  maxRTT: 100, // ms
};

// Device detection service
class DeviceDetectionService {
  private static instance: DeviceDetectionService | null = null;
  private capabilities: DeviceCapabilities | null = null;
  private thresholds: CapabilityThresholds;

  private constructor(thresholds: CapabilityThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  // Singleton pattern
  static getInstance(thresholds?: CapabilityThresholds): DeviceDetectionService {
    if (!DeviceDetectionService.instance) {
      DeviceDetectionService.instance = new DeviceDetectionService(thresholds);
    }
    return DeviceDetectionService.instance;
  }

  // Detect all device capabilities
  async detectCapabilities(): Promise<DeviceCapabilities> {
    // Use cached capabilities if available and recent
    if (this.capabilities) {
      return this.capabilities;
    }

    // Gather all capabilities in parallel
    const [
      hardwareConcurrency,
      deviceMemory,
      supportsWebGL,
      supportsWebGL2,
      supportsWebAssembly,
      screenInfo,
      isMobile,
      isTablet,
      isTouchCapable,
      batteryLevel,
      connectionInfo,
      cpuClass,
      platform,
      userAgent
    ] = await Promise.all([
      this.detectHardwareConcurrency(),
      this.detectDeviceMemory(),
      this.detectWebGLSupport(),
      this.detectWebGL2Support(),
      this.detectWebAssemblySupport(),
      this.detectScreenInfo(),
      this.detectMobile(),
      this.detectTablet(),
      this.detectTouchCapability(),
      this.detectBatteryLevel(),
      this.detectConnectionInfo(),
      this.detectCPUClass(),
      this.detectPlatform(),
      this.detectUserAgent()
    ]);

    this.capabilities = {
      hardwareConcurrency,
      deviceMemory,
      supportsWebGL,
      supportsWebGL2,
      supportsWebAssembly,
      supportsCSSAnimation: this.detectCSSAnimationSupport(),
      supportsCSSTransforms: this.detectCSSTransformSupport(),
      supportsCSS3DTransforms: this.detectCSS3DTransformSupport(),
      screenResolution: screenInfo.resolution,
      pixelRatio: screenInfo.pixelRatio,
      isMobile,
      isTablet,
      isTouchCapable,
      isLowEndDevice: this.classifyDevice(hardwareConcurrency, deviceMemory) === 'low-end',
      batteryLevel,
      connectionType: connectionInfo.type,
      effectiveConnectionType: connectionInfo.effectiveType,
      downlink: connectionInfo.downlink,
      rtt: connectionInfo.rtt,
      cpuClass,
      platform,
      userAgent
    };

    return this.capabilities;
  }

  // Detect hardware concurrency (number of CPU cores)
  private detectHardwareConcurrency(): number {
    return navigator.hardwareConcurrency || 4; // Default to 4 cores
  }

  // Detect device memory
  private detectDeviceMemory(): number | null {
    const nav = navigator as any;
    return nav.deviceMemory || null; // Returns GB of RAM, if available
  }

  // Detect WebGL support
  private detectWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  // Detect WebGL2 support
  private detectWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGL2RenderingContext &&
        canvas.getContext('webgl2')
      );
    } catch (e) {
      return false;
    }
  }

  // Detect WebAssembly support
  private detectWebAssemblySupport(): boolean {
    try {
      return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    } catch (e) {
      return false;
    }
  }

  // Detect CSS animation support
  private detectCSSAnimationSupport(): boolean {
    const element = document.createElement('div');
    return (
      element.style.animationName !== undefined ||
      (element.style as any).webkitAnimationName !== undefined
    );
  }

  // Detect CSS transform support
  private detectCSSTransformSupport(): boolean {
    const element = document.createElement('div');
    return (
      element.style.transform !== undefined ||
      (element.style as any).webkitTransform !== undefined ||
      (element.style as any).msTransform !== undefined ||
      (element.style as any).MozTransform !== undefined ||
      (element.style as any).OTransform !== undefined
    );
  }

  // Detect CSS 3D transform support
  private detectCSS3DTransformSupport(): boolean {
    const element = document.createElement('div');
    element.style.transform = 'translateZ(0)';
    const has3D = getComputedStyle(element).getPropertyValue('transform') !== 'none' ||
                  getComputedStyle(element).getPropertyValue('-webkit-transform') !== 'none';

    // Reset transform
    element.style.transform = '';
    return has3D;
  }

  // Detect screen information
  private detectScreenInfo(): { resolution: { width: number; height: number }; pixelRatio: number } {
    return {
      resolution: {
        width: window.screen.width,
        height: window.screen.height
      },
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  // Detect if device is mobile
  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Detect if device is tablet
  private detectTablet(): boolean {
    return /iPad|Android.*mobile|Windows NT.*Touch/i.test(navigator.userAgent);
  }

  // Detect if device supports touch
  private detectTouchCapability(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Detect battery level (if supported)
  private async detectBatteryLevel(): Promise<number | null> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Detect network connection information
  private detectConnectionInfo(): {
    type: 'bluetooth' | 'cellular' | 'ethernet' | 'wifi' | 'wimax' | 'other' | 'unknown';
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'lte' | 'ethernet' | 'unknown';
    downlink: number;
    rtt: number;
  } {
    const connection: any = navigator.connection ||
                          (navigator as any).mozConnection ||
                          (navigator as any).webkitConnection;

    if (connection) {
      return {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      };
    }

    return {
      type: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0
    };
  }

  // Detect CPU class (for older browsers)
  private detectCPUClass(): string | null {
    return (navigator as any).cpuClass || null;
  }

  // Detect platform
  private detectPlatform(): string {
    return navigator.platform;
  }

  // Detect user agent
  private detectUserAgent(): string {
    return navigator.userAgent;
  }

  // Classify device based on capabilities
  classifyDevice(cores: number, memory: number | null): DeviceClass {
    if (!memory) {
      // If memory info not available, classify based on cores
      if (cores >= 6) return 'high-end';
      if (cores >= 4) return 'mid-range';
      return 'low-end';
    }

    // Classification based on both cores and memory
    if (cores >= 8 && memory >= 8) return 'high-end';
    if (cores >= 4 && memory >= 4) return 'mid-range';
    return 'low-end';
  }

  // Get device class
  async getDeviceClass(): Promise<DeviceClass> {
    const capabilities = await this.detectCapabilities();
    return this.classifyDevice(capabilities.hardwareConcurrency, capabilities.deviceMemory);
  }

  // Check if device can handle complex animations
  async canHandleComplexAnimations(): Promise<boolean> {
    const capabilities = await this.detectCapabilities();

    // High-end devices can handle complex animations
    if (await this.getDeviceClass() === 'high-end') return true;

    // Check other factors
    return capabilities.supportsWebGL2 &&
           capabilities.hardwareConcurrency >= 4 &&
           capabilities.deviceMemory !== null &&
           capabilities.deviceMemory >= 4;
  }

  // Get animation adaptation level (0-1 scale)
  async getAnimationAdaptationLevel(): Promise<number> {
    const capabilities = await this.detectCapabilities();
    const deviceClass = await this.getDeviceClass();

    // Base level based on device class
    let level = 0.5; // Default medium

    if (deviceClass === 'high-end') {
      level = 1.0; // Full animations
    } else if (deviceClass === 'mid-range') {
      level = 0.7; // Mostly full animations
    } else {
      level = 0.4; // Reduced animations
    }

    // Adjust based on battery level
    if (capabilities.batteryLevel !== null && capabilities.batteryLevel < 0.2) {
      level *= 0.8; // Reduce animations when battery is low
    }

    // Adjust based on connection quality
    if (capabilities.effectiveConnectionType === 'slow-2g' || capabilities.effectiveConnectionType === '2g') {
      level *= 0.7; // Further reduce animations on slow connections
    }

    return Math.max(0.1, Math.min(1.0, level));
  }

  // Get recommended animation settings based on device capabilities
  async getRecommendedAnimationSettings() {
    const adaptationLevel = await this.getAnimationAdaptationLevel();

    return {
      fps: adaptationLevel > 0.7 ? 60 : adaptationLevel > 0.4 ? 30 : 20,
      complexity: adaptationLevel > 0.7 ? 'high' : adaptationLevel > 0.4 ? 'medium' : 'low',
      enable3D: adaptationLevel > 0.5 && (await this.detectCapabilities()).supportsWebGL2,
      enableComplexEffects: adaptationLevel > 0.6,
      frameSkippingAllowed: adaptationLevel < 0.5
    };
  }

  // Reset cached capabilities
  resetCache(): void {
    this.capabilities = null;
  }
}

// React hook for device detection
export const useDeviceDetection = () => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [deviceClass, setDeviceClass] = useState<DeviceClass>('unknown');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const detect = async () => {
      setIsLoading(true);
      try {
        const service = DeviceDetectionService.getInstance();
        const caps = await service.detectCapabilities();
        const cls = await service.getDeviceClass();

        setCapabilities(caps);
        setDeviceClass(cls);
      } catch (error) {
        console.error('Error detecting device capabilities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    detect();
  }, []);

  const getRecommendedSettings = useCallback(async () => {
    const service = DeviceDetectionService.getInstance();
    return await service.getRecommendedAnimationSettings();
  }, []);

  const canHandleComplexAnimations = useCallback(async () => {
    const service = DeviceDetectionService.getInstance();
    return await service.canHandleComplexAnimations();
  }, []);

  return {
    capabilities,
    deviceClass,
    isLoading,
    getRecommendedSettings,
    canHandleComplexAnimations,
    refresh: () => {
      DeviceDetectionService.getInstance().resetCache();
      // Trigger re-detection by forcing a re-render
      setIsLoading(true);
      setTimeout(() => {
        const detect = async () => {
          try {
            const service = DeviceDetectionService.getInstance();
            const caps = await service.detectCapabilities();
            const cls = await service.getDeviceClass();

            setCapabilities(caps);
            setDeviceClass(cls);
          } finally {
            setIsLoading(false);
          }
        };
        detect();
      }, 0);
    }
  };
};

// Utility function to adapt animations based on device
export const adaptAnimationsToDevice = async <T>(highEnd: T, midRange: T, lowEnd: T): Promise<T> => {
  const service = DeviceDetectionService.getInstance();
  const deviceClass = await service.getDeviceClass();

  switch (deviceClass) {
    case 'high-end':
      return highEnd;
    case 'mid-range':
      return midRange;
    case 'low-end':
      return lowEnd;
    default:
      return midRange; // Default to mid-range
  }
};

// HOC to wrap components with device-aware capabilities
export const withDeviceAwareness = <P extends object>(
  Component: React.ComponentType<P & { deviceCapabilities?: DeviceCapabilities; deviceClass?: DeviceClass }>,
  options?: { refreshOnMount?: boolean }
) => {
  return (props: P) => {
    const { capabilities, deviceClass, isLoading, refresh } = useDeviceDetection();

    useEffect(() => {
      if (options?.refreshOnMount) {
        refresh();
      }
    }, [options?.refreshOnMount, refresh]);

    if (isLoading) {
      return <div>Detecting device capabilities...</div>;
    }

    return (
      <Component
        {...props}
        deviceCapabilities={capabilities}
        deviceClass={deviceClass}
      />
    );
  };
};

// Component to render different content based on device class
interface DeviceAwareRendererProps {
  children: React.ReactNode;
  highEnd?: React.ReactNode;
  midRange?: React.ReactNode;
  lowEnd?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const DeviceAwareRenderer: React.FC<DeviceAwareRendererProps> = ({
  children,
  highEnd,
  midRange,
  lowEnd,
  fallback
}) => {
  const { deviceClass, isLoading } = useDeviceDetection();

  if (isLoading) {
    return <div>Detecting device...</div>;
  }

  switch (deviceClass) {
    case 'high-end':
      return highEnd || children;
    case 'mid-range':
      return midRange || children;
    case 'low-end':
      return lowEnd || (fallback || children);
    default:
      return children;
  }
};

// Export the service instance
export default DeviceDetectionService.getInstance();