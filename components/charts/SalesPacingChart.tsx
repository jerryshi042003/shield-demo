import { useEffect, useState, useRef, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Scatter } from 'recharts';
import { useSalesPacing, SalesPacingDataPoint } from '@/lib/hooks/useSalesPacing';
import { formatCurrency, formatCurrencyPrecise } from '@/lib/utils/format';
import { ExternalLink } from 'lucide-react';
import { InfoIconButton } from '@/components/ui/info-icon-button';
import { POWER_BI_DASHBOARDS } from '@/data/kpiInfoLinks';

interface SalesPacingChartProps {
  className?: string;
  forceRecreate?: boolean;
}

// Utility function to format variance display
const formatVarianceDisplay = (deltaAmount: number | null, variancePercent: number | null): string => {
  if (deltaAmount === null || variancePercent === null) return '';
  
  if (isNaN(variancePercent)) {
    return '';
  }

  const arrow = deltaAmount >= 0 ? '▲' : '▼';
  const sign = deltaAmount >= 0 ? '+' : '';

  return `${arrow} ${sign}${formatCurrencyPrecise(Math.abs(deltaAmount))} (${sign}${variancePercent.toFixed(1)}%) vs Goal`;
};

// Get color class for variance display
const getVarianceColorClass = (deltaAmount: number | null): string => {
  if (deltaAmount === null) return 'text-gray-500';
  return deltaAmount >= 0 ? 'text-green-600' : 'text-red-600';
};

// Format date for executive readability
const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

interface TooltipPayloadEntry {
  name: string;
  value: number | null;
  color: string;
  dataKey: string;
  payload?: {
    deltaAmount: number | null;
    variancePercent: number | null;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    const isMaxDot = payload.some((entry) => entry.dataKey === 'maxExpectedDot');

    if (isMaxDot) {
      const maxValue = payload.find((entry) => entry.dataKey === 'maxExpectedDot')?.value;
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{formatDateForDisplay(label ?? '')}</p>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            Goal Pacing: {formatCurrencyPrecise(maxValue ?? 0)}
          </p>
        </div>
      );
    }

    const dataPoint = payload[0]?.payload;
    const hasVariance = dataPoint?.deltaAmount !== null && dataPoint?.variancePercent !== null;

    return (
      <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{formatDateForDisplay(label ?? '')}</p>
        {payload
          .filter((entry) => !entry.name.startsWith('Today'))
          .sort((a, b) => {
            if (a.name === 'Goal Pacing') return -1;
            if (b.name === 'Goal Pacing') return 1;
            if (a.name === 'Actual Revenue') return 1;
            if (b.name === 'Actual Revenue') return -1;
            return 0;
          })
          .map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {(() => {
              if (entry.value === null || isNaN(entry.value)) {
                return '---';
              }
              return formatCurrencyPrecise(entry.value);
            })()}
          </p>
        ))}
        {hasVariance && dataPoint && (
          <p className={`text-sm mt-2 font-medium ${
            getVarianceColorClass(dataPoint.deltaAmount)
          }`}>
            {formatVarianceDisplay(dataPoint.deltaAmount, dataPoint.variancePercent)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function SalesPacingChart({
  className = '',
  forceRecreate = false
}: SalesPacingChartProps) {
  const [renderKey, setRenderKey] = useState(0);
  const mountTimeRef = useRef(Date.now());
  const { data, loading, error } = useSalesPacing();

  // Get latest variance for persistent display (use latest point with actual data)
  const latestDataPoint = data.length > 0 ? data.slice().reverse().find(d => d.actualRevenue !== null) ?? data[data.length - 1] : null;
  const hasLatestVariance = latestDataPoint?.deltaAmount !== null && latestDataPoint?.variancePercent !== null;

  // Force recreation when needed
  useEffect(() => {
    if (forceRecreate) {
      mountTimeRef.current = Date.now();
      setRenderKey(prev => prev + 1);
    }
  }, [data, forceRecreate]);

  // Generate unique key for this render
  const chartKey = `sales-pacing-chart-${renderKey}-${mountTimeRef.current}`;
  
  // Format Y-axis currency values
  const formatYAxisTick = (value: number) => {
    if (isNaN(value)) {
      return '$0';
    }

    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  // Calculate optimal Y-axis domain
  const yAxisDomain = useMemo((): [number, number] => {
    if (!data.length) {
      // Reasonable default range for sales data when no data available
      return [0, 10000000]; // $0 to $10M default
    }
    
    const values = data.reduce((acc: number[], point) => {
      if (point.actualRevenue !== null) acc.push(point.actualRevenue);
      if (point.goalPacing) acc.push(point.goalPacing);
      return acc;
    }, []);
    
    if (values.length === 0) {
      // Reasonable default range when no valid values
      return [0, 10000000]; // $0 to $10M default
    }
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Smart padding based on scale of the data
    const range = maxValue - minValue;
    let padding: number;
    
    if (maxValue < 5000000) { // Under $5M - use smaller padding
      padding = Math.max(range * 0.15, 500000); // 15% or $500K minimum
    } else if (maxValue < 25000000) { // $5M to $25M - moderate padding  
      padding = Math.max(range * 0.1, 1000000); // 10% or $1M minimum
    } else { // Over $25M - larger absolute padding
      padding = Math.max(range * 0.08, 2000000); // 8% or $2M minimum
    }
    
    const rangeStart = Math.max(0, minValue - padding);
    const rangeEnd = maxValue + padding;
    
    return [rangeStart, rangeEnd];
  }, [data]);


  // Calculate reference line dates
  const seasonEndDateString = useMemo(() => {
    const seasonEnd = new Date(2026, 4, 31); // May 31, 2026
    return seasonEnd.toISOString().split('T')[0];
  }, []);

  // Calculate Max Cumulative Goal Pacing Dot using raw values for precision
  const maxExpectedDot = useMemo(() => {
    if (!data.length) return null;
    
    let maxRawValue = 0;
    let maxPoint: SalesPacingDataPoint | null = null;
    const epsilon = 1e-10; // High precision comparison threshold
    
    for (const point of data) {
      if (point.rawExpectedRevenue !== null) {
        // Use >= to capture first occurrence of tied maximums, with epsilon for floating point precision
        if (point.rawExpectedRevenue > maxRawValue || Math.abs(point.rawExpectedRevenue - maxRawValue) < epsilon) {
          if (point.rawExpectedRevenue > maxRawValue) {
            maxRawValue = point.rawExpectedRevenue;
            maxPoint = point;
          } else {
            // First tied maximum
            maxPoint ??= point;
          }
        }
      }
    }
    
    
    return maxPoint;
  }, [data]);

  // Prepare chart data with max dot indicator using raw values
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      maxExpectedDot: point.dateString === maxExpectedDot?.dateString ? maxExpectedDot.rawExpectedRevenue : null
    }));
  }, [data, maxExpectedDot]);

  // Format X-axis tick labels
  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${month} '${year}`;
  };

  // Calculate optimal tick interval to prevent flicker
  const tickInterval = useMemo(() => {
    const dataLength = chartData.length;
    if (dataLength === 0) return 0;
    // Show approximately 7-8 evenly-spaced ticks across the x-axis
    return Math.floor(dataLength / 7);
  }, [chartData.length]);

  // Show loading skeleton while data is loading OR if data has no valid revenue points
  // This prevents rendering empty axes, markers, or trajectories with partial/invalid data
  const hasValidData = data.length > 0 && data.some(d => d.actualRevenue !== null || d.goalPacing !== null);

  if (loading || !hasValidData) {
    return (
      <div className="border-0 rounded-lg shadow-sm p-6" style={{ backgroundColor: '#ededed' }}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-0 rounded-lg shadow-sm p-6" style={{ backgroundColor: '#ededed' }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Pacing</h3>
        <div className="flex items-center justify-center h-80 text-gray-500">
          Sales pacing data unavailable: {error}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="border-0 rounded-lg shadow-sm p-6" style={{ backgroundColor: '#ededed' }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Pacing</h3>
        <div className="flex items-center justify-center h-80 text-gray-500">
          No sales pacing data available
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative border-0 rounded-lg shadow-sm p-6 ${className}`}
      style={{ backgroundColor: '#ededed' }}
    >
      {/* Persistent variance display */}
      {hasLatestVariance && latestDataPoint && (
        <div className={`mb-4 text-sm font-semibold ${
          getVarianceColorClass(latestDataPoint.deltaAmount)
        }`}>
          {formatVarianceDisplay(latestDataPoint.deltaAmount, latestDataPoint.variancePercent)}
        </div>
      )}

      <ResponsiveContainer width="100%" height={400} debounce={100}>
        <ComposedChart 
          key={chartKey}
          data={chartData}
          margin={{ top: 20, right: 80, left: 60, bottom: 20 }}
        >
          <XAxis
            dataKey="dateString"
            tickFormatter={formatXAxisTick}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            interval={tickInterval}
            minTickGap={50}
          />

          <YAxis
            domain={yAxisDomain}
            tickFormatter={formatYAxisTick}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickCount={6}
            allowDecimals={false}
          />

          {/* Axis break indicator if Y-axis is truncated */}
          {yAxisDomain[0] > 0 && (
            <ReferenceLine
              y={yAxisDomain[0]}
              stroke="#9ca3af"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          {/* Legend positioned top-right inside chart */}
          <Legend
            wrapperStyle={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(237, 237, 237, 0.95)',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            align="right"
            verticalAlign="top"
            iconSize={12}
          />

          {/* Actual Revenue Line */}
          <Line
            type="monotone"
            dataKey="actualRevenue"
            name="Actual Revenue"
            stroke="#1e40af"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />

          {/* Goal Pacing Line - lighter gray dashed */}
          <Line
            type="monotone"
            dataKey="goalPacing"
            name="Goal Pacing"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
          />

          {/* Max Cumulative Goal Pacing Dot */}
          <Scatter
            dataKey="maxExpectedDot"
            name="Max Goal Pacing"
            fill="#8b5cf6"
            shape="circle"
            r={4}
            legendType="circle"
            isAnimationActive={false}
          />

          {/* Today indicator using Scatter with custom shape */}
          <Scatter
            dataKey="todayMarker"
            name="Today"
            fill="#f59e0b"
            shape={(props: { payload?: { todayMarker?: number }; cx?: number }) => {
              const { payload, cx } = props;
              if (!payload?.todayMarker) return <g />;
              
              // Calculate chart dimensions for full-height line
              const chartHeight = 400 - 40; // ResponsiveContainer height minus margins
              const topMargin = 20;
              const bottomMargin = 20;
              const availableHeight = chartHeight - topMargin - bottomMargin;
              
              // Calculate line positions from top to bottom of chart area
              const lineTop = topMargin;
              const lineBottom = topMargin + availableHeight;
              
              return (
                <line
                  x1={cx}
                  y1={lineTop}
                  x2={cx}
                  y2={lineBottom}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
              );
            }}
            legendType="line"
            isAnimationActive={false}
          />

          {/* Season End Reference Line */}
          <ReferenceLine
            x={seasonEndDateString}
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{ value: "Season End", position: "top", offset: 10, style: { fill: "#8b5cf6", fontSize: "12px", fontWeight: "bold" } }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Info Icon - Bottom Right */}
      <InfoIconButton>
        <div className="w-64 p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Sales Pacing Dashboard</h4>
                <p className="text-sm text-gray-600 mb-3">
                  View detailed sales pacing analytics and forecasting in Power BI.
                </p>
              </div>
              
              <a
                href={POWER_BI_DASHBOARDS.SALES_PACING.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <span>Open Sales Pacing Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
        </div>
      </InfoIconButton>
    </div>
  );
}
