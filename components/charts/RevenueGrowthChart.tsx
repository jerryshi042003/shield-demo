import { useEffect, useState, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useHistoricalMetrics } from '@/lib/hooks/useHistoricalMetrics';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

interface RevenueGrowthChartProps {
  className?: string;
  league?: 'NHL' | 'AHL';
  forceRecreate?: boolean;
  selectedDate?: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">
              {entry.name}: {
                entry.dataKey === 'TSR' ? formatCurrency(entry.value) :
                entry.dataKey === 'ATP' ? formatCurrency(entry.value) :
                formatNumber(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};


export function RevenueGrowthChart({
  className = '',
  league = 'NHL',
  forceRecreate = true,
  selectedDate
}: RevenueGrowthChartProps) {
  const [renderKey, setRenderKey] = useState(0);
  const mountTimeRef = useRef(Date.now());
  const { data: historicalData, loading } = useHistoricalMetrics();

  // Force recreation when needed
  useEffect(() => {
    if (forceRecreate) {
      mountTimeRef.current = Date.now();
      setRenderKey(prev => prev + 1);
    }
  }, [selectedDate, league, forceRecreate]);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!historicalData.length) return [];

    // Get 30 days of data from selected date or today
    const targetDate = selectedDate ? new Date(selectedDate) : new Date();
    const thirtyDaysAgo = new Date(targetDate);
    thirtyDaysAgo.setDate(targetDate.getDate() - 29); // 30 days inclusive

    return historicalData
      .filter(point => {
        const pointDate = new Date(point.date);
        return pointDate >= thirtyDaysAgo && pointDate <= targetDate;
      })
      .map(point => ({
        date: point.date,
        formattedDate: new Date(point.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        TSR: point.TSR,
        NFS: point.NFS_Season_To_Date,
        ATP: point.ATP_avg_season
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [historicalData, selectedDate]);

  // Generate unique key for this render
  const chartKey = `revenue-chart-${league}-${renderKey}-${mountTimeRef.current}`;

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
        <div className="flex items-center justify-center h-80 text-gray-500">
          No historical data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
        <p className="text-sm text-gray-600 mt-1">30-day performance tracking for key revenue metrics</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          key={chartKey}
          data={chartData} 
          margin={{ top: 20, right: 60, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            axisLine={{ stroke: '#e0e0e0' }}
            interval="preserveStartEnd"
          />

          {/* Revenue Y-axis (left) */}
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value: number) => formatCurrency(value)}
            label={{
              value: 'Revenue ($)',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />

          {/* Count Y-axis (right) */}
          <YAxis
            yAxisId="count"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#e0e0e0' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value: number) => formatNumber(value, '')}
            label={{
              value: 'Count',
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle' }
            }}
          />

          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="TSR"
            name="Ticket Sales Revenue"
            stroke="#10B981"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#10B981' }}
          />

          <Line
            yAxisId="count"
            type="monotone"
            dataKey="NFS"
            name="New FSE"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#3B82F6' }}
          />

          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="ATP"
            name="Average Ticket Price"
            stroke="#F59E0B"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#F59E0B' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 