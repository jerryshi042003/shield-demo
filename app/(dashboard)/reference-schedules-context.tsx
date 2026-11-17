"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { logSilentError } from '@/lib/utils/logger';
import { useFranchise } from './franchise-context';

export interface ScheduleGameReference {
  event_code: string;
  event_date: string;
  opponent: string;
  theme_night?: string | null;
  days_out?: number | null;
}

export interface ScheduleSeasonReference {
  season: string;
  season_type: string;
  season_key: string;
  label: string;
  games: ScheduleGameReference[];
}

export interface ReferenceSchedulesData {
  franchise: string;
  version?: string;
  last_updated?: string;
  seasons: ScheduleSeasonReference[];
  next_game?: {
    season_key: string;
    event_code: string;
  };
}

interface ReferenceSchedulesResponse {
  franchise?: string;
  version?: string;
  last_updated?: string;
  seasons?: Array<{
    season?: string | number;
    season_type?: string;
    season_key?: string;
    label?: string;
    games?: Array<{
      event_code?: string;
      event_date?: string;
      opponent?: string;
      theme_night?: string | null;
      days_out?: number | null;
    }>;
  }>;
  next_game?: {
    season_key?: string;
    event_code?: string;
  };
}

interface ReferenceSchedulesContextValue {
  franchise: string;
  data: ReferenceSchedulesData | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const REFERENCE_SCHEDULES_STALE_MS = 45 * 60 * 1000;

const sharedCacheByFranchise: Record<
  string,
  | {
    data: ReferenceSchedulesData | null;
    fetchedAtMs: number;
  }
  | undefined
> = {};

const ReferenceSchedulesContext = createContext<ReferenceSchedulesContextValue | undefined>(undefined);

function routeUsesReferenceSchedules(pathname: string): boolean {
  return /^\/sales\/(season|game|analysis)(?:\/|$)/.test(pathname);
}

function safeSeasonTypeLabel(seasonType: string): string {
  const normalized = seasonType.trim().toUpperCase();
  if (normalized === 'PRE') return 'Pre-season';
  if (normalized === 'REG') return 'Regular Season';
  if (normalized === 'POST' || normalized === 'PST') return 'Playoffs';
  return seasonType;
}

function seasonDisplayFromCode(seasonCode: string): string {
  if (!/^\d{4}$/.test(seasonCode)) return seasonCode;
  const startYear = 2000 + Number.parseInt(seasonCode.slice(0, 2), 10);
  const endYY = seasonCode.slice(2);
  return `${startYear}-${endYY}`;
}

function buildSeasonLabel(season: string, seasonType: string): string {
  const displaySeason = seasonDisplayFromCode(season);
  if (!seasonType || seasonType.toUpperCase() === 'ALL') return displaySeason;
  return `${displaySeason} ${safeSeasonTypeLabel(seasonType)}`;
}

function normalizeResponse(payload: ReferenceSchedulesResponse, fallbackFranchise: string): ReferenceSchedulesData {
  const seasons = (payload.seasons ?? [])
    .map((seasonEntry) => {
      const season = String(seasonEntry.season ?? '').trim();
      const seasonType = String(seasonEntry.season_type ?? '').trim().toUpperCase();
      const seasonKey = String(seasonEntry.season_key ?? `${season}${seasonType}`).trim();
      const games = (seasonEntry.games ?? [])
        .map((game) => ({
          event_code: String(game.event_code ?? '').trim(),
          event_date: String(game.event_date ?? '').trim(),
          opponent: String(game.opponent ?? '').trim(),
          theme_night: game.theme_night ?? null,
          days_out: typeof game.days_out === 'number' ? game.days_out : null
        }))
        .filter((game) => game.event_code && game.event_date);

      return {
        season,
        season_type: seasonType,
        season_key: seasonKey,
        label: String(seasonEntry.label ?? '').trim() || buildSeasonLabel(season, seasonType),
        games
      };
    })
    .filter((seasonEntry) => seasonEntry.season && seasonEntry.season_key)
    .sort((a, b) => b.season.localeCompare(a.season, undefined, { numeric: true }));

  const nextGameSeasonKey = payload.next_game?.season_key?.trim() ?? '';
  const nextGameEventCode = payload.next_game?.event_code?.trim() ?? '';

  return {
    franchise: payload.franchise?.trim() ?? fallbackFranchise,
    version: payload.version?.trim() ?? undefined,
    last_updated: payload.last_updated?.trim() ?? undefined,
    seasons,
    next_game:
      nextGameSeasonKey && nextGameEventCode
        ? {
            season_key: nextGameSeasonKey,
            event_code: nextGameEventCode
          }
        : undefined
  };
}

async function fetchReferenceSchedulesFromApi(franchise: string): Promise<ReferenceSchedulesData> {
  const response = await fetch(`/api/reference/schedules?franchise=${encodeURIComponent(franchise)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${response.statusText || body || 'Failed schedules request'}`);
  }

  const payload = (await response.json()) as ReferenceSchedulesResponse;
  return normalizeResponse(payload, franchise);
}

export function ReferenceSchedulesProvider({ children }: { children: React.ReactNode }) {
  const { franchise } = useFranchise();
  const pathname = usePathname();
  const schedulesRequired = routeUsesReferenceSchedules(pathname);
  const cachedEntry = sharedCacheByFranchise[franchise];
  const [data, setData] = useState<ReferenceSchedulesData | null>(cachedEntry?.data ?? null);
  const [loading, setLoading] = useState<boolean>(!(cachedEntry?.data));
  const inFlightRef = useRef<Promise<void> | null>(null);

  const executeFetch = useCallback(async (targetFranchise = franchise) => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const run = (async () => {
      try {
        const targetCache = sharedCacheByFranchise[targetFranchise];
        if (targetFranchise === franchise) {
          setLoading((previous) => previous || !(targetCache?.data));
        }

        const nextData = await fetchReferenceSchedulesFromApi(targetFranchise);
        sharedCacheByFranchise[targetFranchise] = {
          data: nextData,
          fetchedAtMs: Date.now()
        };
        if (targetFranchise === franchise) {
          setData(nextData);
        }
      } catch (error) {
        logSilentError(
          'Failed to fetch reference schedules',
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'ReferenceSchedulesProvider',
            url: '/api/reference/schedules'
          }
        );
      } finally {
        if (targetFranchise === franchise) {
          setLoading(false);
        }
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = run;
    return run;
  }, [franchise]);

  useEffect(() => {
    if (!schedulesRequired) {
      setLoading(false);
      return;
    }

    const activeCache = sharedCacheByFranchise[franchise];
    if (!activeCache?.data) {
      setData(null);
      setLoading(true);
      void executeFetch(franchise);
      return;
    }

    setData(activeCache.data);
    setLoading(false);

    const isStale = (Date.now() - activeCache.fetchedAtMs) > REFERENCE_SCHEDULES_STALE_MS;
    if (isStale) {
      void executeFetch(franchise);
    }
  }, [executeFetch, franchise, schedulesRequired]);

  const value = useMemo<ReferenceSchedulesContextValue>(
    () => ({
      franchise,
      data,
      loading,
      refetch: async () => executeFetch(franchise)
    }),
    [data, executeFetch, franchise, loading]
  );

  return <ReferenceSchedulesContext.Provider value={value}>{children}</ReferenceSchedulesContext.Provider>;
}

export function useReferenceSchedules() {
  const context = useContext(ReferenceSchedulesContext);
  if (!context) {
    throw new Error('useReferenceSchedules must be used within a ReferenceSchedulesProvider');
  }

  return context;
}
