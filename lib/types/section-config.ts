import type { ChartName } from '@/components/charts/ChartRegistry';
import type { LucideIcon } from 'lucide-react';

export interface ChartConfig {
  component: ChartName;
  props: Record<string, unknown>;
  layout?: 'full-width' | 'grid' | 'custom';
}

export interface SectionGroup {
  title: string;
  description?: string;
  charts: ChartName[]; // References existing chart.component names
  styling?: {
    priority?: 'critical' | 'warning' | 'normal';
    icon?: LucideIcon; // Lucide React component
  };
}

export interface SectionConfig {
  name: string;
  kpiDataKey?: string; // e.g., "salesKPIs", "marketingKPIs" - optional for sections without KPI cards
  charts: ChartConfig[];
  sectionGroups?: SectionGroup[]; // New optional field
}

export interface KPIMetric {
  label: string;
  value: string;
  delta?: number;
  baselineLabel?: string;
} 