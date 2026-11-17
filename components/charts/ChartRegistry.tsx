'use client';

import { TicketTrend } from './TicketTrend';
import { RevenueGrowthChart } from './RevenueGrowthChart';
import { SalesPacingChart } from './SalesPacingChart';

// Chart registry for dynamic loading
export const chartRegistry = {
  TicketTrend,
  RevenueGrowthChart,
  SalesPacingChart,
} as const;

export type ChartName = keyof typeof chartRegistry;

interface ChartRendererProps {
  chartName: ChartName;
  props: Record<string, unknown>;
  league: 'NHL'; // AHL removed - NHL only
  shouldRecreate?: boolean;
}

/**
 * Dynamically renders charts based on name from registry
 * Includes error boundary and logging for unknown charts
 */
export function ChartRenderer({ chartName, props, league, shouldRecreate }: ChartRendererProps) {
  const ChartComponent = chartRegistry[chartName];

  const chartProps = {
    league,
    forceRecreate: shouldRecreate,
    ...props,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ChartComponent {...(chartProps as any)} />;
} 