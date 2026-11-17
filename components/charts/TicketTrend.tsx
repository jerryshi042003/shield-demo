import { useEffect, useState, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Type definition moved inline after data file deletion
export interface TicketDataPoint {
  date: string;
  opponent: string;
  event?: string;
  result?: string;
  tickets: number;
  revenue: number;
}

interface TicketTrendProps {
  data: TicketDataPoint[];
  className?: string;
  league?: 'NHL'; // AHL removed
  forceRecreate?: boolean; // Forces complete recreation on mount
}

interface TooltipPayloadEntry {
  payload: TicketDataPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-md text-sm">
        <div className="font-medium mb-1 text-foreground">
          {data.date} vs {data.opponent} — {data.event ?? data.result}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Tickets Sold:</span>
            <span className="font-medium text-foreground">{data.tickets.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Revenue:</span>
            <span className="font-medium text-foreground">${data.revenue.toFixed(2)}M</span>
          </div>
          {data.event && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-orange-600 dark:text-orange-400 font-medium">🎉 {data.event}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Legend Component
const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-4 text-sm flex-wrap">
    {/* Bar Legend */}
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 opacity-15 rounded"></div>
      <span className="text-muted-foreground">Regular Games</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-orange-500 dark:bg-orange-400 opacity-35 rounded"></div>
      <span className="text-muted-foreground">Promo Nights</span>
    </div>
    
    {/* Line Legend */}
    <div className="flex items-center gap-2">
      <div className="w-4 h-0.5 bg-indigo-500 dark:bg-indigo-400 rounded"></div>
      <span className="text-muted-foreground">Ticket Trend</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex items-center w-4">
        <div className="w-1 h-0.5 bg-amber-400 dark:bg-amber-300"></div>
        <div className="w-0.5 h-0.5 bg-transparent"></div>
        <div className="w-1 h-0.5 bg-amber-400 dark:bg-amber-300"></div>
        <div className="w-0.5 h-0.5 bg-transparent"></div>
        <div className="w-1 h-0.5 bg-amber-400 dark:bg-amber-300"></div>
      </div>
      <span className="text-muted-foreground">Revenue Trend</span>
    </div>
  </div>
);

export function TicketTrend({
  data,
  className: _className = 'h-[200px]',
  league = 'NHL',
  forceRecreate = true // Default to true for complete recreation behavior
}: TicketTrendProps) {
  const [renderKey, setRenderKey] = useState(0);
  const mountTimeRef = useRef(Date.now());

  // Force recreation on every prop change when forceRecreate is true
  useEffect(() => {
    if (forceRecreate) {
      // Update mount time and render key to force complete recreation
      mountTimeRef.current = Date.now();
      setRenderKey(prev => prev + 1);
    }
  }, [data, league, forceRecreate]);

  // Format Y-axis labels to show K notation
  const formatTickets = (value: number) => {
    return `${(value / 1000).toFixed(0)}K`;
  };

  // Generate unique key for this render
  const chartKey = `chart-${league}-${renderKey}-${mountTimeRef.current}`;

  return (
    <div className="bg-surface-card border-0 rounded-card shadow-card p-6 space-y-4">
      {/* Chart Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Ticket Sales & Revenue Trend
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart 
          key={chartKey}
          data={data} 
          margin={{ top: 8, right: 8, left: 35, bottom: 8 }}
        >
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value: string, _index: number) => _index % 3 === 0 ? value.slice(5) : ''}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            domain={[16000, 20000]} // AHL removed, always NHL
            tickFormatter={formatTickets}
            label={{
              value: 'Tickets (K)',
              angle: -90,
              position: 'insideLeft',
              textAnchor: 'middle',
              offset: -15,
              style: { fontSize: '12px', fill: '#6B7280', textAnchor: 'middle' }
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value: number) => `$${value.toFixed(2)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="tickets"
            yAxisId="left"
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${renderKey}-${index}`}
                fill={entry.event ? '#F97316' : '#6366F1'}
                fillOpacity={entry.event ? 0.35 : 0.15}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="tickets"
            stroke="#6366F1"
            strokeWidth={3}
            yAxisId="left"
            isAnimationActive={true}
            animationBegin={200}
            animationDuration={1000}
            dot={false}
            activeDot={{ r: 6, fill: '#F97316', stroke: '#F97316' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#FBBF24" 
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            yAxisId="right"
            isAnimationActive={true}
            animationBegin={400}
            animationDuration={1000}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
} 