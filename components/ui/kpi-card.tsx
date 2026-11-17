'use client';

import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InfoIconButton } from '@/components/ui/info-icon-button';
import { KPI_INFO_LINKS, POWER_BI_DASHBOARDS } from '@/data/kpiInfoLinks';
import { useState } from 'react';
import { HoverTrendChart } from '@/components/ui/HoverTrendChart';
import { useTrendDataForMetric, hasMetricTrendData } from '@/lib/hooks/useTrendDataForMetric';

// Type for KPI info structure
type DashboardLink = {
  name: string;
  description: string;
  url: string;
};

type KPIInfo = {
  title?: string;
  blurb: string;
  metrics?: string[];
  freshness: string;
  dashboards?: DashboardLink[];
  url?: string; // Backward compatibility
};

// Helper function to get KPI info for a specific metric in a specific section
function getKPIInfo(section: string, metricLabel: string): KPIInfo | null {
  if (!(section in KPI_INFO_LINKS)) return null;
  const sectionData = KPI_INFO_LINKS[section as keyof typeof KPI_INFO_LINKS];
  if (!(metricLabel in sectionData)) return null;
  return sectionData[metricLabel as keyof typeof sectionData] as KPIInfo;
}

export interface KPIMetric {
  label: string;
  value: string;
  subtitle?: string; // Additional info like revenue and ATP for ticket breakdowns
  delta?: number;
  baselineLabel?: string;
  goal?: {
    target: string;
    current: number;
    percentage: number;
  };
  navigationSection?: string;
  trendField?: string;
  trendFieldFallback?: string;
  trendData?: Array<{ date: string; value: number }>; // Direct trend data for products
}

interface KPICardProps {
  metrics: KPIMetric[];
  section?: string; // For animation keys: 'ticketing', 'sales', etc.
  onCardClick?: (metric: KPIMetric) => void; // Optional click handler for navigation
  detailedView?: boolean; // Whether to show delta badges
  league?: 'NHL' | 'AHL'; // Support both NHL and AHL
  selectedDate?: string; // Selected date for trend context
  gridCols?: string; // Custom grid columns (e.g., 'lg:grid-cols-5' for 5-column layout)
}

// Progress Bar Component for Goal Tracking
function ProgressBar({ goal }: { goal: { target: string; current: number; percentage: number } }) {
  // Check for TBD goal state (goal not yet set)
  if (goal.target === "TBD") {
    return (
      <div className="space-y-2">
        {/* Empty progress bar for TBD */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-200 h-2 rounded-full w-0" />
        </div>
        {/* TBD text */}
        <div className="text-xs text-gray-400 font-medium">
          Goal TBD
        </div>
      </div>
    );
  }

  // Don't show progress bar for "no data" states
  if (isNaN(goal.current) || goal.current === 0) {
    return (
      <div className="space-y-2">
        {/* Empty progress bar for no data */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-gray-300 h-2 rounded-full w-0" />
        </div>
        {/* No data text */}
        <div className="text-xs text-gray-500 font-medium">
          Goal: {goal.target} (No Data)
        </div>
      </div>
    );
  }

  // Determine progress bar color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(goal.percentage)}`}
          style={{ width: `${Math.min(goal.percentage, 100)}%` }}
        />
      </div>
      {/* Goal Text */}
      <div className="text-xs text-gray-600 font-medium">
        Goal: {goal.target} ({goal.percentage}%)
      </div>
    </div>
  );
}

function MetricCard({
  metric,
  index: _index,
  onCardClick: _onCardClick,
  detailedView = false,
  league: _league = 'NHL',
  section = 'overview',
  selectedDate
}: {
  metric: KPIMetric;
  index: number;
  onCardClick?: (metric: KPIMetric) => void;
  detailedView?: boolean;
  league?: 'NHL' | 'AHL'; // Support both NHL and AHL
  section?: string;
  selectedDate?: string;
}) {
  const [_isOpen, setIsOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showTrend, setShowTrend] = useState(false);

  // Use direct trend data if provided (for products), otherwise fetch via hook (for KPIs)
  const { data: fetchedTrendData, loading: trendLoading } = useTrendDataForMetric(
    metric.trendData ? undefined : metric.trendField, // Skip fetch if we have direct data
    metric.trendFieldFallback,
    selectedDate
  );

  const trendData = metric.trendData ?? fetchedTrendData;

  // Check if this metric has trend data available
  const hasTrendData = Boolean(metric.trendData) || hasMetricTrendData(metric.trendField);

  const info = getKPIInfo(section, metric.label) ?? {
    title: "Power BI Dashboards",
    blurb: `View detailed analytics for ${metric.label.replace(/\n/g, ' ')} in Power BI dashboards.`,
    freshness: "",
    dashboards: [POWER_BI_DASHBOARDS.KPI, POWER_BI_DASHBOARDS.TICKET_SALES],
    url: "#" // Backward compatibility
  };

  // Ensure all cards get the default dashboards if none are configured
  if (!info.dashboards || info.dashboards.length === 0) {
    info.dashboards = [POWER_BI_DASHBOARDS.KPI, POWER_BI_DASHBOARDS.TICKET_SALES];
  }

  // Check for missing Power BI link mapping (dev-only check)

  // All users have access - Azure Static Web Apps handles authentication

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Remove delay for immediate response
    setIsOpen(false);
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  };

  const cardContent = (
    <Card 
      className="border-0 rounded-lg shadow-sm h-36 relative hover:shadow-md transition-shadow duration-200"
      style={{ backgroundColor: '#ededed' }}
      // Only show delta badges in detailed mode
      delta={detailedView ? metric.delta : undefined}
      baselineLabel={detailedView ? metric.baselineLabel : undefined}
      onMouseEnter={() => setShowTrend(true)}
      onMouseLeave={() => setShowTrend(false)}
    >
      <CardContent 
        className="p-4 h-full flex flex-col justify-between"
      >
        {/* Metric Label - Top */}
        <div className="flex-shrink-0 mb-1">
          <div className="text-sm font-semibold text-gray-700 leading-snug">
            {metric.label.split('\n').map((line, index) => (
              <div key={index} className="block">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Value and Goal - Bottom */}
        <div className="flex-grow flex flex-col justify-end space-y-2">
          <div className="text-2xl font-bold text-gray-900 leading-none">
            {metric.value}
          </div>

          {/* Optional subtitle for additional info (e.g., revenue and ATP) */}
          {metric.subtitle && (
            <div className="text-xs text-gray-500 space-y-0.5">
              {metric.subtitle.split(' • ').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}

          {/* Show progress bar only for metrics with goals */}
          {metric.goal && (
            <div className="mt-1">
              <ProgressBar goal={metric.goal} />
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Real hover trend chart - only show if data is available and not loading */}
      {showTrend && hasTrendData && !trendLoading && trendData.length > 0 && (
        <div className="absolute top-0 left-full ml-2 z-50">
          <HoverTrendChart
            data={trendData}
            selectedDate={selectedDate}
            hideOnNoChange={Boolean(metric.trendData)}
          />
        </div>
      )}
      
      {/* Show info icon on all cards for v1 demo */}
      <div
        onMouseEnter={() => {
          handleMouseEnter();
          setShowTrend(false); // Disable card hover when showing info popup
        }}
        onMouseLeave={() => {
          handleMouseLeave();
          setShowTrend(true); // Re-enable card hover when leaving info icon
        }}
        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking info
      >
        <InfoIconButton>
          <div className="rounded-xl bg-white border border-gray-200 w-80 text-sm overflow-hidden">
            <div className="p-4">
              {/* Simple message */}
              <div className="text-gray-700 text-sm leading-relaxed">
                {info.blurb}
              </div>
            </div>

            {/* Power BI Dashboard Links */}
            <div 
              className="border-t border-gray-100 p-3 bg-gray-50"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {info.dashboards.length > 0 ? (
                <div className="space-y-2">
                  {info.dashboards.map((dashboard, index) => (
                    <a
                      key={index}
                      href={dashboard.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        handleMouseEnter();
                      }}
                      title={dashboard.description}
                    >
                      <span className="mr-2">
                        {dashboard.description}
                      </span>
                      <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              ) : info.url && info.url !== "#" ? (
                // Fallback for backward compatibility
                <a
                  href={info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    handleMouseEnter();
                  }}
                  title={info.title ? `Open ${info.title}` : 'Open Dashboard'}
                >
                  <span className="mr-2">
                    {info.title ? `Open ${info.title}` : 'Open Dashboard'}
                  </span>
                  <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <div className="text-center text-gray-500 text-sm py-2">
                  No dashboards available
                </div>
              )}
            </div>
          </div>
        </InfoIconButton>
      </div>
    </Card>
  );

  return cardContent;
}

export function KPICard({
  metrics,
  section = 'overview',
  onCardClick,
  detailedView = false,
  league = 'NHL',
  selectedDate,
  gridCols
}: KPICardProps) {
  const container = { show: { transition: { staggerChildren: 0 } } };
  const item = { hidden: { y: 0, opacity: 0 }, show: { y: 0, opacity: 1 } };

  // Use custom grid columns if provided, otherwise use default responsive grid
  const gridClassName = gridCols
    ? `grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={gridClassName}
    >
      {metrics.map((metric, index) => (
        <motion.div key={`${section}-${index}`} variants={item} className="h-full">
          <MetricCard
            metric={metric}
            index={index}
            onCardClick={onCardClick}
            detailedView={detailedView}
            league={league}
            section={section}
            selectedDate={selectedDate}
          />
        </motion.div>
      ))}
    </motion.div>
  );
} 