import React, { useEffect, useState } from 'react';
import { useAnimationState } from '../hooks/use-animation-state';
import { useUserPreferences } from '../context/UserPreferencesContext';

// Animation state interface for persistence
export interface PersistedAnimationState {
  avatarExpression: string;
  animationSequence: string[];
  isActive: boolean;
  triggerEvent: string;
  duration: number;
  intensity: number;
  timestamp: number;
  conversationId?: string;
}

// Agent activity state for persistence
export interface PersistedAgentActivity {
  agentName: string;
  status: string;
  startTime: string;
  endTime?: string;
  visualIndicator: string;
  priority: number;
  conversationId?: string;
}

// User preferences for persistence
export interface PersistedUserPreferences {
  animationsEnabled: boolean;
  animationSpeed: number;
  motionSensitivity: 'low' | 'medium' | 'high';
  colorTheme: string;
  avatarStyle: string;
  lastUpdated: number;
}

// Persistence configuration
export interface PersistenceConfig {
  keyPrefix: string;
  ttl: number; // Time-to-live in milliseconds
  autoSave: boolean;
  saveInterval: number; // milliseconds
}

// Default persistence configuration
const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  keyPrefix: 'ai-animated-frontend',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  autoSave: true,
  saveInterval: 5000, // 5 seconds
};

// State persistence service
class StatePersistenceService {
  private static instance: StatePersistenceService | null = null;
  private config: PersistenceConfig;
  private saveIntervalId: NodeJS.Timeout | null = null;

  private constructor(config: PersistenceConfig = DEFAULT_PERSISTENCE_CONFIG) {
    this.config = config;
  }

  // Singleton pattern
  static getInstance(config?: PersistenceConfig): StatePersistenceService {
    if (!StatePersistenceService.instance) {
      StatePersistenceService.instance = new StatePersistenceService(config);
    }
    return StatePersistenceService.instance;
  }

  // Generate storage key with prefix
  private getKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  // Save data to localStorage with TTL
  saveData(key: string, data: any): void {
    const storageKey = this.getKey(key);
    const item = {
      data,
      timestamp: Date.now(),
      ttl: this.config.ttl
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  // Load data from localStorage with TTL check
  loadData<T>(key: string): T | null {
    const storageKey = this.getKey(key);

    try {
      const itemStr = localStorage.getItem(storageKey);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);

      // Check if data has expired
      if (Date.now() - item.timestamp > item.ttl) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return item.data as T;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return null;
    }
  }

  // Remove data from localStorage
  removeData(key: string): void {
    const storageKey = this.getKey(key);
    localStorage.removeItem(storageKey);
  }

  // Clear all persisted data
  clearAll(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.keyPrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Save animation state
  saveAnimationState(state: PersistedAnimationState): void {
    this.saveData('animation-state', state);
  }

  // Load animation state
  loadAnimationState(): PersistedAnimationState | null {
    return this.loadData<PersistedAnimationState>('animation-state');
  }

  // Save agent activities
  saveAgentActivities(activities: PersistedAgentActivity[]): void {
    this.saveData('agent-activities', activities);
  }

  // Load agent activities
  loadAgentActivities(): PersistedAgentActivity[] | null {
    return this.loadData<PersistedAgentActivity[]>('agent-activities');
  }

  // Save user preferences
  saveUserPreferences(prefs: PersistedUserPreferences): void {
    this.saveData('user-preferences', prefs);
  }

  // Load user preferences
  loadUserPreferences(): PersistedUserPreferences | null {
    return this.loadData<PersistedUserPreferences>('user-preferences');
  }

  // Start auto-save interval
  startAutoSave(): void {
    if (!this.config.autoSave || this.saveIntervalId) return;

    this.saveIntervalId = setInterval(() => {
      // This would be implemented by consumers who want to auto-save
    }, this.config.saveInterval);
  }

  // Stop auto-save interval
  stopAutoSave(): void {
    if (this.saveIntervalId) {
      clearInterval(this.saveIntervalId);
      this.saveIntervalId = null;
    }
  }

  // Check if data exists
  hasData(key: string): boolean {
    return this.loadData(key) !== null;
  }

  // Get all persisted keys
  getAllKeys(): string[] {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.keyPrefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

  // Get storage usage
  getStorageUsage(): { used: number; total: number } {
    let used = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.keyPrefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // Estimate total storage (varies by browser, typically 5-10MB)
    const total = 5 * 1024 * 1024; // 5MB estimate

    return { used, total };
  }

  // Cleanup expired entries
  cleanupExpired(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.keyPrefix)) {
        try {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);
            if (Date.now() - item.timestamp > item.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If parsing fails, remove the key
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// React hook for state persistence
export const useStatePersistence = (config?: PersistenceConfig) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const persistenceService = StatePersistenceService.getInstance(config);

  // Load initial state
  useEffect(() => {
    const loadInitialData = () => {
      persistenceService.cleanupExpired();
      setIsLoaded(true);
    };

    loadInitialData();
  }, []);

  const saveAnimationState = (state: any) => {
    const persistedState: PersistedAnimationState = {
      avatarExpression: state.avatarExpression,
      animationSequence: state.animationSequence,
      isActive: state.isActive,
      triggerEvent: state.triggerEvent,
      duration: state.duration,
      intensity: state.intensity,
      timestamp: Date.now(),
      conversationId: state.conversationId
    };

    persistenceService.saveAnimationState(persistedState);
  };

  const loadAnimationState = () => {
    return persistenceService.loadAnimationState();
  };

  const saveAgentActivities = (activities: any[]) => {
    const persistedActivities: PersistedAgentActivity[] = activities.map(activity => ({
      agentName: activity.agentName,
      status: activity.status,
      startTime: activity.startTime.toISOString(),
      endTime: activity.endTime?.toISOString(),
      visualIndicator: activity.visualIndicator,
      priority: activity.priority,
      conversationId: activity.conversationId
    }));

    persistenceService.saveAgentActivities(persistedActivities);
  };

  const loadAgentActivities = () => {
    return persistenceService.loadAgentActivities();
  };

  const saveUserPreferences = (prefs: any) => {
    const persistedPrefs: PersistedUserPreferences = {
      animationsEnabled: prefs.animationsEnabled,
      animationSpeed: prefs.animationSpeed,
      motionSensitivity: prefs.motionSensitivity,
      colorTheme: prefs.colorTheme,
      avatarStyle: prefs.avatarStyle,
      lastUpdated: Date.now()
    };

    persistenceService.saveUserPreferences(persistedPrefs);
  };

  const loadUserPreferences = () => {
    return persistenceService.loadUserPreferences();
  };

  const clearAll = () => {
    persistenceService.clearAll();
  };

  const getStorageUsage = () => {
    return persistenceService.getStorageUsage();
  };

  return {
    isLoaded,
    saveAnimationState,
    loadAnimationState,
    saveAgentActivities,
    loadAgentActivities,
    saveUserPreferences,
    loadUserPreferences,
    clearAll,
    getStorageUsage,
    hasData: persistenceService.hasData.bind(persistenceService),
    cleanupExpired: persistenceService.cleanupExpired.bind(persistenceService)
  };
};

// Persistence provider component
interface StatePersistenceProviderProps {
  children: React.ReactNode;
  config?: PersistenceConfig;
}

export const StatePersistenceProvider: React.FC<StatePersistenceProviderProps> = ({ children, config }) => {
  const { isLoaded } = useStatePersistence(config);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

// Hook to sync animation state with persistence
export const usePersistentAnimationState = () => {
  const { loadAnimationState, saveAnimationState } = useStatePersistence();
  const { animationState, updateAnimationState } = useAnimationState();

  // Load persisted state on mount
  useEffect(() => {
    const persisted = loadAnimationState();
    if (persisted) {
      updateAnimationState({
        avatarExpression: persisted.avatarExpression,
        animationSequence: persisted.animationSequence,
        isActive: persisted.isActive,
        triggerEvent: persisted.triggerEvent,
        duration: persisted.duration,
        intensity: persisted.intensity,
      });
    }
  }, [loadAnimationState, updateAnimationState]);

  // Save state when it changes
  useEffect(() => {
    saveAnimationState(animationState);
  }, [animationState, saveAnimationState]);

  return { animationState, updateAnimationState };
};

// Hook to sync user preferences with persistence
export const usePersistentUserPreferences = () => {
  const { loadUserPreferences, saveUserPreferences } = useStatePersistence();
  const { preferences, updatePreferences } = useUserPreferences();

  // Load persisted preferences on mount
  useEffect(() => {
    const persisted = loadUserPreferences();
    if (persisted) {
      updatePreferences({
        animationsEnabled: persisted.animationsEnabled,
        animationSpeed: persisted.animationSpeed,
        motionSensitivity: persisted.motionSensitivity,
        colorTheme: persisted.colorTheme,
        avatarStyle: persisted.avatarStyle,
      });
    }
  }, [loadUserPreferences, updatePreferences]);

  // Save preferences when they change
  useEffect(() => {
    saveUserPreferences(preferences);
  }, [preferences, saveUserPreferences]);

  return { preferences, updatePreferences };
};

// Utility function to migrate old data formats
export const migratePersistedData = () => {
  const service = StatePersistenceService.getInstance();

  // Example migration - would need to be adapted based on actual old format
  const oldKey = 'animation-state-old';
  const newData = service.loadData<any>(oldKey);

  if (newData) {
    // Transform old data to new format
    const migratedData: PersistedAnimationState = {
      avatarExpression: newData.expression || 'neutral',
      animationSequence: newData.sequence || [],
      isActive: newData.active || false,
      triggerEvent: newData.event || 'none',
      duration: newData.duration || 300,
      intensity: newData.intensity || 5,
      timestamp: Date.now()
    };

    // Save in new format and remove old
    service.saveAnimationState(migratedData);
    service.removeData(oldKey);
  }
};

// Export the service instance
export default StatePersistenceService.getInstance();