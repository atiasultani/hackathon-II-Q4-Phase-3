import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationState } from '../../hooks/use-animation-state';
import { EASING_PRESETS, ANIMATION_DURATIONS } from '../../utils/animation-utils';

export interface BaseAnimationProps {
  children: React.ReactNode;
  variant?: 'fade' | 'slide' | 'scale' | 'bounce' | 'custom';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: keyof typeof ANIMATION_DURATIONS | number;
  easing?: keyof typeof EASING_PRESETS | [number, number, number, number];
  triggerEvent?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  customVariant?: any;
}

const BaseAnimation = forwardRef<HTMLDivElement, BaseAnimationProps>(
  (
    {
      children,
      variant = 'fade',
      direction = 'up',
      duration = 'normal',
      easing = 'easeInOut',
      triggerEvent,
      disabled = false,
      className = '',
      style,
      customVariant,
    },
    ref
  ) => {
    const { shouldAnimate } = useAnimationState();

    // If animations are disabled or performance optimization is needed, render without animation
    if (!shouldAnimate() || disabled) {
      return (
        <div ref={ref} className={className} style={style}>
          {children}
        </div>
      );
    }

    // Determine actual duration value
    const durationValue =
      typeof duration === 'number' ? duration : ANIMATION_DURATIONS[duration];

    // Determine easing value
    const easingValue =
      Array.isArray(easing) || typeof easing === 'string'
        ? easing
        : EASING_PRESETS[easing];

    // Define variants based on type
    const getVariantConfig = () => {
      if (customVariant) return customVariant;

      switch (variant) {
        case 'fade':
          return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
          };

        case 'slide':
          const slideDistance = 20;
          const translateMap: Record<string, { x: number; y: number }> = {
            left: { x: -slideDistance, y: 0 },
            right: { x: slideDistance, y: 0 },
            up: { x: 0, y: -slideDistance },
            down: { x: 0, y: slideDistance },
          };

          return {
            initial: { ...translateMap[direction], opacity: 0 },
            animate: { x: 0, y: 0, opacity: 1 },
            exit: { ...translateMap[direction], opacity: 0 },
          };

        case 'scale':
          return {
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.8, opacity: 0 },
          };

        case 'bounce':
          return {
            initial: { scale: 0, y: 20, opacity: 0 },
            animate: {
              scale: [0, 1.1, 1],
              y: [20, -10, 0],
              opacity: 1,
              transition: {
                duration: durationValue,
                ease: easingValue,
                times: [0, 0.5, 1]
              }
            },
            exit: { scale: 0, y: 20, opacity: 0 },
          };

        default:
          return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
          };
      }
    };

    const variantConfig = getVariantConfig();

    return (
      <AnimatePresence mode="wait">
        <motion.div
          ref={ref}
          initial={variantConfig.initial}
          animate={variantConfig.animate}
          exit={variantConfig.exit}
          transition={{
            duration: durationValue,
            ease: easingValue,
          }}
          className={className}
          style={style}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }
);

BaseAnimation.displayName = 'BaseAnimation';

export default BaseAnimation;