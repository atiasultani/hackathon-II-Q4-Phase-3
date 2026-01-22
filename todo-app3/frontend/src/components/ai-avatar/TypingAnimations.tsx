import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';

interface TypingAnimationProps {
  isTyping?: boolean;
  className?: string;
  variant?: 'dots' | 'bars' | 'pulse' | 'wave';
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  isTyping = true,
  className = '',
  variant = 'dots',
  color = 'white',
  size = 'medium'
}) => {
  const { shouldAnimate } = useAnimationState();
  const [isVisible, setIsVisible] = useState(isTyping);

  // Size configurations
  const sizeConfig = {
    small: { dotSize: 'w-1 h-1', spacing: 'space-x-0.5', barHeight: 'h-2', barWidth: 'w-1' },
    medium: { dotSize: 'w-2 h-2', spacing: 'space-x-1', barHeight: 'h-3', barWidth: 'w-1.5' },
    large: { dotSize: 'w-3 h-3', spacing: 'space-x-1.5', barHeight: 'h-4', barWidth: 'w-2' },
  };

  const currentSize = sizeConfig[size];

  // Color classes
  const colorClass = `bg-${color}`;

  // Update visibility when isTyping prop changes
  useEffect(() => {
    setIsVisible(isTyping);
  }, [isTyping]);

  // Render different variants
  const renderVariant = () => {
    if (!isTyping || !shouldAnimate()) {
      return null;
    }

    switch (variant) {
      case 'dots':
        return (
          <div className={`flex ${currentSize.spacing} items-center justify-center`}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`${currentSize.dotSize} ${colorClass} rounded-full`}
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        );

      case 'bars':
        return (
          <div className={`flex ${currentSize.spacing} items-end justify-center`}>
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className={`${currentSize.barWidth} ${currentSize.barHeight} ${colorClass}`}
                animate={{
                  scaleY: [1, 0.3, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="flex items-center justify-center">
            <motion.div
              className={`${currentSize.dotSize} ${colorClass} rounded-full`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        );

      case 'wave':
        return (
          <div className={`flex ${currentSize.spacing} items-center justify-center`}>
            {[0, 1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                className={`${currentSize.dotSize} ${colorClass} rounded-full`}
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className={`flex ${currentSize.spacing} items-center justify-center`}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`${currentSize.dotSize} ${colorClass} rounded-full`}
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {renderVariant()}
    </div>
  );
};

interface TypingTextEffectProps {
  text: string;
  speed?: number; // Characters per second
  className?: string;
  cursor?: boolean;
  onComplete?: () => void;
}

const TypingTextEffect: React.FC<TypingTextEffectProps> = ({
  text,
  speed = 20, // Default 20 characters per second
  className = '',
  cursor = true,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 1000 / speed);

      return () => clearTimeout(timeout);
    } else if (!isCompleted) {
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, isCompleted, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsCompleted(false);
  }, [text]);

  return (
    <div className={`inline-block ${className}`}>
      <span>{displayedText}</span>
      {cursor && !isCompleted && (
        <motion.span
          className="ml-1 inline-block w-0.5 h-5 bg-current"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </div>
  );
};

interface AdvancedTypingIndicatorProps {
  messages?: string[];
  currentIndex?: number;
  isTyping?: boolean;
  variant?: 'dots' | 'bars' | 'pulse' | 'wave';
  className?: string;
}

const AdvancedTypingIndicator: React.FC<AdvancedTypingIndicatorProps> = ({
  messages = [],
  currentIndex = 0,
  isTyping = true,
  variant = 'dots',
  className = ''
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(currentIndex);
  const [showIndicator, setShowIndicator] = useState(isTyping);

  useEffect(() => {
    setShowIndicator(isTyping);
  }, [isTyping]);

  useEffect(() => {
    setCurrentMessageIndex(currentIndex);
  }, [currentIndex]);

  return (
    <div className={`flex items-center ${className}`}>
      {messages[currentMessageIndex] && (
        <div className="mr-2 text-sm text-gray-600 truncate max-w-xs">
          {messages[currentMessageIndex]}
        </div>
      )}

      {showIndicator && (
        <TypingAnimation variant={variant} size="small" />
      )}
    </div>
  );
};

export { TypingAnimation, TypingTextEffect, AdvancedTypingIndicator };
export default TypingAnimation;