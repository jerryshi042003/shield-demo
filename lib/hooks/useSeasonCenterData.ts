import { useCallback, useEffect, useRef, useState } from 'react';
import { logSilentError } from '@/lib/utils/logger';
import {
  parseSeasonCenterApiResponse,
  type SeasonCenterApiResponse,
  type SeasonCenterQuery
} from '@/lib/types/season-center';

interface UseSeasonCenterDataReturn {
  data: SeasonCenterApiResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const SEASON_CENTER_CACHE_STALE_MS = 45 * 60 * 1000;
const SEASON_CENTER_CACHE_PREFIX = 'sales.season-center.cache:';
const SHOULD_USE_SESSION_CACHE = process.env.NODE_ENV === 'production';

interface SeasonCenterCacheEntry {
  cachedAtMs: number;
  data: unknown;
}

function readSeasonCenterCache(cacheKey: string): SeasonCenterApiResponse | null {
  if (!SHOULD_USE_SESSION_CACHE) return null;
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SeasonCenterCacheEntry;
    if (typeof parsed.cachedAtMs !== 'number' || !('data' in parsed)) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    if (Date.now() - parsed.cachedAtMs > SEASON_CENTER_CACHE_STALE_MS) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parseSeasonCenterApiResponse(parsed.data);
  } catch {
    try {
      window.sessionStorage.removeItem(cacheKey);
    } catch {
      // ignore sessionStorage cleanup errors
    }
    return null;
  }
}

function writeSeasonCenterCache(cacheKey: string, data: SeasonCenterApiResponse) {
  if (!SHOULD_USE_SESSION_CACHE) return;
  if (typeof window === 'undefined') return;

  try {
    const entry: SeasonCenterCacheEntry = {
      cachedAtMs: Date.now(),
      data
    };
    window.sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // ignore cache write failures (quota/private mode)
  }
}

export function useSeasonCenterData(query: SeasonCenterQuery | null): UseSeasonCenterDataReturn {
  const [data, setData] = useState<SeasonCenterApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestQueryRef = useRef<SeasonCenterQuery | null>(query);
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const querySignature = query ? `${query.franchise}|${query.season}|${query.season_type ?? 'REG'}` : '';

  const fetchData = useCallback(async (
    activeQuery: SeasonCenterQuery | null,
    options?: { forceRefresh?: boolean }
  ) => {
    abortControllerRef.current?.abort();

    if (!activeQuery) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const forceRefresh = options?.forceRefresh ?? false;
    const activeQuerySignature = `${activeQuery.franchise}|${activeQuery.season}|${activeQuery.season_type ?? 'REG'}`;
    const cacheKey =
      activeQuerySignature.length > 0 ? `${SEASON_CENTER_CACHE_PREFIX}${activeQuerySignature}` : null;

    if (!forceRefresh && cacheKey) {
      const cachedData = readSeasonCenterCache(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setError(null);
        setLoading(false);
        return;
      }
    }

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        franchise: activeQuery.franchise,
        season: activeQuery.season
      });

      if (activeQuery.season_type && activeQuery.season_type.trim().length > 0) {
        params.set('season_type', activeQuery.season_type.trim());
      }

      const requestUrl = `/api/sales/season-center/season?${params.toString()}`;
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[SeasonCenterDebug] request', {
          query: activeQuery,
          requestUrl
        });
      }
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText || body || 'Request failed'}`);
      }

      const rawPayload: unknown = await response.json();
      const parsedPayload = parseSeasonCenterApiResponse(rawPayload);
      if (process.env.NODE_ENV !== 'production') {
        const rawResponse = rawPayload as Record<string, unknown>;
        const rawUpcomingGames = Array.isArray(rawResponse.upcoming_games) ? rawResponse.upcoming_games : [];
        // eslint-disable-next-line no-console
        console.log('[SeasonCenterDebug] response.upcoming_games', {
          count: rawUpcomingGames.length,
          upcoming_games: rawUpcomingGames
        });
        // eslint-disable-next-line no-console
        console.log('[SeasonCenterDebug] parsed.upcoming_games', {
          count: parsedPayload.upcoming_games.length,
          upcoming_games: parsedPayload.upcoming_games
        });
      }

      if (requestId !== activeRequestIdRef.current) return;
      setData(parsedPayload);
      if (cacheKey) {
        writeSeasonCenterCache(cacheKey, parsedPayload);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (requestId !== activeRequestIdRef.current) return;

      const errorMessage = err instanceof Error ? err.message : String(err);
      setData(null);
      setError(errorMessage);
      logSilentError('Failed to fetch season center data', err instanceof Error ? err : new Error(errorMessage), {
        component: 'useSeasonCenterData',
        url: '/api/sales/season-center/season',
        query: activeQuery
      });
    } finally {
      if (requestId !== activeRequestIdRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    latestQueryRef.current = query;
  }, [query, querySignature]);

  useEffect(() => {
    void fetchData(latestQueryRef.current);
  }, [fetchData, querySignature]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => {
      void fetchData(latestQueryRef.current, { forceRefresh: true });
    }
  };
}
