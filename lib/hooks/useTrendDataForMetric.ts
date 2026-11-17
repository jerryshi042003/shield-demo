import { useState, useEffect, useMemo } from 'react';
import { useHistoricalMetrics } from './useHistoricalMetrics';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface UseTrendDataForMetricReturn {
  data: TrendDataPoint[];
  loading: boolean;
  error: string | null;
}

export function useTrendDataForMetric(
  fieldName?: string, 
  fallbackFieldName?: string, 
  selectedDate?: string
): UseTrendDataForMetricReturn {
  const { data: historicalData, loading: historicalLoading, error: historicalError } = useHistoricalMetrics();
  const [error, setError] = useState<string | null>(null);

  // Memoize the trend data calculation
  const trendData = useMemo((): TrendDataPoint[] => {
    if (!historicalData.length || !fieldName) {
      return [];
    }

    try {
      // Convert selectedDate to Date object, default to today
      const targetDate = selectedDate ? new Date(selectedDate) : new Date();
      
      // Calculate 7 days ago from the target date
      const sevenDaysAgo = new Date(targetDate);
      sevenDaysAgo.setDate(targetDate.getDate() - 6); // 7 days inclusive of target date

      // Filter and map historical data to get 7-day window
      const relevantData = historicalData
        .filter(point => {
          const pointDate = new Date(point.date);
          return pointDate >= sevenDaysAgo && pointDate <= targetDate;
        })
        .map(point => {
          // Try primary field first, then fallback
          let value = point[fieldName];
          if (value === undefined && fallbackFieldName) {
            value = point[fallbackFieldName];
          }
          
          return {
            date: point.date,
            value: typeof value === 'number' ? value : 0
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // If we don't have enough data points, pad with the last known value
      if (relevantData.length > 0 && relevantData.length < 7) {
        const lastValue = relevantData[relevantData.length - 1].value;
        const lastDate = new Date(relevantData[relevantData.length - 1].date);
        
        // Fill missing days with last known value
        while (relevantData.length < 7) {
          lastDate.setDate(lastDate.getDate() + 1);
          if (lastDate <= targetDate) {
            relevantData.push({
              date: lastDate.toISOString().split('T')[0],
              value: lastValue
            });
          } else {
            break;
          }
        }
      }

      return relevantData;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing trend data');
      return [];
    }
  }, [historicalData, fieldName, fallbackFieldName, selectedDate]);

  // Clear error when data changes successfully
  useEffect(() => {
    if (trendData.length > 0) {
      setError(null);
    }
  }, [trendData]);

  return {
    data: trendData,
    loading: historicalLoading,
    error: error ?? historicalError
  };
}

// Helper function to check if a metric has trend data available
export function hasMetricTrendData(fieldName?: string): boolean {
  return Boolean(fieldName);
}