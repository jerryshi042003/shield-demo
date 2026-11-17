import { useState, useEffect } from 'react';

interface PacingDataPoint {
  event_code: string;
  event_name: string;
  opponent: string | null;
  event_date: string;
  sale_date: string;
  days_to_game: number;
  cumulative_revenue: number;
  cumulative_tickets: number;
  last_updated: string | null;
  data_processing_timestamp: string;
}

interface EventMetadata {
  event_code: string;
  event_name: string;
  opponent: string | null;
  event_date: string;
}

interface PacingMetrics {
  currentRevenue: number;
  currentTickets: number;
  daysToGame: number;
  lastUpdated: string | null;
}

interface NextGamePacingData {
  eventMetadata: EventMetadata | null;
  pacingData: PacingDataPoint[];
  metrics: PacingMetrics;
  _fallback?: boolean;
  _error?: string;
}

interface UseNextGamePacingReturn {
  data: NextGamePacingData;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch revenue pacing data for a specific game event
 * @param eventCode - The event code to fetch pacing data for (e.g., "LAK250223")
 * @returns Pacing data, loading state, and error state
 */
export function useNextGamePacing(eventCode: string | null): UseNextGamePacingReturn {
  const [data, setData] = useState<NextGamePacingData>({
    eventMetadata: null,
    pacingData: [],
    metrics: {
      currentRevenue: 0,
      currentTickets: 0,
      daysToGame: 0,
      lastUpdated: null
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no event code is provided, return empty state
    if (!eventCode) {
      setLoading(false);
      setError('No event code provided');
      return;
    }

    const fetchPacingData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sales-pacing-chart?eventCode=${eventCode}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch pacing data: ${response.status}`);
        }

        const result = (await response.json()) as NextGamePacingData;

        // Check if response indicates a fallback/error state
        if (result._fallback) {
          setError(result._error ?? 'Failed to load pacing data');
        }

        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPacingData();
  }, [eventCode]);

  return { data, loading, error };
}
