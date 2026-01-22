# Animation Bundle Optimization Guide

## Bundle Size Analysis

### Current Dependencies
- **framer-motion**: Main animation library (~200KB gzipped)
- **three.js**: 3D graphics library (~250KB gzipped)
- **react**: Core library (~120KB gzipped)
- **react-dom**: React DOM bindings (~125KB gzipped)
- **Custom components**: Animation system (~50KB)

### Total Estimated Bundle Size: ~745KB

## Optimization Strategies

### 1. Tree Shaking
```javascript
// Import only what you need from framer-motion
import { motion } from 'framer-motion'; // Instead of importing entire library
import { AnimatePresence } from 'framer-motion';

// For Three.js, import only required modules
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
```

### 2. Dynamic Imports
```javascript
// Lazy load complex 3D scenes
const AnimationScene = lazy(() => import('./AnimationScene'));
const SkillVisualization = lazy(() => import('./SkillVisualization'));

// Conditionally load heavy animation components
const loadHeavyAnimations = async () => {
  if (supportsWebGL() && !isLowEndDevice()) {
    const { ComplexAnimation } = await import('./ComplexAnimation');
    return ComplexAnimation;
  }
  return SimpleAnimation;
};
```

### 3. Code Splitting
```javascript
// Separate animation bundle
const AnimationBundle = () => ({
  // Lightweight animation utilities
  animationUtils: () => import('./utils/animation-utils'),
  // Heavy 3D components
  threeComponents: () => import('./components/three-components'),
  // Performance monitoring
  performanceUtils: () => import('./utils/performance-utils'),
});
```

### 4. Bundle Analysis Tools
```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
};
```

## Performance Optimizations

### 1. Animation Performance
```javascript
// Use transform and opacity for GPU-accelerated animations
const optimizedAnimation = {
  hidden: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

// Use will-change for complex animations
const AnimatedElement = styled(motion.div)`
  will-change: transform, opacity;
`;
```

### 2. Device Capability Detection
```javascript
// Adjust animation complexity based on device
const getAnimationConfig = () => {
  if (isLowEndDevice()) {
    return {
      duration: 0.1,
      easing: 'ease-out',
      complexity: 'simple'
    };
  }

  return {
    duration: 0.3,
    easing: [0.25, 0.1, 0.25, 1],
    complexity: 'full'
  };
};
```

### 3. Memory Management
```javascript
// Clean up animation resources
useEffect(() => {
  return () => {
    // Cancel ongoing animations
    if (animationRef.current) {
      animationRef.current.cancel();
    }

    // Dispose of Three.js resources
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };
}, []);
```

## Lazy Loading Implementation

### 1. Animation Components
```javascript
// Lazy load heavy animation components
const LazyAnimatedAvatar = lazy(() =>
  import('./components/AIAvatar').then(module => ({ default: module.default }))
);

const AnimatedAvatarWrapper = () => (
  <Suspense fallback={<div>Loading avatar...</div>}>
    <LazyAnimatedAvatar />
  </Suspense>
);
```

### 2. Animation Libraries
```javascript
// Load animation libraries conditionally
const loadAnimationLibrary = async () => {
  if (!supportsAnimations()) {
    return null;
  }

  // Load framer-motion only when needed
  const motion = await import('framer-motion');
  return motion;
};
```

## Image and Asset Optimization

### 1. SVG Sprites
```javascript
// Combine multiple SVG icons into sprites
const SVGSprites = () => (
  <svg style={{ display: 'none' }}>
    <defs>
      <symbol id="icon-smile" viewBox="0 0 24 24">
        {/* Smile icon path */}
      </symbol>
      <symbol id="icon-thinking" viewBox="0 0 24 24">
        {/* Thinking icon path */}
      </symbol>
    </defs>
  </svg>
);
```

### 2. WebP Images with Fallbacks
```javascript
// Use modern image formats with fallbacks
const OptimizedImage = ({ src, alt }) => (
  <picture>
    <source srcSet={`${src}.webp`} type="image/webp" />
    <source srcSet={`${src}.avif`} type="image/avif" />
    <img src={`${src}.png`} alt={alt} />
  </picture>
);
```

## Caching Strategies

### 1. Service Worker Caching
```javascript
// Cache animation assets
const CACHE_NAME = 'animation-assets-v1';
const urlsToCache = [
  '/static/animations/',
  '/static/images/',
  '/fonts/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### 2. Component Memoization
```javascript
// Memoize animation components
const MemoizedAnimation = React.memo(({ animationProps }) => {
  return <motion.div {...animationProps} />;
});

// With custom comparison
const CustomMemoizedAnimation = React.memo(
  ({ animationProps }) => <motion.div {...animationProps} />,
  (prevProps, nextProps) => {
    return prevProps.animationKey === nextProps.animationKey;
  }
);
```

## Monitoring and Analytics

### 1. Performance Metrics
```javascript
// Track animation performance
const trackAnimationPerformance = (animationName, startTime, endTime) => {
  const duration = endTime - startTime;

  // Log slow animations
  if (duration > 100) { // More than 100ms
    console.warn(`Slow animation: ${animationName}`, duration);
  }
};
```

### 2. Bundle Size Tracking
```javascript
// Set up bundle size alerts
const BUNDLE_SIZE_LIMIT = 500 * 1024; // 500KB

const checkBundleSize = (bundleSize) => {
  if (bundleSize > BUNDLE_SIZE_LIMIT) {
    console.warn(`Bundle size exceeded limit: ${bundleSize} bytes`);
  }
};
```

## Build Optimizations

### 1. Vite Configuration
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'animation-core': ['framer-motion'],
          '3d-graphics': ['three'],
          'animation-utils': ['./src/utils/animation-utils'],
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  }
};
```

### 2. Dead Code Elimination
```javascript
// Use build-time flags to eliminate unused code
const AnimationFeature = () => {
  if (process.env.NODE_ENV === 'production') {
    return <SimpleAnimation />;
  }

  // Development-specific animation features
  return <DevelopmentAnimation />;
};
```

## Results Expected
- **Bundle size reduction**: 20-30%
- **Initial load time improvement**: 15-25%
- **Memory usage reduction**: 10-20%
- **Animation performance**: Consistent 60fps across target devices