import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';

// Define expression types
export type AvatarExpressionType =
  | 'neutral'
  | 'happy'
  | 'thinking'
  | 'listening'
  | 'processing'
  | 'surprised'
  | 'excited'
  | 'confused'
  | 'waiting'
  | 'greeting';

// Expression configuration interface
interface ExpressionConfig {
  name: string;
  faceColor: string;
  eyes: 'normal' | 'smile' | 'thinking' | 'listening' | 'busy' | 'surprised' | 'excited' | 'confused' | 'closed';
  mouth: 'straight' | 'smile' | 'line' | 'open' | 'pulse' | 'o' | 'worry' | 'tongue';
  description: string;
  animation?: string;
  intensity: number;
}

// Expression configurations
export const EXPRESSION_CONFIGS: Record<AvatarExpressionType, ExpressionConfig> = {
  neutral: {
    name: 'Neutral',
    faceColor: '#4F46E5',
    eyes: 'normal',
    mouth: 'straight',
    description: 'Neutral expression',
    intensity: 1,
  },
  happy: {
    name: 'Happy',
    faceColor: '#10B981',
    eyes: 'smile',
    mouth: 'smile',
    description: 'Happy expression',
    intensity: 3,
  },
  thinking: {
    name: 'Thinking',
    faceColor: '#F59E0B',
    eyes: 'thinking',
    mouth: 'line',
    description: 'Thinking expression',
    intensity: 4,
  },
  listening: {
    name: 'Listening',
    faceColor: '#8B5CF6',
    eyes: 'listening',
    mouth: 'open',
    description: 'Listening expression',
    intensity: 5,
  },
  processing: {
    name: 'Processing',
    faceColor: '#EF4444',
    eyes: 'busy',
    mouth: 'pulse',
    description: 'Processing expression',
    intensity: 7,
  },
  surprised: {
    name: 'Surprised',
    faceColor: '#F97316',
    eyes: 'surprised',
    mouth: 'o',
    description: 'Surprised expression',
    intensity: 6,
  },
  excited: {
    name: 'Excited',
    faceColor: '#EC4899',
    eyes: 'excited',
    mouth: 'smile',
    description: 'Excited expression',
    intensity: 8,
  },
  confused: {
    name: 'Confused',
    faceColor: '#6B7280',
    eyes: 'confused',
    mouth: 'worry',
    description: 'Confused expression',
    intensity: 4,
  },
  waiting: {
    name: 'Waiting',
    faceColor: '#3B82F6',
    eyes: 'closed',
    mouth: 'line',
    description: 'Waiting expression',
    intensity: 2,
  },
  greeting: {
    name: 'Greeting',
    faceColor: '#14B8A6',
    eyes: 'smile',
    mouth: 'smile',
    description: 'Greeting expression',
    intensity: 5,
  },
};

// Eye component based on expression
const EyeComponent: React.FC<{ type: ExpressionConfig['eyes']; intensity: number }> = ({ type, intensity }) => {
  const eyeSize = Math.max(2, Math.min(4, 2 + intensity * 0.2)); // Scale eye size with intensity

  const eyeClasses = `w-${eyeSize} h-${eyeSize} bg-white rounded-full`;

  switch (type) {
    case 'normal':
      return (
        <>
          <div className={eyeClasses}></div>
          <div className={eyeClasses}></div>
        </>
      );
    case 'smile':
      return (
        <>
          <div className={`${eyeClasses} transform rotate-12`}></div>
          <div className={`${eyeClasses} transform -rotate-12`}></div>
        </>
      );
    case 'thinking':
      return (
        <>
          <div className={`${eyeClasses} transform -skew-x-12`}></div>
          <div className={`${eyeClasses} transform skew-x-12`}></div>
        </>
      );
    case 'listening':
      return (
        <>
          <motion.div
            className={eyeClasses}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          ></motion.div>
          <motion.div
            className={eyeClasses}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
          ></motion.div>
        </>
      );
    case 'busy':
      return (
        <>
          <motion.div
            className={eyeClasses}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          ></motion.div>
          <motion.div
            className={eyeClasses}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          ></motion.div>
        </>
      );
    case 'surprised':
      return (
        <>
          <motion.div
            className={eyeClasses}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.3, repeat: 2 }}
          ></motion.div>
          <motion.div
            className={eyeClasses}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.3, repeat: 2, delay: 0.1 }}
          ></motion.div>
        </>
      );
    case 'excited':
      return (
        <>
          <motion.div
            className={eyeClasses}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          ></motion.div>
          <motion.div
            className={eyeClasses}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }}
          ></motion.div>
        </>
      );
    case 'confused':
      return (
        <>
          <div className={`${eyeClasses} transform skew-x-6`}></div>
          <div className={`${eyeClasses} transform -skew-x-6`}></div>
        </>
      );
    case 'closed':
      return (
        <>
          <div className={`${eyeClasses.replace('rounded-full', 'rounded-t-full')} bg-gray-300`}></div>
          <div className={`${eyeClasses.replace('rounded-full', 'rounded-t-full')} bg-gray-300`}></div>
        </>
      );
    default:
      return (
        <>
          <div className={eyeClasses}></div>
          <div className={eyeClasses}></div>
        </>
      );
  }
};

// Mouth component based on expression
const MouthComponent: React.FC<{ type: ExpressionConfig['mouth']; intensity: number }> = ({ type, intensity }) => {
  const mouthIntensity = Math.max(1, Math.min(4, intensity * 0.5)); // Adjust mouth animation based on intensity

  switch (type) {
    case 'straight':
      return <div className={`w-${Math.floor(mouthIntensity * 2)} h-0.5 bg-white`}></div>;

    case 'smile':
      return <div className={`w-${Math.floor(mouthIntensity * 2)} h-${mouthIntensity} border-b-2 border-l-2 border-r-2 border-white rounded-b-full`}></div>;

    case 'line':
      return <div className={`w-${Math.floor(mouthIntensity * 1.5)} h-0.5 bg-white opacity-70`}></div>;

    case 'open':
      return (
        <motion.div
          className={`w-${mouthIntensity} h-${mouthIntensity} bg-white rounded-full`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        ></motion.div>
      );

    case 'pulse':
      return (
        <motion.div
          className={`w-${mouthIntensity} h-${Math.max(1, mouthIntensity - 1)} bg-white rounded-full`}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        ></motion.div>
      );

    case 'o':
      return (
        <motion.div
          className={`w-${mouthIntensity} h-${mouthIntensity} bg-white rounded-full`}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
        ></motion.div>
      );

    case 'worry':
      return <div className={`w-${Math.floor(mouthIntensity * 1.5)} h-0.5 bg-white transform -skew-y-6`}></div>;

    case 'tongue':
      return (
        <div className="relative">
          <div className={`w-${mouthIntensity} h-0.5 bg-white`}></div>
          <motion.div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-400 rounded-full"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          ></motion.div>
        </div>
      );

    default:
      return <div className={`w-${Math.floor(mouthIntensity * 2)} h-0.5 bg-white`}></div>;
  }
};

// Props for AvatarExpressions component
interface AvatarExpressionsProps {
  currentExpression: AvatarExpressionType;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// Main Avatar Expressions Component
const AvatarExpressions: React.FC<AvatarExpressionsProps> = ({
  currentExpression,
  size = 'medium',
  className = ''
}) => {
  const { updateAnimationState } = useAnimationState();

  // Size configurations
  const sizeClasses = {
    small: 'w-12 h-12 text-sm',
    medium: 'w-16 h-16 text-base',
    large: 'w-24 h-24 text-lg',
  };

  // Get current expression config
  const config = EXPRESSION_CONFIGS[currentExpression];

  // Handle expression change
  const handleChangeExpression = (expression: AvatarExpressionType) => {
    updateAnimationState({
      avatarExpression: expression,
      triggerEvent: `expression_change_${expression}`,
      intensity: EXPRESSION_CONFIGS[expression].intensity,
    });
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div
        className={`relative rounded-full flex items-center justify-center bg-gradient-to-br ${config.faceColor} ${sizeClasses[size]}`}
        aria-label={config.description}
      >
        {/* Eyes */}
        <div className="absolute top-1/4 flex space-x-2">
          <EyeComponent type={config.eyes} intensity={config.intensity} />
        </div>

        {/* Mouth */}
        <div className="absolute bottom-1/4">
          <MouthComponent type={config.mouth} intensity={config.intensity} />
        </div>
      </div>

      {/* Optional: Expression selector for demo purposes */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center space-x-1 mt-2">
        {Object.entries(EXPRESSION_CONFIGS).map(([expr, cfg]) => (
          <button
            key={expr}
            onClick={() => handleChangeExpression(expr as AvatarExpressionType)}
            className={`w-4 h-4 rounded-full ${cfg.faceColor} ${
              currentExpression === expr ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
            }`}
            aria-label={`Switch to ${cfg.name} expression`}
            title={cfg.name}
          />
        ))}
      </div>
    </div>
  );
};

export { AvatarExpressions, EXPRESSION_CONFIGS };
export type { AvatarExpressionType, ExpressionConfig };