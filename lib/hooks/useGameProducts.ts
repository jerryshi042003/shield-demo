import { useState, useEffect, useCallback } from 'react';
import { logSilentError } from '@/lib/utils/logger';

export interface ProductBreakdown {
  revenue: number;
  tickets: number;
  atp: number;
}

export interface GameMetadata {
  event_code: string;
  event_name: string;
  opponent: string;
  event_date_time: string;
  event_date_only: string;
  theme_night: string | null;
}

export interface GameProductsData {
  products: {
    Group?: ProductBreakdown;
    Individual?: ProductBreakdown;
    Other?: ProductBreakdown;
    Plan?: ProductBreakdown;
  };
  gameMetadata: GameMetadata | null;
}

interface UseGameProductsReturn {
  data: GameProductsData;
  loading: boolean;
  refetch: () => void;
}

export function useGameProducts(selectedDate?: string, enabled: boolean = true): UseGameProductsReturn {
  const [data, setData] = useState<GameProductsData>({
    products: {},
    gameMetadata: null
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const url = selectedDate
        ? `/api/game-products?date=${selectedDate}`
        : '/api/game-products';

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

      const rawData = (await response.json()) as GameProductsData;

      setData({
        products: rawData.products,
        gameMetadata: rawData.gameMetadata
      });

    } catch (err) {
      logSilentError('Failed to fetch game products data', err instanceof Error ? err : new Error(String(err)), {
        component: 'useGameProducts',
        url: '/api/game-products',
        selectedDate
      });

      // Set empty data as fallback
      setData({
        products: {},
        gameMetadata: null
      });

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
