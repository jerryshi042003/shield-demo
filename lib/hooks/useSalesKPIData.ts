import { useState, useEffect, useCallback } from 'react';
import { logSilentError } from '@/lib/utils/logger';
import type { SalesPageData } from '@/docs/data-contracts';

interface SalesKPIData {
  // Sales KPI fields
  TSR?: number;
  TSR_Goal_Pacing?: number;
  TSR_YoY?: number;
  NFS_Season_To_Date?: number;
  NFS_Goal_Pacing?: number;
  ATP_avg_season?: number;
  ATP_Goal_Pacing?: number;
  ATP_YoY?: number;

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

interface UseSalesKPIDataReturn {
  data: SalesKPIData | null;
  loading: boolean;
  refetch: () => void;
  debugInfo?: Record<string, unknown> | null;
}

function hasNumericValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Default fallback data structure
const defaultFallbackData: SalesKPIData = {
  TSR: 0,
  NFS_Season_To_Date: 0,
  ATP_avg_season: 0,
  date: new Date().toISOString().split('T')[0],
  _fallback: true,
  _meta: {
    date: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString(),
    source: 'fallback-default',
  }
};

/**
 * Adapts the new nested SalesPageData contract (from Shield blob storage)
 * to the legacy flat SalesKPIData contract expected by the UI.
 *
 * This adapter enables migration testing without rewriting UI components.
 */
function adaptSalesPageData(newData: SalesPageData): SalesKPIData {
  return {
    // Ticket Sales Revenue
    TSR: newData.seasonKpis.ticketSalesRevenue.value,
    TSR_Goal_Pacing: newData.seasonKpis.ticketSalesRevenue.goalPacing,
    TSR_YoY: newData.seasonKpis.ticketSalesRevenue.trend?.percentChange,

    // New Full Season Equivalents
    NFS_Season_To_Date: newData.seasonKpis.newFSE.value,
    NFS_Goal_Pacing: newData.seasonKpis.newFSE.goalPacing,

    // Average Ticket Price
    ATP_avg_season: newData.seasonKpis.avgTicketPrice.value,
    ATP_Goal_Pacing: newData.seasonKpis.avgTicketPrice.goalPacing,
    ATP_YoY: newData.seasonKpis.avgTicketPrice.trend?.percentChange,

    // Metadata
    date: newData.lastUpdated.split('T')[0],
    last_updated: newData.lastUpdated,
    _meta: {
      date: newData.lastUpdated.split('T')[0],
      lastUpdated: newData.lastUpdated,
      source: 'shield-blob-sales-contract',
    }
  };
}

export function useSalesKPIData(selectedDate?: string, enabled: boolean = true): UseSalesKPIDataReturn {
  const [data, setData] = useState<SalesKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setDebugInfo(null);

      // Check if we should use new Shield blob storage
      const useBlobStorage = process.env.NEXT_PUBLIC_USE_BLOB_STORAGE === 'true';

      let url: string;
      let isNewContract = false;

      if (useBlobStorage) {
        // Fetch from Shield API proxy (new contract)
        url = '/api/shield-sales';
        isNewContract = true;
      } else {
        // Use legacy API proxy for Crown blob storage data
        url = selectedDate ? `/api/kpi-data?type=sales&date=${selectedDate}` : '/api/kpi-data?type=sales';
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

      let rawData: SalesKPIData;

      if (isNewContract) {
        // Parse new nested contract and adapt to flat structure
        const newContractData = (await response.json()) as SalesPageData;
        rawData = adaptSalesPageData(newContractData);
      } else {
        // Parse legacy flat contract directly
        rawData = (await response.json()) as SalesKPIData;

        // Check if this is fallback data from server error
        if (rawData._fallback) {
          // Log silently but don't expose to user
          logSilentError('Shield Sales blob storage error', new Error(rawData._error ?? 'Unknown error'), {
            component: 'useSalesKPIData',
            url,
            selectedDate
          });
        }
      }

      // More robust check for real loaded data
      const hasRealData = isNewContract ? (
        // For new contract, just check if we have the core KPI values
        hasNumericValue(rawData.TSR) &&
        hasNumericValue(rawData.NFS_Season_To_Date) &&
        hasNumericValue(rawData.ATP_avg_season)
      ) : (
        // For legacy contract, check key fields
        hasNumericValue(rawData.TSR) &&
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
      logSilentError('Failed to fetch Sales KPI data', err instanceof Error ? err : new Error(String(err)), {
        component: 'useSalesKPIData',
        url: selectedDate ? `/api/kpi-data?type=sales&date=${selectedDate}` : '/api/kpi-data?type=sales',
        selectedDate
      });

      // Always provide fallback data so UI doesn't break
      setData({
        ...defaultFallbackData,
        _error: err instanceof Error ? err.message : String(err),
        _meta: {
          ...defaultFallbackData._meta!,
          source: 'sales-error-fallback'
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
    debugInfo,
  };
}
