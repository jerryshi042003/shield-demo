import { formatNumber } from '@/lib/utils/format';
import { safeNumber, safeGoalPercentage, safeGoalTarget, safeDelta } from '@/lib/utils/safeNumber';

interface KPIFields {
  TSR?: number;
  TSR_Goal_Pacing?: number;
  TSR_YoY?: number;
  NFS_Season_To_Date?: number;
  NFS_Goal_Pacing?: number;
  FDG_Season_To_Date?: number;
  FDG_Goal_Pacing?: number;
  fan_growth_yoy?: number;
  ATP_avg_season?: number;
  ATP_Goal_Pacing?: number;
}

/**
 * Formatting utility functions for metrics across different dashboard sections.
 * Extracted from useDashboardMetrics hook for better separation of concerns.
 */

/**
 * Format overview metrics using the KPI dashboard data structure.
 * Returns core metrics for the Overview page: TSR, New FSE, and Fan Growth.
 */
export const formatOverviewMetrics = (data: KPIFields) => {
  // Core 3 metrics for the Sales Health Check
  const coreMetrics = [
    // 1. Total Season Revenue (from TSR)
    {
      label: "Ticket Sales\nRevenue",
      value: safeNumber(data.TSR) !== '---' ? formatNumber(safeNumber(data.TSR) as number, '$') : '---',
      goal: safeNumber(data.TSR) !== '---' && safeNumber(data.TSR_Goal_Pacing) !== '---' ? {
        target: safeGoalTarget(data.TSR, data.TSR_Goal_Pacing, '$'),
        current: safeNumber(data.TSR) as number,
        percentage: safeGoalPercentage(data.TSR_Goal_Pacing)
      } : undefined,
      trendField: 'TSR'
    },
    // 2. New Full Season Equivalents (from NFS_Season_To_Date)
    {
      label: "New FSE",
      value: safeNumber(data.NFS_Season_To_Date) !== '---' ? formatNumber(Math.round(safeNumber(data.NFS_Season_To_Date) as number)) : '---',
      goal: safeNumber(data.NFS_Season_To_Date) !== '---' && safeNumber(data.NFS_Goal_Pacing) !== '---' ? {
        target: safeGoalTarget(data.NFS_Season_To_Date, data.NFS_Goal_Pacing),
        current: safeNumber(data.NFS_Season_To_Date) as number,
        percentage: safeGoalPercentage(data.NFS_Goal_Pacing)
      } : undefined,
      trendField: 'NFS_Season_To_Date'
    },
    // 3. Fan Growth (from FDG_Season_To_Date with FDG goal pacing + fan_growth_yoy)
    {
      label: "Fan Growth",
      value: safeNumber(data.FDG_Season_To_Date) !== '---' ? formatNumber(safeNumber(data.FDG_Season_To_Date) as number) : '---',
      goal: safeNumber(data.FDG_Season_To_Date) !== '---' ? (
        typeof safeNumber(data.FDG_Goal_Pacing) === 'number' && (safeNumber(data.FDG_Goal_Pacing) as number) > 0 ? {
          target: safeGoalTarget(data.FDG_Season_To_Date, data.FDG_Goal_Pacing),
          current: safeNumber(data.FDG_Season_To_Date) as number,
          percentage: safeGoalPercentage(data.FDG_Goal_Pacing)
        } : {
          target: "TBD",
          current: safeNumber(data.FDG_Season_To_Date) as number,
          percentage: 0
        }
      ) : undefined,
      delta: safeDelta(data.fan_growth_yoy),
      baselineLabel: "vs last year",
      trendField: 'FDG_Season_To_Date'
    }
  ];

  return {
    coreMetrics // Single array with 3 core metrics
  };
};

// Keep the old function name as an alias for backward compatibility
export const formatPreseasonOverviewMetrics = formatOverviewMetrics;

/**
 * Format sales metrics for the Sales page.
 * Returns TSR, New FSE, and ATP metrics.
 */
export const formatSalesMetrics = (data: KPIFields) => {
  // Revenue Section - Same 3 metrics as overview page
  return [
    {
      label: "Ticket Sales\nRevenue",
      value: safeNumber(data.TSR) !== '---' ? formatNumber(safeNumber(data.TSR) as number, '$') : '---',
      goal: safeNumber(data.TSR) !== '---' && safeNumber(data.TSR_Goal_Pacing) !== '---' ? {
        target: safeGoalTarget(data.TSR, data.TSR_Goal_Pacing, '$'),
        current: safeNumber(data.TSR) as number,
        percentage: safeGoalPercentage(data.TSR_Goal_Pacing)
      } : undefined,
      trendField: 'TSR'
    },
    {
      label: "New FSE",
      value: safeNumber(data.NFS_Season_To_Date) !== '---' ? formatNumber(Math.round(safeNumber(data.NFS_Season_To_Date) as number)) : '---',
      goal: safeNumber(data.NFS_Season_To_Date) !== '---' && safeNumber(data.NFS_Goal_Pacing) !== '---' ? {
        target: safeGoalTarget(data.NFS_Season_To_Date, data.NFS_Goal_Pacing),
        current: safeNumber(data.NFS_Season_To_Date) as number,
        percentage: safeGoalPercentage(data.NFS_Goal_Pacing)
      } : undefined,
      trendField: 'NFS_Season_To_Date'
    },
    {
      label: "ATP",
      value: safeNumber(data.ATP_avg_season) !== '---' ? formatNumber(safeNumber(data.ATP_avg_season) as number, '$') : '—',
      subtitle: safeNumber(data.ATP_avg_season) === '---' ? 'Season not started' : undefined,
      goal: safeNumber(data.ATP_avg_season) !== '---' ? (
        typeof safeNumber(data.ATP_Goal_Pacing) === 'number' && (safeNumber(data.ATP_Goal_Pacing) as number) > 0 ? {
          target: safeGoalTarget(data.ATP_avg_season, data.ATP_Goal_Pacing, '$'),
          current: safeNumber(data.ATP_avg_season) as number,
          percentage: safeGoalPercentage(data.ATP_Goal_Pacing)
        } : {
          target: "TBD",
          current: safeNumber(data.ATP_avg_season) as number,
          percentage: 0
        }
      ) : undefined,
      trendField: 'ATP_avg_season'
    }
  ];
};

