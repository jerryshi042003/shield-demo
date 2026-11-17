'use client';

import { useEffect, useState } from 'react';

/**
 * Shared hook for managing section recreation state
 * Used by all dashboard sections to handle league changes and forced chart recreation
 * Note: AHL removed - only NHL supported
 */
export function useSectionRecreation(_league: 'NHL') {
  const [shouldRecreate, setShouldRecreate] = useState(true);

  useEffect(() => {
    setShouldRecreate(true);

    const timer = setTimeout(() => {
      setShouldRecreate(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return { shouldRecreate };
} 