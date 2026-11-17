// Optimized Framer Motion imports for better tree-shaking
// Import only what's needed to reduce bundle size

// Re-export motion and AnimatePresence for consistent usage
export { motion, AnimatePresence } from 'framer-motion';

// Common animation variants to reduce duplication
export const fadeInUp = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
  transition: { duration: 0.15 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};

export const slideIn = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: 0.2 }
};

// Synchronous animation for lists - no stagger delay
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 }
};