import React, { useState, useEffect } from 'react';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { announceToScreenReader, visuallyHiddenStyle } from '../../utils/accessibility-utils';

// Define accessibility features for skill indicators
interface SkillAccessibilityFeaturesProps {
  skillName: string;
  status: string;
  priority: number;
  progress?: number;
  className?: string;
}

const SkillAccessibilityFeatures: React.FC<SkillAccessibilityFeaturesProps> = ({
  skillName,
  status,
  priority,
  progress,
  className = ''
}) => {
  const { preferences } = useUserPreferences();
  const [lastStatus, setLastStatus] = useState(status);

  // Announce status changes to screen readers
  useEffect(() => {
    if (status !== lastStatus) {
      let announcement = `${skillName} skill `;

      switch (status) {
        case 'active':
        case 'activating':
          announcement += 'is now processing';
          break;
        case 'success':
          announcement += 'has completed successfully';
          break;
        case 'error':
          announcement += 'encountered an error';
          break;
        case 'idle':
          announcement += 'is idle';
          break;
        default:
          announcement += `status is ${status}`;
      }

      // Add priority information if high priority
      if (priority > 3) {
        announcement += ' (high priority)';
      }

      // Add progress if available
      if (progress !== undefined) {
        announcement += ` - ${progress}% complete`;
      }

      announceToScreenReader(announcement, 'polite');
      setLastStatus(status);
    }
  }, [status, lastStatus, skillName, priority, progress]);

  // Provide text alternatives for visual indicators
  return (
    <div className={className}>
      {/* Visually hidden element for screen readers */}
      <div style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
        Skill: {skillName}, Status: {status}, Priority: {priority}
        {progress !== undefined && `, Progress: ${progress}%`}
      </div>

      {/* Visual indicator for sighted users */}
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            status === 'active' || status === 'activating' ? 'bg-blue-500 animate-pulse' :
            status === 'success' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-gray-300'
          }`}
          aria-hidden="true"
        />

        <span className="text-sm font-medium">
          {skillName}
          {priority > 3 && <span className="ml-1 text-yellow-500">★</span>}
        </span>

        {progress !== undefined && (
          <span className="text-xs text-gray-500">({progress}%)</span>
        )}
      </div>
    </div>
  );
};

// Accessibility settings panel for skill indicators
interface SkillAccessibilitySettingsProps {
  className?: string;
}

export const SkillAccessibilitySettings: React.FC<SkillAccessibilitySettingsProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences } = useUserPreferences();

  const handleAnimationsChange = (enabled: boolean) => {
    updatePreferences({ animationsEnabled: enabled });
    announceToScreenReader(
      enabled ? 'Skill animations enabled' : 'Skill animations disabled',
      'polite'
    );
  };

  const handleAnimationSpeedChange = (speed: number) => {
    updatePreferences({ animationSpeed: speed });
    announceToScreenReader(`Skill animation speed set to ${speed}x`, 'polite');
  };

  return (
    <div className={`skill-accessibility-settings p-4 bg-gray-50 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Skill Indicator Accessibility</h3>

      <div className="space-y-4">
        {/* Animations toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="skill-animations-toggle" className="font-medium text-gray-700">
            Skill Animations
          </label>
          <div className="flex items-center">
            <button
              id="skill-animations-toggle"
              onClick={() => handleAnimationsChange(!preferences.animationsEnabled)}
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

        {/* Animation speed control */}
        <div>
          <label className="font-medium text-gray-700 block mb-2">
            Animation Speed: {preferences.animationSpeed}x
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAnimationSpeedChange(Math.max(0.5, preferences.animationSpeed - 0.25))}
              className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
              disabled={preferences.animationSpeed <= 0.5}
              aria-label="Decrease animation speed"
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
              className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
              disabled={preferences.animationSpeed >= 2}
              aria-label="Increase animation speed"
            >
              +
            </button>
          </div>
        </div>

        {/* Screen reader announcements */}
        <div>
          <label className="font-medium text-gray-700 block mb-2">
            Screen Reader Settings
          </label>
          <div className="text-sm text-gray-600">
            Skill status changes and progress updates will be announced automatically.
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to provide keyboard navigation for skill indicators
interface SkillIndicatorNavigatorProps {
  skills: Array<{
    name: string;
    status: string;
    priority: number;
    progress?: number;
  }>;
  onSkillSelect?: (skillName: string) => void;
  className?: string;
}

export const SkillIndicatorNavigator: React.FC<SkillIndicatorNavigatorProps> = ({
  skills,
  onSkillSelect,
  className = ''
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % skills.length);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + skills.length) % skills.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (onSkillSelect) {
          onSkillSelect(skills[index].name);
          announceToScreenReader(`${skills[index].name} skill selected`, 'assertive');
        }
        break;
    }
  };

  return (
    <div className={`skill-navigator ${className}`}>
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Skill indicators">
        {skills.map((skill, index) => (
          <button
            key={skill.name}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              index === focusedIndex
                ? 'bg-indigo-100 border-2 border-indigo-500'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onClick={() => {
              if (onSkillSelect) onSkillSelect(skill.name);
              announceToScreenReader(`${skill.name} skill selected`, 'assertive');
            }}
            onFocus={() => setFocusedIndex(index)}
            aria-label={`${skill.name} skill, status: ${skill.status}, priority: ${skill.priority}`}
            tabIndex={index === focusedIndex ? 0 : -1}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                skill.status === 'active' || skill.status === 'activating' ? 'bg-blue-500 animate-pulse' :
                skill.status === 'success' ? 'bg-green-500' :
                skill.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
              }`}
            />
            {skill.name}
            {skill.priority > 3 && <span className="ml-1 text-yellow-500">★</span>}
            {skill.progress !== undefined && (
              <span className="ml-2 text-xs">({skill.progress}%)</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Component to provide skip animations functionality for skill indicators
interface SkipSkillAnimationsProps {
  onSkip?: () => void;
  className?: string;
}

export const SkipSkillAnimations: React.FC<SkipSkillAnimationsProps> = ({
  onSkip,
  className = ''
}) => {
  const [showButton, setShowButton] = useState(false);

  // Show the skip button when there are active animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!showButton) return null;

  return (
    <button
      onClick={() => {
        setShowButton(false);
        if (onSkip) onSkip();
      }}
      className={`fixed top-24 right-4 z-50 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
      aria-label="Skip skill animations"
    >
      Skip Animations
    </button>
  );
};

// Enhanced skill indicator with accessibility features
interface AccessibleSkillIndicatorProps {
  children: React.ReactNode;
  skillName: string;
  status: string;
  priority: number;
  progress?: number;
  className?: string;
  onClick?: () => void;
}

export const AccessibleSkillIndicator: React.FC<AccessibleSkillIndicatorProps> = ({
  children,
  skillName,
  status,
  priority,
  progress,
  className = '',
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
      announceToScreenReader(`${skillName} skill activated`, 'polite');
    }
  };

  return (
    <div
      className={`accessible-skill-indicator ${className}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${skillName} skill, status: ${status}, priority: ${priority}${progress !== undefined ? `, progress: ${progress}%` : ''}`}
    >
      <SkillAccessibilityFeatures
        skillName={skillName}
        status={status}
        priority={priority}
        progress={progress}
      />
      {children}
    </div>
  );
};

export default SkillAccessibilityFeatures;