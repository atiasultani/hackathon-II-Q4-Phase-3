import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useAnimationState } from '../../hooks/use-animation-state';
import AIAvatar from '../ai-avatar/AIAvatar';
import { TypingAnimation } from '../ai-avatar/TypingAnimations';
import { ResponseAnimation } from '../ai-avatar/ResponseAnimations';

// Onboarding step interface
interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  animationType: 'avatar' | 'typing' | 'response' | 'interactive';
  animationAction?: () => void;
  nextButtonText?: string;
}

// Animation onboarding component
const AnimationOnboarding: React.FC = () => {
  const { preferences } = useUserPreferences();
  const { animationState, updateAnimationState } = useAnimationState();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Check if onboarding has been completed before
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('animation-onboarding-completed');
    if (hasCompletedOnboarding === 'true') {
      setShowOnboarding(false);
      setIsCompleted(true);
    }
  }, []);

  // Onboarding steps
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Welcome to Animated AI Assistant!',
      description: 'Meet your AI assistant with expressive animations that bring conversations to life.',
      animationType: 'avatar',
      nextButtonText: 'Meet the AI'
    },
    {
      id: 1,
      title: 'Expressive Avatars',
      description: 'Watch as the AI expresses emotions through its animated avatar. See how it reacts to your messages!',
      animationType: 'avatar',
      animationAction: () => {
        updateAnimationState({
          avatarExpression: 'greeting',
          triggerEvent: 'onboarding_greeting',
          intensity: 6
        });
      },
      nextButtonText: 'See Expressions'
    },
    {
      id: 2,
      title: 'Real-time Processing',
      description: 'Notice the typing indicators and processing animations while the AI thinks and responds to you.',
      animationType: 'typing',
      animationAction: () => {
        updateAnimationState({
          avatarExpression: 'processing',
          triggerEvent: 'onboarding_processing',
          intensity: 8
        });
      },
      nextButtonText: 'Try It'
    },
    {
      id: 3,
      title: 'Interactive Responses',
      description: 'Responses come with smooth animations that make the conversation feel natural and engaging.',
      animationType: 'response',
      animationAction: () => {
        updateAnimationState({
          avatarExpression: 'happy',
          triggerEvent: 'onboarding_response',
          intensity: 5
        });
      },
      nextButtonText: 'Continue'
    },
    {
      id: 4,
      title: 'Customize Your Experience',
      description: 'You can adjust animation settings to match your preferences and device capabilities.',
      animationType: 'interactive',
      nextButtonText: 'Finish Tutorial'
    }
  ];

  // Handle next step
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);

      // Trigger animation for next step if available
      const nextStep = onboardingSteps[currentStep + 1];
      if (nextStep.animationAction) {
        nextStep.animationAction();
      }
    } else {
      completeOnboarding();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete onboarding
  const completeOnboarding = () => {
    setIsCompleted(true);
    setShowOnboarding(false);
    localStorage.setItem('animation-onboarding-completed', 'true');

    // Reset avatar to neutral after onboarding
    updateAnimationState({
      avatarExpression: 'neutral',
      triggerEvent: 'onboarding_complete',
      intensity: 3
    });
  };

  // Skip onboarding
  const skipOnboarding = () => {
    completeOnboarding();
  };

  // Restart onboarding
  const restartOnboarding = () => {
    setCurrentStep(0);
    setIsCompleted(false);
    setShowOnboarding(true);
    updateAnimationState({
      avatarExpression: 'greeting',
      triggerEvent: 'onboarding_restart',
      intensity: 6
    });
  };

  // Render current step content
  const renderStepContent = () => {
    const step = onboardingSteps[currentStep];

    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{step.title}</h2>
        <p className="text-gray-600 mb-8 max-w-md">{step.description}</p>

        <div className="mb-8">
          {step.animationType === 'avatar' && (
            <div className="flex flex-col items-center">
              <AIAvatar size="large" />
              <p className="mt-2 text-sm text-gray-500">Expressive AI Avatar</p>
            </div>
          )}

          {step.animationType === 'typing' && (
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <AIAvatar size="small" />
                <div className="ml-2 bg-white p-2 rounded-lg shadow-sm">
                  <p className="text-sm">Thinking about your message...</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <TypingAnimation variant="dots" color="indigo" />
                </div>
              </div>
            </div>
          )}

          {step.animationType === 'response' && (
            <div className="flex flex-col items-center">
              <ResponseAnimation
                isVisible={true}
                variant="slideIn"
                className="bg-white p-4 rounded-lg shadow-md max-w-xs"
              >
                <p className="text-gray-700">Thank you for trying our animated interface! This response has a smooth animation.</p>
              </ResponseAnimation>
            </div>
          )}

          {step.animationType === 'interactive' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-3 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors">
                  <div className="font-medium">Animation Speed</div>
                  <div className="text-xs text-gray-600">0.5x - 2x</div>
                </button>
                <button className="p-3 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors">
                  <div className="font-medium">Motion Sensitivity</div>
                  <div className="text-xs text-gray-600">Low/Med/High</div>
                </button>
              </div>
              <div className="text-sm text-gray-600">Adjust in Settings</div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {step.nextButtonText || 'Next'}
          </button>
        </div>
      </motion.div>
    );
  };

  // If onboarding is completed or disabled, don't render anything
  if (!showOnboarding || isCompleted) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">Animation Tutorial</h1>
              <button
                onClick={skipOnboarding}
                className="text-gray-500 hover:text-gray-700"
              >
                Skip
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
                <span>{Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 text-center">
            <button
              onClick={restartOnboarding}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Restart Tutorial
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Onboarding trigger component
interface AnimationOnboardingTriggerProps {
  children: React.ReactNode;
}

export const AnimationOnboardingTrigger: React.FC<AnimationOnboardingTriggerProps> = ({ children }) => {
  const [showTrigger, setShowTrigger] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('animation-onboarding-completed');
    // Show trigger if onboarding hasn't been completed yet
    if (hasCompletedOnboarding !== 'true') {
      // Add a small delay to not interrupt initial load
      const timer = setTimeout(() => {
        setShowTrigger(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (showTrigger) {
    return (
      <div className="relative">
        {children}
        <motion.div
          className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center cursor-pointer z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => {
            // This would normally trigger the onboarding modal
            // For now, we'll just remove the trigger
            setShowTrigger(false);
          }}
        >
          !
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

// Export the main component
export default AnimationOnboarding;