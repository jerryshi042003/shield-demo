import { useState, useEffect } from 'react';

interface HistoricalDataPoint {
  date: string;
  TSR: number;
  TSR_Goal_Pacing: number;
  ATP_avg_season: number;
  ATP_Goal_Pacing: number;
  GAS_season_avg: number;
  GAS_Goal_Pacing: number;
  NFS_Season_To_Date: number;
  NFS_Goal_Pacing: number;
  TotalFantoDate: number;
  IGI: number;
  APPU: number;
  [key: string]: string | number | undefined;
}

interface UseHistoricalMetricsReturn {
  data: HistoricalDataPoint[];
  loading: boolean;
  error: string | null;
}

// Cache for historical data
const historicalCache = new Map<string, { data: HistoricalDataPoint[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

export function useHistoricalMetrics(): UseHistoricalMetricsReturn {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        // Check cache first
        const cacheKey = 'historical-metrics';
        const cached = historicalCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        
        const response = await fetch('/api/dashboard-metrics/historical', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const historicalData = (await response.json()) as HistoricalDataPoint[];
        
        // Filter out invalid entries and ensure we have required fields
        const validData = historicalData.filter(point =>
          point.date &&
          !isNaN(point.TSR) &&
          !isNaN(point.TSR_Goal_Pacing)
        );

        // Sort by date to ensure proper time series
        const sortedData = validData.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );


        // Cache the data
        historicalCache.set(cacheKey, { 
          data: sortedData, 
          timestamp: Date.now() 
        });
        
        setData(sortedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
        setData([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, []);

  return { data, loading, error };
}

// Helper function to get revenue data for charts
export function useRevenueChartData() {
  const { data, loading, error } = useHistoricalMetrics();
  
  // Format data specifically for revenue chart
  const revenueData = data.map(point => ({
    date: point.date,
    TSR: point.TSR,
    TSR_Goal_Pacing: point.TSR_Goal_Pacing,
    goalTarget: point.TSR / (point.TSR_Goal_Pacing || 1) // Calculate goal target
  }));

  return { data: revenueData, loading, error };
}

// Helper function to get running averages data
export function useRunningAveragesData() {
  const { data, loading, error } = useHistoricalMetrics();
  
  // Format data for running averages charts (ATP, GAS trends)
  const averagesData = data.map(point => ({
    date: point.date,
    ATP: point.ATP_avg_season,
    ATP_Goal_Pacing: point.ATP_Goal_Pacing,
    GAS: point.GAS_season_avg,
    GAS_Goal_Pacing: point.GAS_Goal_Pacing,
    NFS: point.NFS_Season_To_Date,
    NFS_Goal_Pacing: point.NFS_Goal_Pacing
  }));

  return { data: averagesData, loading, error };
} 