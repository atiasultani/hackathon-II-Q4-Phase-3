import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useAnimationState } from '../../hooks/use-animation-state';

// Define customization options for skill indicators
interface SkillCustomizationOptions {
  theme: 'default' | 'dark' | 'light' | 'high-contrast' | 'colorful';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';
  shape: 'square' | 'rounded' | 'circle' | 'pill';
  animationStyle: 'none' | 'subtle' | 'moderate' | 'bold';
  colorScheme: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'custom';
  showProgress: boolean;
  showIcons: boolean;
  showLabels: boolean;
  priorityIndicator: 'none' | 'star' | 'number' | 'color';
  layout: 'horizontal' | 'vertical' | 'grid';
}

// Default customization settings
const DEFAULT_CUSTOMIZATION: SkillCustomizationOptions = {
  theme: 'default',
  size: 'medium',
  shape: 'rounded',
  animationStyle: 'moderate',
  colorScheme: 'blue',
  showProgress: true,
  showIcons: true,
  showLabels: true,
  priorityIndicator: 'star',
  layout: 'horizontal',
};

// Save customization to user preferences
const saveCustomizationToPreferences = (customization: SkillCustomizationOptions) => {
  localStorage.setItem('skill-customization', JSON.stringify(customization));
};

// Load customization from user preferences
const loadCustomizationFromPreferences = (): SkillCustomizationOptions => {
  const saved = localStorage.getItem('skill-customization');
  return saved ? JSON.parse(saved) : DEFAULT_CUSTOMIZATION;
};

// Hook to manage skill customization
export const useSkillCustomization = () => {
  const { preferences, updateUserPreferences } = useUserPreferences();
  const [customization, setCustomization] = useState<SkillCustomizationOptions>(loadCustomizationFromPreferences);

  // Load customization when component mounts
  useEffect(() => {
    const savedCustomization = loadCustomizationFromPreferences();
    setCustomization(savedCustomization);
  }, []);

  // Update preferences when customization changes
  useEffect(() => {
    saveCustomizationToPreferences(customization);

    // Update global preferences based on customization
    updateUserPreferences({
      animationSpeed: getAnimationSpeed(customization.animationStyle),
      colorTheme: customization.theme,
    });
  }, [customization, updateUserPreferences]);

  const updateCustomization = (newCustomization: Partial<SkillCustomizationOptions>) => {
    setCustomization(prev => ({
      ...prev,
      ...newCustomization
    }));
  };

  return {
    customization,
    updateCustomization,
    resetCustomization: () => setCustomization(DEFAULT_CUSTOMIZATION),
  };
};

// Helper function to get animation speed based on style
const getAnimationSpeed = (style: SkillCustomizationOptions['animationStyle']): number => {
  switch (style) {
    case 'none': return 0;
    case 'subtle': return 0.5;
    case 'moderate': return 1;
    case 'bold': return 1.5;
    default: return 1;
  }
};

// Get CSS classes based on customization
export const getCustomizationClasses = (customization: SkillCustomizationOptions, baseClasses: string = ''): string => {
  // Size classes
  const sizeClasses = {
    tiny: 'text-xs',
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  };

  // Shape classes
  const shapeClasses = {
    square: 'rounded-none',
    rounded: 'rounded-md',
    circle: 'rounded-full',
    pill: 'rounded-full',
  };

  // Theme classes
  const themeClasses = {
    default: 'bg-white text-gray-800',
    dark: 'bg-gray-800 text-white',
    light: 'bg-gray-100 text-gray-800',
    'high-contrast': 'bg-black text-yellow-300 border-2 border-yellow-300',
    colorful: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
  };

  // Color scheme classes
  const colorSchemeClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    custom: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  };

  return [
    baseClasses,
    sizeClasses[customization.size],
    shapeClasses[customization.shape],
    customization.theme === 'default' || customization.theme === 'colorful'
      ? colorSchemeClasses[customization.colorScheme]
      : themeClasses[customization.theme],
    'border'
  ].join(' ');
};

// Component for skill customization settings
interface SkillCustomizationPanelProps {
  className?: string;
  onCustomize?: (customization: SkillCustomizationOptions) => void;
}

export const SkillCustomizationPanel: React.FC<SkillCustomizationPanelProps> = ({
  className = '',
  onCustomize
}) => {
  const { customization, updateCustomization, resetCustomization } = useSkillCustomization();

  const handleCustomizationChange = (key: keyof SkillCustomizationOptions, value: any) => {
    updateCustomization({ [key]: value });
    if (onCustomize) onCustomize({ ...customization, [key]: value });
  };

  return (
    <div className={`skill-customization-panel p-6 bg-white rounded-lg shadow-md border ${className}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Customize Skill Indicators</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['default', 'dark', 'light', 'high-contrast', 'colorful'] as const).map(theme => (
              <button
                key={theme}
                onClick={() => handleCustomizationChange('theme', theme)}
                className={`px-3 py-2 rounded-md text-sm capitalize ${
                  customization.theme === theme
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {theme.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size
          </label>
          <div className="flex flex-wrap gap-2">
            {(['tiny', 'small', 'medium', 'large', 'xlarge'] as const).map(size => (
              <button
                key={size}
                onClick={() => handleCustomizationChange('size', size)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  customization.size === size
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Shape Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shape
          </label>
          <div className="flex flex-wrap gap-2">
            {(['square', 'rounded', 'circle', 'pill'] as const).map(shape => (
              <button
                key={shape}
                onClick={() => handleCustomizationChange('shape', shape)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  customization.shape === shape
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={shape === 'circle' ? { borderRadius: '9999px' } : {}}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Animation Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Animation Style
          </label>
          <div className="flex flex-wrap gap-2">
            {(['none', 'subtle', 'moderate', 'bold'] as const).map(style => (
              <button
                key={style}
                onClick={() => handleCustomizationChange('animationStyle', style)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  customization.animationStyle === style
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Scheme
          </label>
          <div className="flex flex-wrap gap-2">
            {(['blue', 'green', 'red', 'yellow', 'purple', 'custom'] as const).map(color => (
              <button
                key={color}
                onClick={() => handleCustomizationChange('colorScheme', color)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  customization.colorScheme === color
                    ? 'ring-2 ring-offset-2 ring-indigo-500'
                    : ''
                }`}
                style={{
                  backgroundColor:
                    color === 'blue' ? '#dbeafe' :
                    color === 'green' ? '#dcfce7' :
                    color === 'red' ? '#fee2e2' :
                    color === 'yellow' ? '#fef9c3' :
                    color === 'purple' ? '#f3e8ff' :
                    '#e0e7ff',
                  color:
                    color === 'blue' ? '#1e40af' :
                    color === 'green' ? '#166534' :
                    color === 'red' ? '#991b1b' :
                    color === 'yellow' ? '#854d0e' :
                    color === 'purple' ? '#7e22ce' :
                    '#4c1d95',
                }}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Indicator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Indicator
          </label>
          <div className="flex flex-wrap gap-2">
            {(['none', 'star', 'number', 'color'] as const).map(indicator => (
              <button
                key={indicator}
                onClick={() => handleCustomizationChange('priorityIndicator', indicator)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  customization.priorityIndicator === indicator
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {indicator}
              </button>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={customization.showProgress}
                onChange={(e) => handleCustomizationChange('showProgress', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Progress</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={customization.showIcons}
                onChange={(e) => handleCustomizationChange('showIcons', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Icons</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={customization.showLabels}
                onChange={(e) => handleCustomizationChange('showLabels', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Labels</span>
            </label>
          </div>
        </div>

        {/* Layout */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Layout
          </label>
          <div className="flex flex-wrap gap-2">
            {(['horizontal', 'vertical', 'grid'] as const).map(layout => (
              <button
                key={layout}
                onClick={() => handleCustomizationChange('layout', layout)}
                className={`px-3 py-1 rounded-md text-sm capitalize ${
                  customization.layout === layout
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <button
          onClick={resetCustomization}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
};

// Preview component to show customized skill indicator
interface SkillIndicatorPreviewProps {
  className?: string;
}

export const SkillIndicatorPreview: React.FC<SkillIndicatorPreviewProps> = ({
  className = ''
}) => {
  const { customization } = useSkillCustomization();
  const classes = getCustomizationClasses(customization, 'inline-flex items-center px-3 py-1.5 border font-medium');

  return (
    <div className={`skill-indicator-preview p-4 bg-gray-50 rounded-lg ${className}`}>
      <h4 className="font-medium text-gray-700 mb-3">Preview</h4>

      <div className="flex items-center space-x-3">
        <div className={classes}>
          {customization.showIcons && <span className="mr-2">🔧</span>}
          {customization.showLabels && <span>Skill Name</span>}
          {customization.priorityIndicator === 'star' && customization.priorityIndicator !== 'none' && (
            <span className="ml-1 text-yellow-500">★</span>
          )}
          {customization.showProgress && (
            <span className="ml-2 text-xs bg-white bg-opacity-50 px-1.5 py-0.5 rounded">
              75%
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600">
          Theme: {customization.theme}, Size: {customization.size}, Style: {customization.animationStyle}
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_CUSTOMIZATION };