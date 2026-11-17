import { useState, useEffect } from 'react';

interface HistoricalEntry {
  date: string;
  [key: string]: string | number | undefined | null;
}

interface TrendDataPoint {
  date: string;
  value: number;
}

interface TrendDataCache {
  [metricKey: string]: {
    data: TrendDataPoint[];
    timestamp: number;
  } | undefined;
}

// Cache for processed trend data (5 minute cache)
const trendDataCache: TrendDataCache = {};
const CACHE_DURATION = 5 * 60 * 1000;

// Mapping of metric labels to data field names
// All 9 executive dashboard metrics now have hover trends
const METRIC_FIELD_MAP: Record<string, string> = {
  // Revenue Section (3 metrics)
  'Ticket Sales\nRevenue': 'TSR',
  'New FSE': 'NFS_Season_To_Date',
  'ATP': 'ATP_avg_season',
  
  // Engagement Section (3 metrics)
  'Known Fans': 'TotalFantoDate',
  'Game\nAttendance': 'GAS_season_avg',
  'Daily App\nUsers': 'APPU',
  
  // Awareness Section (3 metrics)
  'Impressions\n(Organic)': 'TSI_Impressions',
  'Total\nViewership': 'curr_season_viewership_avg',
  'TV Ratings': 'curr_season_tv_ratings_avg',
  
  // Additional legacy mappings for compatibility
  'Hockey Dev Revenue': 'curr_season_HD_rev',
  'Daily Web Users': 'UWU',
  'Unique Website\nSessions': 'UWS',
  'Fan Growth': 'FDG_Season_To_Date',
  'Social Impressions': 'TSI_Impressions',
  'Instagram Impressions': 'IGI',
  'Facebook Impressions': 'FBI',
  'Twitter Impressions': 'TWI',
  'TikTok Impressions': 'TTI',
  'YouTube Impressions': 'YTI',
  'Total Reach Metrics': 'curr_season_TRM_avg'
};

async function fetchHistoricalData(): Promise<HistoricalEntry[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('/api/dashboard-metrics/historical', {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data as HistoricalEntry[];
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      try {
        const retryResponse = await fetch('/api/dashboard-metrics/historical');
        if (retryResponse.ok) {
          const retryData: unknown = await retryResponse.json();
          return Array.isArray(retryData) ? retryData as HistoricalEntry[] : [];
        }
      } catch {
      }
    }
    return [];
  }
}

function extractTrendData(historicalData: HistoricalEntry[], metricLabel: string, days: number = 7, relativeTo?: string): TrendDataPoint[] {
  const fieldName = METRIC_FIELD_MAP[metricLabel];
  if (!fieldName || historicalData.length === 0) {
    return [];
  }

  const validData = historicalData
    .filter(entry => {
      if (!entry.date || entry[fieldName] === undefined || entry[fieldName] === null) {
        return false;
      }

      const dateObj = new Date(entry.date);
      if (isNaN(dateObj.getTime())) {
        return false;
      }

      const rawValue = entry[fieldName];
      const numValue = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));

      if (isNaN(numValue) || !isFinite(numValue) || numValue < 0 || numValue > 1e12) {
        return false;
      }

      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let filteredData;

  if (relativeTo) {
    const relativeToTime = new Date(relativeTo).getTime();
    const dataUpToDate = validData.filter(entry => new Date(entry.date).getTime() <= relativeToTime);
    filteredData = dataUpToDate.slice(-days);
  } else {
    filteredData = validData.slice(-days);
  }

  return filteredData.map(entry => {
    const rawValue = entry[fieldName];
    return {
      date: entry.date,
      value: typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue))
    };
  });
}

export function useTrendData(metricLabel: string, enabled: boolean = true, relativeTo?: string) {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !metricLabel || !METRIC_FIELD_MAP[metricLabel]) {
      setTrendData([]);
      return;
    }

    // Include relativeTo in cache key to ensure different date selections have separate cache entries
    const cacheKey = relativeTo ? `${metricLabel}-7d-${relativeTo}` : `${metricLabel}-7d`;
    
    // Check cache first
    const cached = trendDataCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTrendData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    fetchHistoricalData()
      .then(historicalData => {
        const trendPoints = extractTrendData(historicalData, metricLabel, 7, relativeTo);
        
        // Enhanced data point cleaning for chart reliability
        const cleanTrendPoints = trendPoints.filter(point => (
            point.date &&
            !isNaN(point.value) &&
            isFinite(point.value) &&
            point.value >= 0 &&
            point.value <= 1e12
        ));
        
        // Show trends with any available data (minimum 3 data points for a basic trend)
        if (cleanTrendPoints.length >= 3) {
          // Cache the result
          trendDataCache[cacheKey] = {
            data: cleanTrendPoints,
            timestamp: Date.now()
          };
          
          setTrendData(cleanTrendPoints);
        } else {
          setTrendData([]);
        }
        
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setTrendData([]);
        setLoading(false);
      });

  }, [metricLabel, enabled, relativeTo]);

  return { trendData, loading, error };
}

// Helper function to check if a metric supports trends
export function hasTimeSeriesData(metricLabel: string): boolean {
  return metricLabel in METRIC_FIELD_MAP;
}