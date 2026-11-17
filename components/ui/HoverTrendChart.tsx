'use client';

import { LineChart, Line, Area, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Dot } from 'recharts';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface HoverTrendChartProps {
  data: TrendDataPoint[];
  className?: string;
  selectedDate?: string;
  hideOnNoChange?: boolean;
}

export function HoverTrendChart({ data, className = '', selectedDate: _selectedDate, hideOnNoChange = false }: HoverTrendChartProps) {
  // Show "no data" message if empty
  if (data.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg shadow-lg p-3 ${className}`}>
        <div className="text-xs text-gray-700 font-medium text-center">
          <div className="mb-1">No Trend Data</div>
          <div className="text-xs text-gray-500">Check back tomorrow</div>
        </div>
      </div>
    );
  }

  // Skip if all values are the same (0% change scenario)
  const allSame = data.every(point => point.value === data[0].value);
  if (allSame && data.length > 1) {
    // For ticket product cards, hide the hover entirely when there's no change
    if (hideOnNoChange) {
      return null;
    }
    // For other cards, show "No change" message
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg shadow-lg p-3 ${className}`}>
        <div className="text-xs text-gray-600 font-medium text-center">
          No change
        </div>
      </div>
    );
  }

  // Calculate trend direction and percentage change
  const firstValue = data[0]?.value ?? 0;
  const lastValue = data[data.length - 1]?.value ?? 0;
  const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  
  // Smart color logic to avoid false alarms
  const getTrendColor = (change: number) => {
    if (Math.abs(change) <= 2) return '#6B7280'; // Neutral gray for minimal changes
    if (change > 2) return '#10B981'; // Green for meaningful positive
    return '#EF4444'; // Red only for meaningful negative
  };
  
  const trendColor = getTrendColor(percentChange);
  const isUpward = percentChange > 2;
  const isDownward = percentChange < -2;
  const isFlat = Math.abs(percentChange) <= 2;
  
  const changeText = (typeof percentChange === 'number' && !isNaN(percentChange)) 
    ? `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`
    : '+0.0%';
  
  // Format values for display with executive-appropriate precision
  const formatValue = (value: number) => {
    if (isNaN(value)) {
      return '0';
    }

    // Executive-appropriate precision based on magnitude
    if (value >= 10000000) {
      // $10M+: Show as XX.XM (1 decimal) 
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000000) {
      // $1M-$10M: Show as X.XXM (2 decimals)
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 100000) {
      // $100K-$1M: Show as XXXK (no decimal) for readability
      return `${Math.round(value / 1000)}K`;
    } else if (value >= 10000) {
      // $10K-$100K: Show as XX.XK (1 decimal) for precision
      return `${(value / 1000).toFixed(1)}K`;
    } else if (value >= 1000) {
      // $1K-$10K: Show as X.XK (1 decimal)
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      // Under $1K: Show as whole number
      return Math.round(value).toString();
    }
  };
  
  // Add week markers to data (every 7 days)
  const dataWithWeeks = data.map((point, index) => ({
    ...point,
    isWeekMarker: index % 7 === 0
  }));

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-xl p-3 ${className}`}>
      {/* Key Numbers First - Executive Focus */}
      <div className="mb-2 flex justify-between items-start">
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">7 days ago</span>
          <span className="text-sm font-bold text-gray-800">{formatValue(firstValue)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500">
            {data[data.length - 1].date === new Date().toISOString().split('T')[0] ? 'Today' : 'Latest'}
          </span>
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
            {isUpward ? '↗' : isDownward ? '↘' : '→'}
            {formatValue(lastValue)}
          </span>
        </div>
      </div>

      {/* Percentage Change */}
      <div className="mb-2 text-center">
        <span className={`text-sm font-semibold ${
          isFlat ? 'text-gray-600' :
          isUpward ? 'text-green-600' : 'text-red-600'
        }`}>
          {changeText} change
        </span>
      </div>

      {/* Chart - Visual Proof */}
      <ResponsiveContainer width={180} height={80}>
        <LineChart data={dataWithWeeks} margin={{ top: 2, right: 2, left: 2, bottom: 5 }}>
          {/* Gradient definitions for area fill */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={trendColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* Weekly reference lines */}
          {dataWithWeeks.map((point, index) =>
            point.isWeekMarker && index > 0 ? (
              <ReferenceLine
                key={index}
                x={point.date}
                stroke="#E5E7EB"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            ) : null
          )}


          <XAxis
            dataKey="date"
            hide={true}
          />
          <YAxis
            hide={true}
            domain={[
              (dataMin: number) => Math.floor(dataMin * 0.97),  // 3% below min
              (dataMax: number) => Math.ceil(dataMax * 1.03)    // 3% above max
            ]}
          />

          {/* Area fill under the line */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#areaGradient)"
            isAnimationActive={true}
            animationDuration={300}
          />

          {/* Trend line with endpoint dots */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={2.5}
            dot={({ index, cx, cy }: { index?: number; cx?: number; cy?: number }) => {
              const isFirstOrLast = index === 0 || index === dataWithWeeks.length - 1;
              if (!isFirstOrLast) return <g key={`empty-${index}`} />;
              return (
                <Dot
                  key={`dot-${index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={trendColor}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={false}
            isAnimationActive={true}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Subtle label */}
      <div className="text-xs text-gray-400 mt-2 text-center">
        7-Day Trend
      </div>
    </div>
  );
}