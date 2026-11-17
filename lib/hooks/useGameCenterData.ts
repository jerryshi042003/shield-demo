import { useCallback, useEffect, useRef, useState } from 'react';
import { logSilentError } from '@/lib/utils/logger';
import {
  parseGameCenterApiResponse,
  type GameCenterApiResponse,
  type GameCenterQuery
} from '@/lib/types/game-center';

interface UseGameCenterDataReturn {
  data: GameCenterApiResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const GAME_CENTER_CACHE_STALE_MS = 45 * 60 * 1000;
const GAME_CENTER_CACHE_PREFIX = 'sales.game-center.cache:';
const SHOULD_USE_SESSION_CACHE = process.env.NODE_ENV === 'production';

interface GameCenterCacheEntry {
  cachedAtMs: number;
  data: unknown;
}

function readGameCenterCache(cacheKey: string): GameCenterApiResponse | null {
  if (!SHOULD_USE_SESSION_CACHE) return null;
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GameCenterCacheEntry;
    if (typeof parsed.cachedAtMs !== 'number' || !('data' in parsed)) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    if (Date.now() - parsed.cachedAtMs > GAME_CENTER_CACHE_STALE_MS) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parseGameCenterApiResponse(parsed.data);
  } catch {
    try {
      window.sessionStorage.removeItem(cacheKey);
    } catch {
      // ignore sessionStorage cleanup errors
    }
    return null;
  }
}

function writeGameCenterCache(cacheKey: string, data: GameCenterApiResponse) {
  if (!SHOULD_USE_SESSION_CACHE) return;
  if (typeof window === 'undefined') return;

  try {
    const entry: GameCenterCacheEntry = {
      cachedAtMs: Date.now(),
      data
    };
    window.sessionStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // ignore cache write failures (quota/private mode)
  }
}

export function useGameCenterData(query: GameCenterQuery | null): UseGameCenterDataReturn {
  const [data, setData] = useState<GameCenterApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestQueryRef = useRef<GameCenterQuery | null>(query);
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const querySignature = query
    ? `${query.franchise}|${query.season}|${query.season_type}|${query.event_code}`
    : '';

  const fetchData = useCallback(async (
    activeQuery: GameCenterQuery | null,
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
    const activeQuerySignature = `${activeQuery.franchise}|${activeQuery.season}|${activeQuery.season_type}|${activeQuery.event_code}`;
    const cacheKey =
      activeQuerySignature.length > 0 ? `${GAME_CENTER_CACHE_PREFIX}${activeQuerySignature}` : null;

    if (!forceRefresh && cacheKey) {
      const cachedData = readGameCenterCache(cacheKey);
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
        season: activeQuery.season,
        season_type: activeQuery.season_type,
        event_code: activeQuery.event_code
      });
      const requestUrl = `/api/sales/game-center/game?${params.toString()}`;

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
      const parsedPayload = parseGameCenterApiResponse(rawPayload);
      if (requestId !== activeRequestIdRef.current) return;
      setData(parsedPayload);
      if (cacheKey) {
        writeGameCenterCache(cacheKey, parsedPayload);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (requestId !== activeRequestIdRef.current) return;
      const errorMessage = err instanceof Error ? err.message : String(err);
      setData(null);
      setError(errorMessage);
      logSilentError('Failed to fetch game center data', err instanceof Error ? err : new Error(errorMessage), {
        component: 'useGameCenterData',
        url: '/api/sales/game-center/game',
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
