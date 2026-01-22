import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { getWebSocketService } from '../../services/websocket-service';
import BadgeIndicator, { SkillBadgeGroup } from './BadgeIndicator';
import ProgressBarIndicator, { SkillProgressTracker } from './ProgressBarIndicator';
import MicroInteractionWrapper, { SkillCardMicroInteraction } from './MicroInteractions';

// Define types for skill activities
interface SkillActivity {
  id: string;
  name: string;
  status: 'idle' | 'activating' | 'active' | 'deactivating' | 'error' | 'success' | 'warning';
  startTime: Date;
  endTime?: Date;
  visualIndicator: 'badge' | 'progress' | 'icon' | 'bar' | 'pulse' | 'notification';
  priority: 1 | 2 | 3 | 4 | 5;
  progress?: number; // 0-100 for progress indicators
  conversationId?: string;
  metadata?: Record<string, any>;
}

// Props for the skill visualization manager
interface SkillVisualizationManagerProps {
  conversationId?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'grid' | 'compact';
  showProgress?: boolean;
  showBadges?: boolean;
  showTimeline?: boolean;
  autoCleanup?: boolean; // Whether to automatically remove completed skills
  cleanupDelay?: number; // Delay before removing completed skills
}

const SkillVisualizationManager: React.FC<SkillVisualizationManagerProps> = ({
  conversationId,
  className = '',
  layout = 'horizontal',
  showProgress = true,
  showBadges = true,
  showTimeline = false,
  autoCleanup = true,
  cleanupDelay = 5000
}) => {
  const { agentActivities, updateAgentActivity } = useAnimationState();
  const [skills, setSkills] = useState<SkillActivity[]>([]);
  const [activeSkills, setActiveSkills] = useState<string[]>([]);

  // Subscribe to WebSocket events for skill updates
  useEffect(() => {
    if (!conversationId) return;

    const wsService = getWebSocketService();

    const unsubscribe = wsService.subscribeToAgentUpdates((data) => {
      if (data.conversation_id === conversationId) {
        // Update local skill state based on WebSocket data
        setSkills(prevSkills => {
          const existingSkillIndex = prevSkills.findIndex(s => s.name === data.agent_activity.agentName);

          if (existingSkillIndex >= 0) {
            // Update existing skill
            const updatedSkills = [...prevSkills];
            updatedSkills[existingSkillIndex] = {
              ...updatedSkills[existingSkillIndex],
              status: data.agent_activity.status as any,
              priority: data.agent_activity.priority as any,
              progress: updatedSkills[existingSkillIndex].progress || 0, // Keep existing progress
            };

            // Update active skills list
            if (data.agent_activity.status === 'active' || data.agent_activity.status === 'activating') {
              if (!activeSkills.includes(data.agent_activity.agentName)) {
                setActiveSkills(prev => [...prev, data.agent_activity.agentName]);
              }
            } else {
              setActiveSkills(prev => prev.filter(name => name !== data.agent_activity.agentName));
            }

            return updatedSkills;
          } else {
            // Add new skill
            const newSkill: SkillActivity = {
              id: `${data.agent_activity.agentName}-${Date.now()}`,
              name: data.agent_activity.agentName,
              status: data.agent_activity.status as any,
              startTime: new Date(),
              visualIndicator: data.agent_activity.visualIndicator as any,
              priority: data.agent_activity.priority as any,
              conversationId,
            };

            // Update active skills list
            if (data.agent_activity.status === 'active' || data.agent_activity.status === 'activating') {
              setActiveSkills(prev => [...prev, data.agent_activity.agentName]);
            }

            return [...prevSkills, newSkill];
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, activeSkills]);

  // Update skills from global agent activities
  useEffect(() => {
    setSkills(prevSkills => {
      const updatedSkills = [...prevSkills];

      agentActivities.forEach(activity => {
        const existingIndex = updatedSkills.findIndex(s => s.name === activity.agentName);

        if (existingIndex >= 0) {
          updatedSkills[existingIndex] = {
            ...updatedSkills[existingIndex],
            status: activity.status as any,
            priority: activity.priority as any,
          };
        } else {
          // Add new activity if it doesn't exist in local state
          updatedSkills.push({
            id: `${activity.agentName}-${Date.now()}`,
            name: activity.agentName,
            status: activity.status as any,
            startTime: activity.startTime,
            endTime: activity.endTime,
            visualIndicator: 'badge', // default
            priority: activity.priority as any,
            progress: 0,
          });
        }
      });

      return updatedSkills;
    });
  }, [agentActivities]);

  // Auto cleanup completed skills
  useEffect(() => {
    if (!autoCleanup) return;

    const intervals = skills
      .filter(skill => skill.status === 'success' || skill.status === 'error')
      .map(skill => {
        return setTimeout(() => {
          setSkills(prev => prev.filter(s => s.id !== skill.id));
          setActiveSkills(prev => prev.filter(name => name !== skill.name));
        }, cleanupDelay);
      });

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [skills, autoCleanup, cleanupDelay]);

  // Layout classes
  const layoutClasses = {
    horizontal: 'flex flex-row flex-wrap gap-2 items-center',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2',
    compact: 'flex flex-row flex-wrap gap-1 items-center',
  };

  // Filter skills based on layout preferences
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      if (layout === 'compact' && skill.priority < 3) return false;
      return true;
    });
  }, [skills, layout]);

  // Render skill indicators based on type and layout
  const renderSkillIndicators = () => {
    if (filteredSkills.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          No active skills at the moment
        </div>
      );
    }

    return (
      <AnimatePresence>
        {filteredSkills.map((skill) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <SkillCardMicroInteraction
              skillName={skill.name}
              disabled={skill.status === 'idle'}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm border">
                {showBadges && (
                  <BadgeIndicator
                    skillName={skill.name}
                    status={skill.status}
                    priority={skill.priority}
                    size={layout === 'compact' ? 'small' : 'medium'}
                  />
                )}

                {showProgress && (skill.visualIndicator === 'progress' || skill.visualIndicator === 'bar') && (
                  <div className="mt-2">
                    <ProgressBarIndicator
                      skillName={skill.name}
                      progress={skill.progress || 0}
                      status={skill.status}
                      priority={skill.priority}
                      type="linear"
                      size={layout === 'compact' ? 'small' : 'medium'}
                    />
                  </div>
                )}

                <div className="mt-1 text-xs text-gray-500">
                  {skill.status.charAt(0).toUpperCase() + skill.status.slice(1)}
                  {skill.priority > 3 && <span className="ml-1 text-yellow-500">★</span>}
                </div>
              </div>
            </SkillCardMicroInteraction>
          </motion.div>
        ))}
      </AnimatePresence>
    );
  };

  // Render timeline view if enabled
  const renderTimeline = () => {
    if (!showTimeline || filteredSkills.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Skill Timeline</h4>
        <div className="space-y-2">
          {filteredSkills
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .map((skill) => (
              <div key={skill.id} className="flex items-center text-sm">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  skill.status === 'active' ? 'bg-green-500 animate-pulse' :
                  skill.status === 'error' ? 'bg-red-500' :
                  skill.status === 'success' ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <span className="font-medium">{skill.name}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600 capitalize">{skill.status}</span>
                <span className="ml-auto text-xs text-gray-500">
                  {skill.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    );
  };

  return (
    <div className={`skill-visualization-manager ${className}`}>
      <div className={`${layoutClasses[layout]}`}>
        {renderSkillIndicators()}
      </div>

      {renderTimeline()}

      {/* Active skills counter */}
      {activeSkills.length > 0 && (
        <div className="mt-2 text-sm text-blue-600 flex items-center">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></span>
            {activeSkills.length} active skill{activeSkills.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

// Hook to manage skill activities
export const useSkillActivityManager = () => {
  const { updateAgentActivity } = useAnimationState();

  const startSkill = (skillName: string, visualIndicator: string = 'badge') => {
    updateAgentActivity(skillName, {
      status: 'activating',
      startTime: new Date(),
      visualIndicator,
      priority: 3,
    });

    // Transition to active after a short delay
    setTimeout(() => {
      updateAgentActivity(skillName, { status: 'active' });
    }, 300);
  };

  const updateSkillProgress = (skillName: string, progress: number) => {
    updateAgentActivity(skillName, { progress });
  };

  const completeSkill = (skillName: string, success: boolean = true) => {
    updateAgentActivity(skillName, {
      status: success ? 'success' : 'error',
      endTime: new Date(),
    });

    // Transition back to idle after a delay
    setTimeout(() => {
      updateAgentActivity(skillName, { status: 'idle' });
    }, 3000);
  };

  const deactivateSkill = (skillName: string) => {
    updateAgentActivity(skillName, { status: 'deactivating' });

    setTimeout(() => {
      updateAgentActivity(skillName, { status: 'idle' });
    }, 500);
  };

  return {
    startSkill,
    updateSkillProgress,
    completeSkill,
    deactivateSkill,
  };
};

// Component to display skill statistics
interface SkillStatisticsProps {
  className?: string;
}

export const SkillStatistics: React.FC<SkillStatisticsProps> = ({ className = '' }) => {
  const { agentActivities } = useAnimationState();

  // Calculate statistics
  const stats = useMemo(() => {
    const total = agentActivities.length;
    const active = agentActivities.filter(a => a.status === 'active' || a.status === 'activating').length;
    const completed = agentActivities.filter(a => a.status === 'success').length;
    const errors = agentActivities.filter(a => a.status === 'error').length;

    return { total, active, completed, errors };
  }, [agentActivities]);

  return (
    <div className={`skill-statistics p-3 bg-white rounded-lg shadow-sm border ${className}`}>
      <h4 className="font-medium text-gray-700 mb-2">Skill Statistics</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Active:</span>
          <span className="font-medium text-blue-600">{stats.active}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Completed:</span>
          <span className="font-medium text-green-600">{stats.completed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Errors:</span>
          <span className="font-medium text-red-600">{stats.errors}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
      </div>
    </div>
  );
};

export default SkillVisualizationManager;