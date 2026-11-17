import { useState, useEffect, useCallback } from 'react';
import { logSilentError } from '@/lib/utils/logger';
import type { OverviewPageData } from '@/docs/data-contracts';

export interface OverviewKPIData {
  // Raw KPI fields from Crown blob storage
  TSR?: number;
  TPR_Total?: number;
  TotalFantoDate?: number;
  TotalFansToDate?: number;
  TSI_Impressions?: number;
  APPU?: number;
  UWU?: number;
  APPS?: number;
  UWS?: number;
  GAS_season_avg?: number;
  GAP_season_avg?: number;
  ATP_avg_season?: number;
  NFS_Season_To_Date?: number;
  FDG_Season_To_Date?: number;
  curr_season_TRM_avg?: number;
  curr_season_viewership_avg?: number;
  curr_season_tv_ratings_avg?: number;
  curr_season_HD_rev?: number;
  FBI?: number;
  IGI?: number;
  TWI?: number;
  TTI?: number;
  YTI?: number;

  // Goal pacing fields
  TSR_Goal_Pacing?: number;
  TPR_Goal_Pacing?: number;
  TKF_Goal_Pacing?: number;
  TSI_Goal_Pacing?: number;
  APPU_Goal_Pacing?: number;
  UWU_Goal_Pacing?: number;
  GAS_Goal_Pacing?: number;
  GAP_Goal_Pacing?: number;
  ATP_Goal_Pacing?: number;
  NFS_Goal_Pacing?: number;
  FDG_Goal_Pacing?: number;
  TRM_Goal_Pacing?: number;
  TTV_Goal_Pacing?: number;
  TVR_Goal_Pacing?: number;
  hdr_Goal_Pacing?: number;
  FBI_Goal_Pacing?: number;
  IGI_Goal_Pacing?: number;
  XI_Goal_Pacing?: number;
  TTI_Goal_Pacing?: number;
  YTI_Goal_Pacing?: number;

  // YoY fields
  TSR_YoY?: number;
  TSI_yoy?: number;
  app_yoy_user?: number;
  app_yoy_session?: number;
  web_yoy_user?: number;
  web_yoy_session?: number;
  GAS_YoY?: number;
  ATP_YoY?: number;
  trm_yoy?: number;
  viewership_yoy?: number;
  tvr_yoy?: number;
  fan_growth_yoy?: number;

  // Social media engagement rates
  FBE?: number;
  IGE?: number;
  TWE?: number;
  TTE?: number;
  YTE?: number;

  // Metadata
  date?: string;
  last_updated?: string;
  _fallback?: boolean;
  _error?: string;
  _meta?: {
    date: string;
    lastUpdated: string;
    source: string;
    missingEngagementFields: string[];
    hasCompleteEngagementData: boolean;
  };
}

interface UseOverviewKPIDataReturn {
  data: OverviewKPIData | null;
  loading: boolean;
  refetch: () => void;
  debugInfo?: Record<string, unknown> | null;
}

function hasNumericValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Default fallback data structure
const defaultFallbackData: OverviewKPIData = {
  TSR: 0,
  TPR_Total: 0,
  TotalFantoDate: 0,
  TSI_Impressions: 0,
  APPU: 0,
  UWU: 0,
  APPS: 0,
  UWS: 0,
  GAS_season_avg: 0,
  GAP_season_avg: 0,
  ATP_avg_season: 0,
  NFS_Season_To_Date: 0,
  FDG_Season_To_Date: 0,
  curr_season_TRM_avg: 0,
  curr_season_viewership_avg: 0,
  curr_season_tv_ratings_avg: 0,
  curr_season_HD_rev: 0,
  FBI: 0,
  IGI: 0,
  TWI: 0,
  TTI: 0,
  YTI: 0,
  date: new Date().toISOString().split('T')[0],
  _fallback: true,
  _meta: {
    date: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    source: 'fallback-default',
    missingEngagementFields: ['TotalFantoDate', 'APPU', 'UWU'],
    hasCompleteEngagementData: false
  }
};

/**
 * Adapts the new nested OverviewPageData contract (from Shield blob storage)
 * to the legacy flat OverviewKPIData contract expected by the UI.
 *
 * This adapter enables migration testing without rewriting UI components.
 */
function adaptOverviewPageData(newData: OverviewPageData): OverviewKPIData {
  return {
    // Ticket Sales Revenue
    TSR: newData.kpis.ticketSalesRevenue.value,
    TSR_Goal_Pacing: newData.kpis.ticketSalesRevenue.goalPacing,
    TSR_YoY: newData.kpis.ticketSalesRevenue.trend?.percentChange,

    // New Full Season Equivalents
    NFS_Season_To_Date: newData.kpis.newFSE.value,
    NFS_Goal_Pacing: newData.kpis.newFSE.goalPacing,

    // Fan Database Growth
    FDG_Season_To_Date: newData.kpis.fanGrowth.value,
    FDG_Goal_Pacing: newData.kpis.fanGrowth.goalPacing,
    fan_growth_yoy: newData.kpis.fanGrowth.trend?.percentChange,

    // Metadata
    date: newData.lastUpdated.split('T')[0],
    last_updated: newData.lastUpdated,
    _meta: {
      date: newData.lastUpdated.split('T')[0],
      lastUpdated: newData.lastUpdated,
      source: 'shield-blob-overview-contract',
      missingEngagementFields: [],
      hasCompleteEngagementData: true
    }
  };
}

export function useOverviewKPIData(selectedDate?: string, franchise: string = 'LAK'): UseOverviewKPIDataReturn {
  const [data, setData] = useState<OverviewKPIData | null>(null);
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
        url = `/api/shield-overview?franchise=${encodeURIComponent(franchise)}`;
        isNewContract = true;
      } else {
        // Use legacy API proxy for Crown blob storage data
        url = selectedDate
          ? `/api/kpi-data?type=overview&date=${selectedDate}&franchise=${encodeURIComponent(franchise)}`
          : `/api/kpi-data?type=overview&franchise=${encodeURIComponent(franchise)}`;
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

      let rawData: OverviewKPIData;

      if (isNewContract) {
        // Parse new nested contract and adapt to flat structure
        const newContractData = (await response.json()) as OverviewPageData;
        rawData = adaptOverviewPageData(newContractData);
      } else {
        // Parse legacy flat contract directly
        rawData = (await response.json()) as OverviewKPIData;

        // Check if this is fallback data from server error
        if (rawData._fallback) {
          // Log silently but don't expose to user
          logSilentError('Crown Azure Blob Storage error', new Error(rawData._error ?? 'Unknown error'), {
            component: 'useOverviewKPIData',
            url,
            selectedDate,
            franchise
          });
        }
      }

      // More robust check for real loaded data - multiple indicators
      const hasRealData = isNewContract ? (
        // For new contract, just check if we have the core KPI values
        hasNumericValue(rawData.TSR) &&
        hasNumericValue(rawData.NFS_Season_To_Date) &&
        hasNumericValue(rawData.FDG_Season_To_Date)
      ) : (
        // For legacy contract, use original validation
        // Check multiple key revenue fields
        hasNumericValue(rawData.TSR) &&
        // Check at least one engagement field has real data
        (hasNumericValue(rawData.TotalFantoDate) ||
          hasNumericValue(rawData.APPU) ||
          hasNumericValue(rawData.UWU)) &&
        // Check at least one awareness field has real data
        (hasNumericValue(rawData.FBI) ||
          hasNumericValue(rawData.IGI) ||
          hasNumericValue(rawData.TWI)) &&
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
      logSilentError('Failed to fetch Crown overview data', err instanceof Error ? err : new Error(String(err)), {
        component: 'useOverviewKPIData',
        url: selectedDate
          ? `/api/kpi-data?type=overview&date=${selectedDate}&franchise=${encodeURIComponent(franchise)}`
          : `/api/kpi-data?type=overview&franchise=${encodeURIComponent(franchise)}`,
        selectedDate,
        franchise
      });

      // Always provide fallback data so UI doesn't break
      setData({
        ...defaultFallbackData,
        _error: err instanceof Error ? err.message : String(err),
        _meta: {
          ...defaultFallbackData._meta!,
          source: 'crown-error-fallback'
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
