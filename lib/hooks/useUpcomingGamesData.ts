import { useState, useEffect, useCallback } from 'react';
import { logSilentError } from '@/lib/utils/logger';

export interface UpcomingGameData {
  event_code: string;
  event_name: string;
  opponent: string;
  event_date_only: string; // "2025-10-07" (date only)
  event_date_time: string | null; // "2025-10-07T17:30:00.000Z" (full datetime)
  theme_night: string | null; // Theme night name or null
  theme_night_category: string | null; // Theme category
  giveaway: string | null; // Giveaway item
  total_revenue: number;
  total_tickets: number;
  game_goal_amount?: number; // Revenue goal for this game
  percent_to_goal?: number; // Percentage of goal achieved
  data_processing_timestamp?: string;
}

interface UseUpcomingGamesDataReturn {
  data: UpcomingGameData[];
  loading: boolean;
  refetch: () => void;
}

export function useUpcomingGamesData(enabled: boolean = true): UseUpcomingGamesDataReturn {
  const [data, setData] = useState<UpcomingGameData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/upcoming-games', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = (await response.json()) as UpcomingGameData[];

      // Validate data structure
      if (!Array.isArray(rawData)) {
        throw new Error('Invalid data structure: expected array');
      }

      setData(rawData);

    } catch (err) {
      logSilentError('Failed to fetch upcoming games data', err instanceof Error ? err : new Error(String(err)), {
        component: 'useUpcomingGamesData',
        url: '/api/upcoming-games'
      });

      // Set empty array as fallback
      setData([]);

    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [enabled, fetchData]);

  return {
    data,
    loading,
    refetch: fetchData,
  };
}
