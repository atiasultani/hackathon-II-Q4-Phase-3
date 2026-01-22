import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { optimizeAnimationForDevice } from '../utils/animation-utils';

// Define types
interface UserPreference {
  animationsEnabled: boolean;
  animationSpeed: number;
  motionSensitivity: 'low' | 'medium' | 'high';
  colorTheme: string;
  avatarStyle: string;
}

interface UserPreferencesContextType {
  preferences: UserPreference;
  updatePreferences: (newPrefs: Partial<UserPreference>) => void;
  resetPreferences: () => void;
  isReducedMotion: boolean;
  shouldAnimate: boolean;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreference = {
  animationsEnabled: true,
  animationSpeed: 1,
  motionSensitivity: 'medium',
  colorTheme: 'light',
  avatarStyle: 'default',
};

// Create context
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Provider component
export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreference>(() => {
    // Load from localStorage or use defaults
    const savedPrefs = localStorage.getItem('user-preferences');
    return savedPrefs ? JSON.parse(savedPrefs) : DEFAULT_PREFERENCES;
  });

  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check for reduced motion preference on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Update localStorage when preferences change
  useEffect(() => {
    localStorage.setItem('user-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Update preferences function
  const updatePreferences = (newPrefs: Partial<UserPreference>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPrefs,
    }));
  };

  // Reset preferences to defaults
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  // Determine if animations should run
  const shouldAnimate = (): boolean => {
    const perfData = optimizeAnimationForDevice();

    return (
      preferences.animationsEnabled &&
      !isReducedMotion &&
      !perfData.shouldOptimize
    );
  };

  const contextValue: UserPreferencesContextType = {
    preferences,
    updatePreferences,
    resetPreferences,
    isReducedMotion,
    shouldAnimate,
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Custom hook to use the context
export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

export default UserPreferencesContext;