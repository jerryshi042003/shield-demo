'use client';

import { useEffect } from 'react';

export function usePageTitle(section?: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let title = 'Shield';

    if (section === 'overview') {
      title = 'Shield | Overview';
    } else if (section === 'sales') {
      title = 'Shield | Sales';
    }
    
    document.title = title;
  }, [section]);
}