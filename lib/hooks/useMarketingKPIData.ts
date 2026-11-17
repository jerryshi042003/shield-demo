import { useState, useEffect, useCallback } from 'react';
import { logSilentError } from '@/lib/utils/logger';
import type { MarketingPageData, SocialPlatform } from '@/docs/data-contracts';

export interface MarketingKPIData {
  // Marketing KPI fields
  APPU?: number;
  APPU_Goal_Pacing?: number;
  app_yoy_user?: number;
  TSI_Impressions?: number;
  TSI_Goal_Pacing?: number;
  TSI_yoy?: number;
  FDG_Season_To_Date?: number;
  FDG_Goal_Pacing?: number;
  fan_growth_yoy?: number;

  // Social Media Platform fields
  FBI?: number;  // Facebook Impressions
  FBE?: number;  // Facebook Engagement
  IGI?: number;  // Instagram Impressions
  IGE?: number;  // Instagram Engagement
  TWI?: number;  // Twitter Impressions
  TWE?: number;  // Twitter Engagement
  TTI?: number;  // TikTok Impressions
  TTE?: number;  // TikTok Engagement
  YTI?: number;  // YouTube Impressions
  YTE?: number;  // YouTube Engagement

  // Metadata
  date?: string;
  last_updated?: string;
  _fallback?: boolean;
  _error?: string;
  _meta?: {
    date: string;
    lastUpdated: string;
    source: string;
  };
}

interface UseMarketingKPIDataReturn {
  data: MarketingKPIData | null;
  loading: boolean;
  refetch: () => void;
  debugInfo?: Record<string, unknown> | null;
}

// Default fallback data structure
const defaultFallbackData: MarketingKPIData = {
  APPU: 0,
  TSI_Impressions: 0,
  FDG_Season_To_Date: 0,
  FBI: 0,
  FBE: 0,
  IGI: 0,
  IGE: 0,
  TWI: 0,
  TWE: 0,
  TTI: 0,
  TTE: 0,
  YTI: 0,
  YTE: 0,
  date: new Date().toISOString().split('T')[0],
  _fallback: true,
  _meta: {
    date: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    source: 'fallback-default',
  }
};

/**
 * Helper function to find a social platform by name (case-insensitive)
 */
function findPlatform(platforms: SocialPlatform[], name: string): SocialPlatform | undefined {
  return platforms.find(p => p.platformName.toLowerCase() === name.toLowerCase());
}

/**
 * Adapts the new nested MarketingPageData contract (from Shield blob storage)
 * to the legacy flat MarketingKPIData contract expected by the UI.
 *
 * This adapter enables migration testing without rewriting UI components.
 */
function adaptMarketingPageData(newData: MarketingPageData): MarketingKPIData {
  // Extract social platform data
  const facebook = findPlatform(newData.socialPlatforms, 'Facebook');
  const instagram = findPlatform(newData.socialPlatforms, 'Instagram');
  const twitter = findPlatform(newData.socialPlatforms, 'Twitter');
  const tiktok = findPlatform(newData.socialPlatforms, 'TikTok');
  const youtube = findPlatform(newData.socialPlatforms, 'YouTube');

  return {
    // App Power Users
    APPU: newData.kpis.appPowerUsers.value,
    APPU_Goal_Pacing: newData.kpis.appPowerUsers.goalPacing,
    app_yoy_user: newData.kpis.appPowerUsers.trend?.percentChange,

    // Social Impressions
    TSI_Impressions: newData.kpis.socialImpressions.value,
    TSI_Goal_Pacing: newData.kpis.socialImpressions.goalPacing,
    TSI_yoy: newData.kpis.socialImpressions.trend?.percentChange,

    // Fan Database Growth
    FDG_Season_To_Date: newData.kpis.fanGrowth.value,
    FDG_Goal_Pacing: newData.kpis.fanGrowth.goalPacing,
    fan_growth_yoy: newData.kpis.fanGrowth.trend?.percentChange,

    // Social Media Platforms
    FBI: facebook?.impressions,
    FBE: facebook?.engagementRate,
    IGI: instagram?.impressions,
    IGE: instagram?.engagementRate,
    TWI: twitter?.impressions,
    TWE: twitter?.engagementRate,
    TTI: tiktok?.impressions,
    TTE: tiktok?.engagementRate,
    YTI: youtube?.impressions,
    YTE: youtube?.engagementRate,

    // Metadata
    date: newData.lastUpdated.split('T')[0],
    last_updated: newData.lastUpdated,
    _meta: {
      date: newData.lastUpdated.split('T')[0],
      lastUpdated: newData.lastUpdated,
      source: 'shield-blob-marketing-contract',
    }
  };
}

export function useMarketingKPIData(selectedDate?: string, franchise: string = 'LAK'): UseMarketingKPIDataReturn {
  const [data, setData] = useState<MarketingKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setDebugInfo(null);

      // Check if we should use new Shield blob storage
      const useBlobStorage = process.env.NEXT_PUBLIC_USE_BLOB_STORAGE === 'true';

      let url: string;
      let isNewContract = false;

      if (useBlobStorage) {
        // Fetch from Shield API proxy (new contract)
        url = `/api/shield-marketing?franchise=${encodeURIComponent(franchise)}`;
        isNewContract = true;
      } else {
        // Use legacy API proxy for Crown blob storage data
        url = selectedDate
          ? `/api/kpi-data?type=marketing&date=${selectedDate}&franchise=${encodeURIComponent(franchise)}`
          : `/api/kpi-data?type=marketing&franchise=${encodeURIComponent(franchise)}`;
      }

      // Fetch from API proxy
      // Let browser use cache based on server's Cache-Control headers (5 min fresh, 10 min stale-while-revalidate)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      // Capture debug information
      const debugData = {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
        type: response.type,
        redirected: response.redirected,
      };

      setDebugInfo(debugData);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read response body');
        throw new Error(`HTTP ${response.status} (${response.statusText}): ${errorText}`);
      }

      let rawData: MarketingKPIData;

      if (isNewContract) {
        // Parse new nested contract and adapt to flat structure
        const newContractData = (await response.json()) as MarketingPageData;
        rawData = adaptMarketingPageData(newContractData);
      } else {
        // Parse legacy flat contract directly
        rawData = (await response.json()) as MarketingKPIData;

        // Check if this is fallback data from server error
        if (rawData._fallback) {
          // Log silently but don't expose to user
          logSilentError('Shield Marketing blob storage error', new Error(rawData._error ?? 'Unknown error'), {
            component: 'useMarketingKPIData',
            url,
            selectedDate,
            franchise
          });
        }
      }

      // More robust check for real loaded data
      const hasRealData = isNewContract ? (
        // For new contract, just check if we have the core KPI values
        (rawData.APPU !== undefined) &&
        (rawData.TSI_Impressions !== undefined) &&
        (rawData.FDG_Season_To_Date !== undefined)
      ) : (
        // For legacy contract, check key fields
        (rawData.APPU !== undefined || rawData.TSI_Impressions !== undefined) &&
        Boolean(rawData.date)
      );

      // If fallback data or incomplete real data, store it but continue rendering safely.
      if (rawData._fallback === true || !hasRealData) {
        setData(rawData);
        return;
      }

      setData(rawData);

    } catch (err) {
      // Log error silently for monitoring
      logSilentError('Failed to fetch Marketing KPI data', err instanceof Error ? err : new Error(String(err)), {
        component: 'useMarketingKPIData',
        url: selectedDate
          ? `/api/kpi-data?type=marketing&date=${selectedDate}&franchise=${encodeURIComponent(franchise)}`
          : `/api/kpi-data?type=marketing&franchise=${encodeURIComponent(franchise)}`,
        selectedDate,
        franchise
      });

      // Always provide fallback data so UI doesn't break
      setData({
        ...defaultFallbackData,
        _error: err instanceof Error ? err.message : String(err),
        _meta: {
          ...defaultFallbackData._meta!,
          source: 'marketing-error-fallback'
        }
      });

      // Store error details for debugging
      setDebugInfo({
        error: err instanceof Error ? err.message : String(err),
        errorType: err instanceof Error ? err.name : 'Unknown',
        timestamp: new Date().toISOString(),
      });

    } finally {
      setLoading(false);
    }
  }, [franchise, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    refetch: fetchData,
    debugInfo,
  };
}
