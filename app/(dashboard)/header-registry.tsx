'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Section } from '@/lib/constants';

// Interface for a searchable header
export interface SearchableHeader {
  id: string;
  displayName: string;
  section: Section;
  type: 'card' | 'graph' | 'section';
  element?: HTMLElement | null;
  keywords?: string[];
  priority?: number;
  isVisible?: boolean;
}

// Context type
interface HeaderRegistryContextType {
  headers: SearchableHeader[];
  registerHeader: (header: SearchableHeader) => void;
  unregisterHeader: (id: string) => void;
  updateHeaderVisibility: (id: string, isVisible: boolean) => void;
  getVisibleHeaders: () => SearchableHeader[];
  getAllHeaders: () => SearchableHeader[];
}

// Create the context
const HeaderRegistryContext = createContext<HeaderRegistryContextType | undefined>(undefined);

// Provider component
export function HeaderRegistryProvider({ children }: { children: ReactNode }) {
  const [headers, setHeaders] = useState<Map<string, SearchableHeader>>(new Map());

  // Register a new header
  const registerHeader = useCallback((header: SearchableHeader) => {
    setHeaders(prev => {
      const next = new Map(prev);
      // Check if element exists in DOM
      if (!header.element && typeof document !== 'undefined') {
        header.element = document.getElementById(header.id);
      }
      next.set(header.id, { ...header, isVisible: true });
      return next;
    });
  }, []);

  // Unregister a header
  const unregisterHeader = useCallback((id: string) => {
    setHeaders(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Update header visibility (for conditional rendering)
  const updateHeaderVisibility = useCallback((id: string, isVisible: boolean) => {
    setHeaders(prev => {
      const next = new Map(prev);
      const header = next.get(id);
      if (header) {
        next.set(id, { ...header, isVisible });
      }
      return next;
    });
  }, []);

  // Get only visible headers
  const getVisibleHeaders = useCallback(() => {
    return Array.from(headers.values()).filter(h => h.isVisible !== false);
  }, [headers]);

  // Get all headers
  const getAllHeaders = useCallback(() => {
    return Array.from(headers.values());
  }, [headers]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    headers: Array.from(headers.values()),
    registerHeader,
    unregisterHeader,
    updateHeaderVisibility,
    getVisibleHeaders,
    getAllHeaders,
  }), [headers, registerHeader, unregisterHeader, updateHeaderVisibility, getVisibleHeaders, getAllHeaders]);

  return (
    <HeaderRegistryContext.Provider value={contextValue}>
      {children}
    </HeaderRegistryContext.Provider>
  );
}

// Hook to use the header registry
export function useHeaderRegistry() {
  const context = useContext(HeaderRegistryContext);
  if (context === undefined) {
    throw new Error('useHeaderRegistry must be used within a HeaderRegistryProvider');
  }
  return context;
}

// Hook for components to register themselves as searchable
export function useSearchableHeader(
  config: {
    id: string;
    displayName: string;
    section: Section;
    type?: 'card' | 'graph' | 'section';
    keywords?: string[];
    priority?: number;
  },
  deps: unknown[] = []
) {
  const registry = useHeaderRegistry();

  useEffect(() => {
    // Register the header
    const element = document.getElementById(config.id);
    registry.registerHeader({
      ...config,
      type: config.type ?? 'section',
      element,
    });

    // Cleanup: unregister on unmount
    return () => {
      registry.unregisterHeader(config.id);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}