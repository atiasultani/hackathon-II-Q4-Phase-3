/**
 * Accessibility Utilities for Animation System
 * Handles reduced motion preferences and other accessibility features
 */

// Check if reduced motion is preferred
export const isReducedMotionPreferred = (): boolean => {
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  }
  return false;
};

// Subscribe to reduced motion preference changes
export const subscribeToReducedMotion = (callback: (reducedMotion: boolean) => void) => {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handleChange);

  // Return unsubscribe function
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};

// Announce to screen readers
export const announceToScreenReader = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
  if (typeof document === 'undefined') return;

  // Remove any existing announcements
  const existingAnnouncements = document.querySelectorAll('.sr-only-announcement');
  existingAnnouncements.forEach(el => el.remove());

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only-announcement fixed top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Clean up after a delay
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
};

// Get focusable elements within a container
export const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return [];

  const focusableSelectors = [
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    element => !element.hasAttribute('disabled') && element.offsetParent !== null
  );
};

// Trap focus within a container (useful for modals, dropdowns)
export const trapFocus = (container: HTMLElement | null, callback?: () => void) => {
  if (!container) return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus the first element initially
  firstElement.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    if (callback) callback();
  };
};

// Create visually hidden but screen reader accessible content
export const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// Debounce function for handling rapid events like scroll
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), wait);
  }) as T;
};

// Throttle function for performance
export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number) => {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

// Check if element is in viewport (useful for performance)
export const isElementInViewport = (element: HTMLElement): boolean => {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Handle keyboard navigation for custom components
export const handleKeyboardNavigation = (
  e: React.KeyboardEvent,
  onActivate?: () => void,
  onSelect?: () => void
) => {
  switch (e.key) {
    case ' ':
    case 'Enter':
      e.preventDefault();
      if (onActivate) onActivate();
      break;
    case 'Escape':
      if (onSelect) onSelect();
      break;
    default:
      break;
  }
};