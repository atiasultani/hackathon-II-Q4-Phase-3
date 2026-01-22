import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { announceToScreenReader, isReducedMotionPreferred, subscribeToReducedMotion } from '../../utils/accessibility-utils';

interface AccessibilityControlsProps {
  className?: string;
  showLabels?: boolean;
}

const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  className = '',
  showLabels = true
}) => {
  const { preferences, updatePreferences, isReducedMotion } = useUserPreferences();
  const [localReducedMotion, setLocalReducedMotion] = useState(isReducedMotion);

  // Subscribe to reduced motion preference changes
  useEffect(() => {
    const unsubscribe = subscribeToReducedMotion(setLocalReducedMotion);
    return unsubscribe;
  }, []);

  // Handle animations toggle
  const handleAnimationsToggle = () => {
    const newValue = !preferences.animationsEnabled;
    updatePreferences({ animationsEnabled: newValue });

    announceToScreenReader(
      newValue ? 'Animations enabled' : 'Animations disabled',
      'polite'
    );
  };

  // Handle motion sensitivity change
  const handleMotionSensitivityChange = (level: 'low' | 'medium' | 'high') => {
    updatePreferences({ motionSensitivity: level });

    announceToScreenReader(
      `Motion sensitivity set to ${level}`,
      'polite'
    );
  };

  // Handle animation speed change
  const handleAnimationSpeedChange = (speed: number) => {
    updatePreferences({ animationSpeed: speed });

    announceToScreenReader(
      `Animation speed set to ${speed}x`,
      'polite'
    );
  };

  // Handle color theme change
  const handleColorThemeChange = (theme: string) => {
    updatePreferences({ colorTheme: theme });

    announceToScreenReader(
      `Color theme set to ${theme}`,
      'polite'
    );
  };

  return (
    <div className={`accessibility-controls p-4 bg-gray-100 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Accessibility Controls</h3>

      <div className="space-y-4">
        {/* Animations Toggle */}
        <div className="flex items-center justify-between">
          <div>
            {showLabels && (
              <label htmlFor="animations-toggle" className="font-medium text-gray-700">
                Animations
              </label>
            )}
            {localReducedMotion && (
              <div className="text-xs text-orange-600 mt-1">
                System preference: Reduced Motion is ON
              </div>
            )}
          </div>

          <div className="flex items-center">
            <button
              id="animations-toggle"
              onClick={handleAnimationsToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.animationsEnabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
              aria-checked={preferences.animationsEnabled}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-2 text-sm text-gray-600">
              {preferences.animationsEnabled ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {/* Motion Sensitivity Selector */}
        <div>
          {showLabels && (
            <label className="font-medium text-gray-700 block mb-2">
              Motion Sensitivity
            </label>
          )}
          <div className="flex space-x-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleMotionSensitivityChange(level)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  preferences.motionSensitivity === level
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                aria-pressed={preferences.motionSensitivity === level}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Animation Speed Control */}
        <div>
          {showLabels && (
            <label className="font-medium text-gray-700 block mb-2">
              Animation Speed: {preferences.animationSpeed}x
            </label>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAnimationSpeedChange(Math.max(0.5, preferences.animationSpeed - 0.25))}
              className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
              disabled={preferences.animationSpeed <= 0.5}
            >
              -
            </button>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={preferences.animationSpeed}
              onChange={(e) => handleAnimationSpeedChange(parseFloat(e.target.value))}
              className="flex-1"
              aria-label="Animation speed"
            />
            <button
              onClick={() => handleAnimationSpeedChange(Math.min(2, preferences.animationSpeed + 0.25))}
              className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
              disabled={preferences.animationSpeed >= 2}
            >
              +
            </button>
          </div>
        </div>

        {/* Color Theme Selector */}
        <div>
          {showLabels && (
            <label className="font-medium text-gray-700 block mb-2">
              Color Theme
            </label>
          )}
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'high-contrast'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleColorThemeChange(theme)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  preferences.colorTheme === theme
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                aria-pressed={preferences.colorTheme === theme}
              >
                {theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Information about system preferences */}
      {localReducedMotion && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Your system has reduced motion enabled.
            This setting takes precedence over individual animation controls.
          </p>
        </div>
      )}
    </div>
  );
};

// Component to display animation status for screen readers
interface AnimationStatusIndicatorProps {
  isActive?: boolean;
  expression?: string;
  className?: string;
}

export const AnimationStatusIndicator: React.FC<AnimationStatusIndicatorProps> = ({
  isActive = false,
  expression = 'neutral',
  className = ''
}) => {
  const { preferences } = useUserPreferences();

  // Announce animation status changes
  useEffect(() => {
    if (!preferences.animationsEnabled) {
      announceToScreenReader('Animations are disabled', 'polite');
      return;
    }

    if (isActive) {
      announceToScreenReader(`Animation is playing: ${expression}`, 'polite');
    } else {
      announceToScreenReader(`Animation is paused: ${expression}`, 'polite');
    }
  }, [isActive, expression, preferences.animationsEnabled]);

  return (
    <div className={`sr-only ${className}`} aria-live="polite">
      Animation status: {isActive ? 'playing' : 'paused'}, Expression: {expression}
    </div>
  );
};

// Component to provide skip animations functionality
interface SkipAnimationsControlProps {
  onSkip?: () => void;
  className?: string;
}

export const SkipAnimationsControl: React.FC<SkipAnimationsControlProps> = ({
  onSkip,
  className = ''
}) => {
  const [visible, setVisible] = useState(false);

  // Show skip control only when animations are active
  useEffect(() => {
    // In a real implementation, this would listen to animation events
    // For now, we'll just show it briefly
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => {
        setVisible(false);
        if (onSkip) onSkip();
      }}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
    >
      Skip Animations
    </button>
  );
};

export default AccessibilityControls;