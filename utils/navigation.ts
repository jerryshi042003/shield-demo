import { useRouter } from 'next/navigation';

/**
 * Safe navigation utility that ensures lg parameter is never carried over
 * when navigating away from the overview page
 */
export const safeNavigate = (path: string) => {
  if (typeof window !== 'undefined') {
    // Force navigation without any query parameters
    window.location.href = path;
  }
};

/**
 * Hook for safe programmatic navigation using Next.js router
 * Removes lg parameter when navigating away from overview
 */
export const useSafeNavigation = () => {
  const router = useRouter();
  
  const navigateTo = (path: string) => {
    // Use router.push with clean pathname only
    router.push(path);
  };
  
  return { navigateTo };
};
