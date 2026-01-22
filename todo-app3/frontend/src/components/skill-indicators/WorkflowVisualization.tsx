import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { getWebSocketService } from '../../services/websocket-service';
import { SkillBadgeGroup } from './BadgeIndicator';
import { SkillProgressTracker } from './ProgressBarIndicator';
import MicroInteractionWrapper from './MicroInteractions';

// Define workflow step types
interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  agentName: string;
  dependencies?: string[]; // IDs of steps that must complete before this one starts
  priority: 1 | 2 | 3 | 4 | 5;
  metadata?: Record<string, any>;
}

// Define workflow types
interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'idle' | 'starting' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  conversationId?: string;
}

// Props for workflow visualization
interface WorkflowVisualizationProps {
  conversationId?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical' | 'radial' | 'timeline';
  showProgress?: boolean;
  showDetails?: boolean;
  autoExpand?: boolean;
  onWorkflowStart?: (workflow: Workflow) => void;
  onWorkflowComplete?: (workflow: Workflow) => void;
  onWorkflowError?: (workflow: Workflow, error: any) => void;
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  conversationId,
  className = '',
  layout = 'horizontal',
  showProgress = true,
  showDetails = true,
  autoExpand = true,
  onWorkflowStart,
  onWorkflowComplete,
  onWorkflowError
}) => {
  const { performanceMetrics, userPreferences } = useAnimationState();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to WebSocket events for workflow updates
  useEffect(() => {
    if (!conversationId) return;

    const wsService = getWebSocketService();

    const unsubscribe = wsService.subscribeToAgentUpdates((data) => {
      if (data.conversation_id === conversationId) {
        setWorkflows(prevWorkflows => {
          // Find or create a workflow for this agent
          const workflowId = `wf-${data.agent_activity.agentName}`;

          const existingWorkflowIndex = prevWorkflows.findIndex(w => w.id === workflowId);
          const existingWorkflow = existingWorkflowIndex >= 0 ? prevWorkflows[existingWorkflowIndex] : null;

          let updatedWorkflows = [...prevWorkflows];

          if (existingWorkflow) {
            // Update existing workflow
            const updatedSteps = [...existingWorkflow.steps];

            // Find or create step for this agent activity
            const stepIndex = updatedSteps.findIndex(s => s.agentName === data.agent_activity.agentName);

            if (stepIndex >= 0) {
              // Update existing step
              updatedSteps[stepIndex] = {
                ...updatedSteps[stepIndex],
                status: mapAgentStatusToStepStatus(data.agent_activity.status),
                ...(data.agent_activity.status === 'active' && { startTime: new Date() }),
                ...(data.agent_activity.status === 'success' && {
                  status: 'completed',
                  endTime: new Date()
                }),
                ...(data.agent_activity.status === 'error' && {
                  status: 'failed',
                  endTime: new Date()
                })
              };
            } else {
              // Create new step
              const newStep: WorkflowStep = {
                id: `${workflowId}-step-${updatedSteps.length + 1}`,
                name: data.agent_activity.agentName,
                status: mapAgentStatusToStepStatus(data.agent_activity.status),
                agentName: data.agent_activity.agentName,
                priority: data.agent_activity.priority as any,
                ...(data.agent_activity.status === 'active' && { startTime: new Date() }),
                ...(data.agent_activity.status === 'success' && {
                  status: 'completed',
                  endTime: new Date()
                }),
                ...(data.agent_activity.status === 'error' && {
                  status: 'failed',
                  endTime: new Date()
                })
              };

              updatedSteps.push(newStep);
            }

            const updatedWorkflow: Workflow = {
              ...existingWorkflow,
              steps: updatedSteps,
              status: determineWorkflowStatus(updatedSteps)
            };

            updatedWorkflows[existingWorkflowIndex] = updatedWorkflow;
          } else {
            // Create new workflow
            const newWorkflow: Workflow = {
              id: workflowId,
              name: data.agent_activity.agentName,
              steps: [{
                id: `${workflowId}-step-1`,
                name: data.agent_activity.agentName,
                status: mapAgentStatusToStepStatus(data.agent_activity.status),
                agentName: data.agent_activity.agentName,
                priority: data.agent_activity.priority as any,
                ...(data.agent_activity.status === 'active' && { startTime: new Date() }),
                ...(data.agent_activity.status === 'success' && {
                  status: 'completed',
                  endTime: new Date()
                }),
                ...(data.agent_activity.status === 'error' && {
                  status: 'failed',
                  endTime: new Date()
                })
              }],
              status: mapAgentStatusToWorkflowStatus(data.agent_activity.status),
              conversationId
            };

            updatedWorkflows.push(newWorkflow);

            if (onWorkflowStart) onWorkflowStart(newWorkflow);
          }

          return updatedWorkflows;
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, onWorkflowStart, onWorkflowComplete, onWorkflowError]);

  // Helper function to map agent status to step status
  const mapAgentStatusToStepStatus = (status: string): WorkflowStep['status'] => {
    switch (status) {
      case 'active':
      case 'activating':
        return 'processing';
      case 'success':
        return 'completed';
      case 'error':
        return 'failed';
      default:
        return 'pending';
    }
  };

  // Helper function to map agent status to workflow status
  const mapAgentStatusToWorkflowStatus = (status: string): Workflow['status'] => {
    switch (status) {
      case 'active':
      case 'activating':
        return 'running';
      case 'success':
        return 'completed';
      case 'error':
        return 'failed';
      default:
        return 'idle';
    }
  };

  // Determine overall workflow status based on steps
  const determineWorkflowStatus = (steps: WorkflowStep[]): Workflow['status'] => {
    if (steps.length === 0) return 'idle';

    if (steps.some(step => step.status === 'processing')) return 'running';
    if (steps.some(step => step.status === 'failed')) return 'failed';
    if (steps.every(step => step.status === 'completed')) return 'completed';

    return 'running';
  };

  // Calculate workflow progress
  const calculateWorkflowProgress = (workflow: Workflow): number => {
    if (workflow.steps.length === 0) return 0;

    const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / workflow.steps.length) * 100);
  };

  // Toggle step expansion
  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  // Toggle workflow selection
  const toggleWorkflowSelection = (workflowId: string) => {
    setSelectedWorkflow(selectedWorkflow === workflowId ? null : workflowId);
  };

  // Layout-specific rendering
  const renderWorkflowLayout = (workflow: Workflow) => {
    const progress = calculateWorkflowProgress(workflow);

    switch (layout) {
      case 'horizontal':
        return (
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              {renderWorkflowSteps(workflow)}
            </div>
            {showProgress && (
              <div className="w-32">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Progress: {progress}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'vertical':
        return (
          <div className="space-y-4">
            {showProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            {renderWorkflowSteps(workflow)}
          </div>
        );

      case 'radial':
        return (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">{progress}%</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
            </div>
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                stroke="#3b82f6"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
                initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress / 100) }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </svg>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-4">
            {showProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>{workflow.name} Workflow</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="relative pl-8 border-l-2 border-gray-200 space-y-6">
              {workflow.steps.map((step, index) => (
                <div key={step.id} className="relative">
                  <div className="absolute -left-11 top-1 w-6 h-6 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                      step.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  {renderStepDetail(step)}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return renderWorkflowSteps(workflow);
    }
  };

  // Render workflow steps
  const renderWorkflowSteps = (workflow: Workflow) => {
    return (
      <div className={`flex ${layout === 'vertical' ? 'flex-col space-y-4' : 'space-x-4'}`}>
        {workflow.steps.map((step, index) => (
          <MicroInteractionWrapper
            key={step.id}
            type="hover"
            onClick={() => toggleStepExpansion(step.id)}
            className={`flex-1 p-4 rounded-lg border ${
              step.status === 'completed' ? 'border-green-500 bg-green-50' :
              step.status === 'processing' ? 'border-blue-500 bg-blue-50 animate-pulse' :
              step.status === 'failed' ? 'border-red-500 bg-red-50' :
              'border-gray-200 bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-800">{step.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{step.status}</p>
                {step.priority > 3 && (
                  <span className="inline-block ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    High Priority
                  </span>
                )}
              </div>
              <div className={`w-3 h-3 rounded-full ${
                step.status === 'completed' ? 'bg-green-500' :
                step.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                step.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
              }`} />
            </div>

            {expandedSteps[step.id] && showDetails && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                {step.startTime && (
                  <div>Started: {step.startTime.toLocaleTimeString()}</div>
                )}
                {step.endTime && (
                  <div>Ended: {step.endTime.toLocaleTimeString()}</div>
                )}
                <div>Agent: {step.agentName}</div>
              </div>
            )}
          </MicroInteractionWrapper>
        ))}
      </div>
    );
  };

  // Render step detail
  const renderStepDetail = (step: WorkflowStep) => {
    return (
      <div className={`p-3 rounded-lg ${
        step.status === 'completed' ? 'bg-green-50 border border-green-200' :
        step.status === 'processing' ? 'bg-blue-50 border border-blue-200 animate-pulse' :
        step.status === 'failed' ? 'bg-red-50 border border-red-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between">
          <h4 className="font-medium text-gray-800">{step.name}</h4>
          <span className={`text-xs px-2 py-1 rounded-full ${
            step.status === 'completed' ? 'bg-green-100 text-green-800' :
            step.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            step.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {step.status}
          </span>
        </div>
        {step.startTime && (
          <div className="text-xs text-gray-600 mt-1">
            Started: {step.startTime.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  };

  // Performance-aware rendering
  if (performanceMetrics.shouldOptimize || !userPreferences.animationsEnabled) {
    return (
      <div className={`workflow-visualization ${className}`}>
        {workflows.map(workflow => (
          <div key={workflow.id} className="mb-6 p-4 bg-white rounded-lg border">
            <h3 className="font-medium text-gray-800 mb-2">{workflow.name}</h3>
            <div className="text-sm text-gray-600 mb-2">Status: {workflow.status}</div>
            <div className="space-y-2">
              {workflow.steps.map(step => (
                <div key={step.id} className="flex items-center text-sm">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    step.status === 'completed' ? 'bg-green-500' :
                    step.status === 'processing' ? 'bg-blue-500' :
                    step.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <span>{step.name} - {step.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`workflow-visualization ${className}`} ref={containerRef}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Multi-Agent Workflow Visualization</h3>

      <AnimatePresence>
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No workflows are currently active
          </div>
        ) : (
          workflows.map(workflow => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 bg-white rounded-lg border ${
                selectedWorkflow === workflow.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => toggleWorkflowSelection(workflow.id)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-800">{workflow.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                  workflow.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  workflow.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {workflow.status}
                </span>
              </div>

              {renderWorkflowLayout(workflow)}

              {selectedWorkflow === workflow.id && showDetails && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <SkillProgressTracker
                    skills={workflow.steps.map(step => ({
                      name: step.name,
                      progress: step.status === 'completed' ? 100 : step.status === 'processing' ? 50 : 0,
                      status: step.status as any,
                      priority: step.priority
                    }))}
                  />
                </div>
              )}
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

// Component to visualize skill dependencies
interface SkillDependencyVisualizationProps {
  skills: Array<{
    name: string;
    dependencies: string[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }>;
  className?: string;
}

export const SkillDependencyVisualization: React.FC<SkillDependencyVisualizationProps> = ({
  skills,
  className = ''
}) => {
  return (
    <div className={`skill-dependency-visualization p-4 bg-white rounded-lg border ${className}`}>
      <h3 className="font-medium text-gray-800 mb-4">Skill Dependencies</h3>

      <div className="space-y-4">
        {skills.map((skill, index) => (
          <div key={index} className="flex items-center">
            <div className="flex-1">
              <div className={`p-3 rounded-lg ${
                skill.status === 'completed' ? 'bg-green-100' :
                skill.status === 'processing' ? 'bg-blue-100' :
                skill.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {skill.name}
              </div>
            </div>

            {skill.dependencies.length > 0 && (
              <div className="mx-4 text-gray-400">depends on</div>
            )}

            <div className="flex space-x-2">
              {skill.dependencies.map((dep, depIndex) => (
                <div key={depIndex} className="p-2 bg-gray-100 rounded text-sm">
                  {dep}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowVisualization;