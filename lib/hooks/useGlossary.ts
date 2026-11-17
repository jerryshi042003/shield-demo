import { useState, useEffect, useCallback } from 'react';

export interface GlossaryTerm {
  term: string;
  definition: string;
  isPlaceholder?: boolean;
}

export interface GlossarySection {
  title: string;
  order?: number;
  terms: GlossaryTerm[];
}

// Support both flat array (backward compatibility) and sectioned structure (new)
export type SectionData = GlossaryTerm[] | { sections: GlossarySection[] };

export interface GlossaryData {
  overview: SectionData;
  sales: SectionData;
  marketing: SectionData;
  social: SectionData;
  _error?: string;
}

interface UseGlossaryReturn {
  data: GlossaryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Simple in-memory cache for glossary data
const glossaryCache = new Map<string, { data: GlossaryData; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function useGlossary(): UseGlossaryReturn {
  const [data, setData] = useState<GlossaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'glossary';
      const cached = glossaryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      
      const response = await fetch('/api/glossary', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch glossary`);
      }

      const glossaryData = (await response.json()) as GlossaryData;

      // Check for server errors
      if (glossaryData._error) {
        setError(glossaryData._error);
      }

      // Cache the data
      glossaryCache.set(cacheKey, { data: glossaryData, timestamp: Date.now() });
      
      setData(glossaryData);
      
      // Only clear error if data is valid
      if (!glossaryData._error) {
        setError(null);
      }

    } catch (err) {
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch glossary';
      setError(errorMessage);
      
      // Provide empty fallback
      setData({
        overview: [],
        sales: [],
        marketing: [],
        social: []
      });

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}