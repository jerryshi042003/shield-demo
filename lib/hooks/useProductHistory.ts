import { useState, useEffect, useCallback } from 'react';
import { logSilentError } from '@/lib/utils/logger';

export interface ProductTrendData {
  Individual?: Array<{ date: string; value: number }>;
  Plan?: Array<{ date: string; value: number }>;
  Other?: Array<{ date: string; value: number }>;
  Group?: Array<{ date: string; value: number }>;
  Total?: Array<{ date: string; value: number }>;
}

interface UseProductHistoryReturn {
  data: ProductTrendData;
  loading: boolean;
  refetch: () => void;
}

export function useProductHistory(selectedDate?: string, enabled: boolean = true): UseProductHistoryReturn {
  const [data, setData] = useState<ProductTrendData>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const url = selectedDate
        ? `/api/game-products?date=${selectedDate}&history=true`
        : '/api/game-products?history=true';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = (await response.json()) as Record<string, unknown>;

      // Extract history from response
      if (rawData.history && typeof rawData.history === 'object') {
        setData(rawData.history as ProductTrendData);
      } else {
        setData({});
      }

    } catch (err) {
      logSilentError('Failed to fetch product history data', err instanceof Error ? err : new Error(String(err)), {
        component: 'useProductHistory',
        url: '/api/game-products',
        selectedDate
      });

      // Set empty data as fallback
      setData({});

    } finally {
      setLoading(false);
    }
  }, [enabled, selectedDate]);

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
