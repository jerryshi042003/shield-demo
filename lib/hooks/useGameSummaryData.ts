import { useCallback, useEffect, useMemo, useState } from 'react';
import { logSilentError } from '@/lib/utils/logger';

export interface GameSummaryMetrics {
  individual_tickets: number;
  group_tickets: number;
  comp_tickets: number;
  parking_tickets: number;
  experience_vouchers: number;
  passes: number;
  item_giveaway: number;
  paid_tickets: number;
  distributed_tickets: number;
  individual_revenue: number;
  group_revenue: number;
  total_revenue: number;
  atp: number;
  scans: number;
  attendees: number;
}

export interface PriceLevelBreakdownRow {
  price_level: string;
  metrics: GameSummaryMetrics;
}

export interface GameSummaryApiRow {
  event_id: string;
  event_code: string;
  event_date: string;
  season: number | string;
  season_type?: string;
  dow: string;
  event_time: string;
  opponent: string;
  price_level: string;
  metrics: GameSummaryMetrics;
  price_level_breakdown?: PriceLevelBreakdownRow[];
}

interface GameSummaryApiResponse {
  rows: GameSummaryApiRow[];
}

interface UseGameSummaryDataReturn {
  data: GameSummaryApiRow[];
  loading: boolean;
  refetch: (query?: GameSummaryQuery) => void;
  defaultQuery: GameSummaryQuery;
}

export interface GameSummaryQuery {
  franchise: string;
  filters: {
    season: string[];
    season_type: string[];
    event_date_start: string | null;
    event_date_end: string | null;
    days_out_category: Array<'0_7' | '8_14' | '15_30' | '31_PLUS'>;
    sales_days_out_max: number | null;
    price_level: string[];
    product?: string[];
    event_day_of_week: string[];
    opponent: string[];
  };
  date_preset: 'ALL' | 'TODAY' | 'PREV_DAY' | 'LAST_7' | 'LAST_30' | 'LAST_90';
  group_by: string[];
  include_price_level_breakdown: boolean;
  sort: Array<{ field: string; direction: 'asc' | 'desc' }>;
  pagination: { page: number; page_size: number };
}

function getDefaultSeasonCodeFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const seasonStartYear = month < 6 ? year - 1 : year;
  const seasonEndYear = seasonStartYear + 1;
  const startYY = String(seasonStartYear).slice(-2);
  const endYY = String(seasonEndYear).slice(-2);
  return `${startYY}${endYY}`;
}

export const DEFAULT_SALES_ANALYSIS_SEASON = getDefaultSeasonCodeFromDate(new Date());

export function buildDefaultGameSummaryQuery(franchise: string): GameSummaryQuery {
  return {
    franchise,
    filters: {
      season: [DEFAULT_SALES_ANALYSIS_SEASON],
      season_type: ['ALL'],
      event_date_start: null,
      event_date_end: null,
      days_out_category: ['0_7', '8_14', '15_30', '31_PLUS'],
      sales_days_out_max: null,
      price_level: ['ALL'],
      event_day_of_week: ['ALL'],
      opponent: ['ALL']
    },
    date_preset: 'ALL',
    group_by: ['event'],
    include_price_level_breakdown: true,
    sort: [{ field: 'event_date', direction: 'asc' }],
    pagination: { page: 1, page_size: 500 }
  };
}

interface UseGameSummaryDataOptions {
  autoFetch?: boolean;
}

export function useGameSummaryData(
  franchise: string,
  enabled: boolean = true,
  options?: UseGameSummaryDataOptions
): UseGameSummaryDataReturn {
  const autoFetch = options?.autoFetch ?? true;
  const [data, setData] = useState<GameSummaryApiRow[]>([]);
  const [loading, setLoading] = useState(enabled && autoFetch);
  const defaultQuery = useMemo(() => buildDefaultGameSummaryQuery(franchise), [franchise]);

  const fetchData = useCallback(async (query: GameSummaryQuery = defaultQuery) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/sales/game-summary/query', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        const rawError = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText || rawError || 'Request failed'}`);
      }

      const payload = (await response.json()) as GameSummaryApiResponse;

      setData(Array.isArray(payload.rows) ? payload.rows : []);
    } catch (err) {
      logSilentError(
        'Failed to fetch game summary data',
        err instanceof Error ? err : new Error(String(err)),
        {
          component: 'useGameSummaryData',
          url: '/api/sales/game-summary/query'
        }
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [defaultQuery, enabled]);

  useEffect(() => {
    if (!enabled || !autoFetch) {
      setLoading(false);
      return;
    }
    fetchData(defaultQuery);
  }, [autoFetch, defaultQuery, enabled, fetchData]);

  return {
    data,
    loading,
    refetch: fetchData,
    defaultQuery
  };
}
