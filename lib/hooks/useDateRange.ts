import { useState, useEffect } from 'react';

interface DateRangeData {
  startDate: string;
  endDate: string;
  totalDates: number;
  availableDates: string[];
  error?: string;
}

interface UseDateRangeReturn {
  dateRange: DateRangeData | null;
  loading: boolean;
  error: string | null;
}

export function useDateRange(): UseDateRangeReturn {
  const [dateRange, setDateRange] = useState<DateRangeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/dashboard-metrics/dates');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch date range: ${response.status}`);
        }

        const data = (await response.json()) as DateRangeData;

        if (data.error) {
          // Still use the data if available (fallback dates)
        }

        setDateRange(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch date range');
        
        // Set fallback date range
        setDateRange({
          startDate: '2024-07-01',
          endDate: '2025-07-29',
          totalDates: 0,
          availableDates: [],
          error: 'Using fallback dates',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDateRange();
  }, []);

  return { dateRange, loading, error };
}