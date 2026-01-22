import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useAnimationState } from '../../hooks/use-animation-state';
import { useDeviceDetection } from '../../utils/device-detection';
import { AccessibilityControls } from '../../components/ai-avatar/AccessibilityControls';

// Animation settings interface
interface AnimationSettings {
  animationsEnabled: boolean;
  animationSpeed: number;
  motionSensitivity: 'low' | 'medium' | 'high';
  colorTheme: string;
  avatarStyle: string;
  particleEffects: boolean;
  shadowEffects: boolean;
  transitionStyle: 'smooth' | 'instant' | 'bouncy';
  complexityLevel: 'low' | 'medium' | 'high';
  fpsLimit: number;
  enable3D: boolean;
  showAnimationsOnIdle: boolean;
}

// Default animation settings
const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  animationsEnabled: true,
  animationSpeed: 1,
  motionSensitivity: 'medium',
  colorTheme: 'default',
  avatarStyle: 'default',
  particleEffects: true,
  shadowEffects: true,
  transitionStyle: 'smooth',
  complexityLevel: 'medium',
  fpsLimit: 60,
  enable3D: true,
  showAnimationsOnIdle: true,
};

// Animation settings component
const AnimationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  const { performanceMetrics } = useAnimationState();
  const { deviceClass, capabilities, getRecommendedSettings } = useDeviceDetection();
  const [settings, setSettings] = useState<AnimationSettings>(DEFAULT_ANIMATION_SETTINGS);
  const [recommended, setRecommended] = useState<Partial<AnimationSettings> | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load settings from user preferences
  useEffect(() => {
    const loadedSettings: AnimationSettings = {
      animationsEnabled: preferences.animationsEnabled,
      animationSpeed: preferences.animationSpeed,
      motionSensitivity: preferences.motionSensitivity,
      colorTheme: preferences.colorTheme,
      avatarStyle: preferences.avatarStyle,
      particleEffects: true, // Default values
      shadowEffects: true,
      transitionStyle: 'smooth',
      complexityLevel: 'medium',
      fpsLimit: 60,
      enable3D: true,
      showAnimationsOnIdle: true,
    };

    setSettings(loadedSettings);
  }, [preferences]);

  // Get recommended settings based on device
  useEffect(() => {
    const loadRecommended = async () => {
      const recSettings = await getRecommendedSettings();
      setRecommended(recSettings as Partial<AnimationSettings>);
    };

    loadRecommended();
  }, [getRecommendedSettings]);

  // Handle setting changes
  const handleSettingChange = (key: keyof AnimationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update user preferences for relevant settings
    if (key === 'animationsEnabled' || key === 'animationSpeed' ||
        key === 'motionSensitivity' || key === 'colorTheme' || key === 'avatarStyle') {
      updatePreferences({ [key]: value });
    }
  };

  // Apply recommended settings
  const applyRecommendedSettings = () => {
    if (recommended) {
      const newSettings = { ...settings, ...recommended };
      setSettings(newSettings);

      // Update user preferences for relevant settings
      if (recommended.animationSpeed !== undefined) {
        updatePreferences({ animationSpeed: recommended.animationSpeed });
      }
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(DEFAULT_ANIMATION_SETTINGS);
    updatePreferences({
      animationsEnabled: DEFAULT_ANIMATION_SETTINGS.animationsEnabled,
      animationSpeed: DEFAULT_ANIMATION_SETTINGS.animationSpeed,
      motionSensitivity: DEFAULT_ANIMATION_SETTINGS.motionSensitivity,
      colorTheme: DEFAULT_ANIMATION_SETTINGS.colorTheme,
      avatarStyle: DEFAULT_ANIMATION_SETTINGS.avatarStyle,
    });
  };

  return (
    <div className="animation-settings p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Animation Settings</h2>
        <p className="text-gray-600">
          Customize the animation behavior to suit your preferences and device capabilities.
        </p>
      </div>

      {/* Basic Animation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Animations Enabled */}
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.animationsEnabled}
                onChange={(e) => handleSettingChange('animationsEnabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full ${settings.animationsEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.animationsEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3 font-medium text-gray-700">Enable Animations</div>
          </label>
          <p className="text-sm text-gray-500">Turn all animations on or off</p>
        </div>

        {/* Animation Speed */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Animation Speed: {settings.animationSpeed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.animationSpeed}
            onChange={(e) => handleSettingChange('animationSpeed', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>

        {/* Motion Sensitivity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Motion Sensitivity
          </label>
          <div className="flex space-x-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleSettingChange('motionSensitivity', level)}
                className={`px-4 py-2 rounded-md text-sm capitalize ${
                  settings.motionSensitivity === level
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Color Theme */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Color Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['default', 'dark', 'light', 'high-contrast'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleSettingChange('colorTheme', theme)}
                className={`px-3 py-2 text-sm rounded-md capitalize ${
                  settings.colorTheme === theme
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          <svg
            className={`ml-2 w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
          {/* Transition Style */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Transition Style
            </label>
            <div className="flex space-x-2">
              {(['smooth', 'instant', 'bouncy'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => handleSettingChange('transitionStyle', style)}
                  className={`px-3 py-2 rounded-md text-sm capitalize ${
                    settings.transitionStyle === style
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Complexity Level */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Animation Complexity
            </label>
            <div className="flex space-x-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleSettingChange('complexityLevel', level)}
                  className={`px-3 py-2 rounded-md text-sm capitalize ${
                    settings.complexityLevel === level
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* FPS Limit */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              FPS Limit: {settings.fpsLimit}
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={settings.fpsLimit}
              onChange={(e) => handleSettingChange('fpsLimit', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>15 FPS</span>
              <span>120 FPS</span>
            </div>
          </div>

          {/* Effects Toggles */}
          <div className="space-y-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.particleEffects}
                onChange={(e) => handleSettingChange('particleEffects', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Particle Effects</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shadowEffects}
                onChange={(e) => handleSettingChange('shadowEffects', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Shadow Effects</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable3D}
                onChange={(e) => handleSettingChange('enable3D', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Enable 3D Effects</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showAnimationsOnIdle}
                onChange={(e) => handleSettingChange('showAnimationsOnIdle', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Show Idle Animations</span>
            </label>
          </div>
        </div>
      )}

      {/* Device-Specific Recommendations */}
      {recommended && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Recommendations for Your Device</h3>
          <p className="text-sm text-blue-700 mb-3">
            Based on your device capabilities ({deviceClass}), we recommend these settings for optimal performance:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {recommended.fps && (
              <div>Target FPS: <span className="font-medium">{recommended.fps}</span></div>
            )}
            {recommended.complexity && (
              <div>Animation Complexity: <span className="font-medium capitalize">{recommended.complexity}</span></div>
            )}
            {recommended.enable3D !== undefined && (
              <div>3D Effects: <span className="font-medium">{recommended.enable3D ? 'Enabled' : 'Disabled'}</span></div>
            )}
          </div>
          <button
            onClick={applyRecommendedSettings}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Apply Recommended Settings
          </button>
        </div>
      )}

      {/* Performance Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">Performance Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>Current FPS: <span className="font-medium">{performanceMetrics.fps}</span></div>
          <div>Device: <span className="font-medium capitalize">{deviceClass}</span></div>
          <div>CPU Cores: <span className="font-medium">{capabilities?.hardwareConcurrency}</span></div>
          <div>Memory: <span className="font-medium">{capabilities?.deviceMemory}GB</span></div>
        </div>
      </div>

      {/* Accessibility Controls */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-800 mb-2">Accessibility Controls</h3>
        <AccessibilityControls />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default AnimationSettings;