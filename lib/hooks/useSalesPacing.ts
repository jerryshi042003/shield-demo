import { useState, useEffect } from 'react';

// Note: Season dates are now dynamically determined from actual data

// Raw data interface from API (matching actual blob structure)
interface RawSalesPacingData {
  orderdate: string | number;
  Season_type: string;
  Client_type: string; // Fixed field name
  cumulative_revenue: number;
  pred_pacing_revenue_normalized: number;
  Revenue_Goal: number; // Fixed field name (no space)
  DayOfSeason: number;
}

// Processed data point for chart
export interface SalesPacingDataPoint {
  date: Date;
  dateString: string;
  dayOfSeason: number;
  actualRevenue: number | null; // null when data is not available
  goalPacing: number | null;
  rawExpectedRevenue: number | null; // Raw calculated value before monotonic constraint
  revenueGoal: number | null;
  deltaAmount: number | null;
  variancePercent: number | null;
  todayMarker?: boolean; // Flag to indicate this is today's date for custom marker
}

interface SalesPacingMetrics {
  currentActual: number;
  currentExpected: number;
  gapAmount: number;
  gapPercent: number | null;
  daysIntoSeason: number;
  projectedFinal: number | null;
  todayDayOfSeason: number;
  isSeasonComplete: boolean;
  actualTodayDayOfSeason: number;
}

interface UseSalesPacingReturn {
  data: SalesPacingDataPoint[];
  metrics: SalesPacingMetrics | null;
  loading: boolean;
  error: string | null;
  hasExpectedLine: boolean;
}

// Parse YYYYMMDD number to Date object
function parseOrderDate(orderdate: string | number): Date | null {
  try {
    const dateStr = orderdate.toString().padStart(8, '0');
    if (dateStr.length !== 8) return null;
    
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.slice(6, 8));
    
    const parsed = new Date(year, month, day);
    if (isNaN(parsed.getTime())) return null;
    
    return parsed;
  } catch {
    return null;
  }
}

// Calculate day of season from dynamic start date
function calculateDayOfSeason(date: Date, startDate: Date): number {
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

// Generate continuous daily series based on actual data range
// Returns both the full series and the display start date (Jan 1)
function generateContinuousSeries(dataMap: Map<string, RawSalesPacingData>): { series: Date[], displayStartDate: Date | null } {
  const series: Date[] = [];
  
  if (dataMap.size === 0) {
    return { series, displayStartDate: null };
  }
  
  // Find actual date range from data
  const allDates = Array.from(dataMap.keys()).map(dateKey => new Date(dateKey)).sort((a, b) => a.getTime() - b.getTime());
  const dataStartDate = allDates[0];
  const dataEndDate = allDates[allDates.length - 1];
  const today = new Date();
  
  // Find the first Jan 1 in the dataset for display purposes
  let displayStartDate: Date | null = null;
  for (const date of allDates) {
    if (date.getMonth() === 0 && date.getDate() === 1) { // January 1st
      displayStartDate = date;
      break;
    }
  }
  
  // If no Jan 1 found, use the first date in January if available
  if (!displayStartDate) {
    for (const date of allDates) {
      if (date.getMonth() === 0) { // Any January date
        displayStartDate = date;
        break;
      }
    }
  }
  
  // Fall back to data start if no January dates found
  displayStartDate ??= dataStartDate;
  
  // Start from data start, end at the later of data end or today
  const startDate = dataStartDate;
  const endDate = today > dataEndDate ? today : dataEndDate;
  
  const current = new Date(startDate);
  while (current <= endDate) {
    series.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return { series, displayStartDate };
}

// Filter and deduplicate raw data
function processRawData(rawData: RawSalesPacingData[]): Map<string, RawSalesPacingData> {
  const filtered = rawData.filter(row =>
    row.Season_type === 'REG' &&
    row.Client_type === 'Total'
  );
  
  // Parse dates and include ALL valid dates (no hardcoded range filtering)
  const validRows: Array<RawSalesPacingData & { parsedDate: Date }> = [];
  for (const row of filtered) {
    const parsedDate = parseOrderDate(row.orderdate);

    if (parsedDate) {
      validRows.push({ ...row, parsedDate });
    }
  }
  
  // Sort by date ascending
  validRows.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  
  // Take last row per day (deduplicate)
  const dayMap = new Map<string, RawSalesPacingData>();
  for (const row of validRows) {
    const dateKey = row.parsedDate.toISOString().split('T')[0];
    dayMap.set(dateKey, row);
  }
  
  return dayMap;
}

// Apply carry-forward logic and create chart data
function createChartData(
  continuousSeries: Date[], 
  dataMap: Map<string, RawSalesPacingData>,
  revenueGoal: number | null,
  dataStartDate: Date,
  displayStartDate: Date
): SalesPacingDataPoint[] {
  const result: SalesPacingDataPoint[] = [];
  
  // Calculate today's date string for todayMarker flag
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  
  let lastActual = 0;
  let lastPacingNormalized = 0;
  let lastExpected = 0;
  let hasSeenRealData = false;
  let dataHasEnded = false;
  
  for (const date of continuousSeries) {
    const dateKey = date.toISOString().split('T')[0];
    
    // Skip dates before display start (e.g., before Jan 1)
    if (date < displayStartDate) {
      // Still process the data to maintain carry-forward values
      const row = dataMap.get(dateKey);
      if (row) {
        if (typeof row.cumulative_revenue === 'number' && row.cumulative_revenue !== 0) {
          lastActual = row.cumulative_revenue;
          hasSeenRealData = true;
        }
        if (typeof row.pred_pacing_revenue_normalized === 'number') {
          lastPacingNormalized = row.pred_pacing_revenue_normalized;
        }
      }
      continue; // Don't add to result array
    }
    
    // Calculate day of season from display start date (e.g., Jan 1 = Day 1)
    const dayOfSeason = calculateDayOfSeason(date, displayStartDate);
    const row = dataMap.get(dateKey);
    
    // Handle actual revenue with intelligent cutoff
    let actualRevenue: number | null = lastActual;
    
    if (row && typeof row.cumulative_revenue === 'number' && row.cumulative_revenue !== 0) {
      // We have real revenue data
      actualRevenue = row.cumulative_revenue;
      lastActual = actualRevenue;
      hasSeenRealData = true;
      dataHasEnded = false; // Reset in case we had a temporary gap
    } else if (row?.cumulative_revenue === 0 && !hasSeenRealData) {
      // If we've never had a non-zero value, stay at 0 (season start)
      actualRevenue = 0;
    } else if (row && typeof row.cumulative_revenue === 'number' && row.cumulative_revenue === 0 && hasSeenRealData) {
      // We've transitioned from real data to no data - start cutoff
      dataHasEnded = true;
      actualRevenue = null; // Stop plotting actual revenue
    } else if (dataHasEnded) {
      // Continue cutoff - no more actual revenue data to plot
      actualRevenue = null;
    }
    // Allow refunds to cause declines (trust the data)
    else if (row && typeof row.cumulative_revenue === 'number') {
      actualRevenue = row.cumulative_revenue;
      // Don't update lastActual on refund days - resume carry-forward after
    }
    
    // Handle expected revenue with carry-forward
    let goalPacing: number | null = null;
    let rawExpectedRevenue: number | null = null;

    if (revenueGoal && revenueGoal > 0) {
      let pacingNormalized = lastPacingNormalized;

      if (row && typeof row.pred_pacing_revenue_normalized === 'number') {
        pacingNormalized = row.pred_pacing_revenue_normalized;
        lastPacingNormalized = pacingNormalized;
      }

      // Calculate raw expected revenue (preserve exact blob precision)
      const calculated = pacingNormalized * revenueGoal;
      const clamped = Math.max(0, Math.min(calculated, revenueGoal));
      rawExpectedRevenue = clamped; // Store raw value before monotonic constraint

      // Apply monotonic constraint for display
      goalPacing = Math.max(clamped, lastExpected);
      lastExpected = goalPacing;
    }

    // Calculate variance for this data point
    let deltaAmount: number | null = null;
    let variancePercent: number | null = null;

    if (goalPacing !== null && actualRevenue !== null) {
      deltaAmount = actualRevenue - goalPacing;
      if (goalPacing > 0) {
        variancePercent = (actualRevenue / goalPacing - 1) * 100;
      }
    }

    result.push({
      date: new Date(date),
      dateString: date.toISOString().split('T')[0],
      dayOfSeason,
      actualRevenue,
      goalPacing,
      rawExpectedRevenue,
      revenueGoal,
      deltaAmount,
      variancePercent,
      todayMarker: dateKey === todayDateString
    });
  }
  
  return result;
}

// Calculate metrics from processed data
function calculateMetrics(data: SalesPacingDataPoint[], displayStartDate: Date): SalesPacingMetrics | null {
  if (!data.length) return null;
  
  // Find the latest data point with actual revenue data
  const latestWithData = data.slice().reverse().find(d => d.actualRevenue !== null);
  const latest = latestWithData ?? data[data.length - 1];
  
  const currentActual = latest.actualRevenue ?? 0;
  const currentExpected = latest.goalPacing ?? 0;
  const gapAmount = currentActual - currentExpected;
  
  let gapPercent: number | null = null;
  if (currentExpected > 0) {
    gapPercent = (currentActual / currentExpected - 1) * 100;
  }
  
  // Find last day with actual revenue data for projection
  const dataWithRevenue = data.filter(d => d.actualRevenue !== null && d.actualRevenue > 0);
  const lastActualDay = dataWithRevenue.length > 0 ? dataWithRevenue[dataWithRevenue.length - 1].dayOfSeason : 0;
  const daysIntoSeason = lastActualDay;
  
  let projectedFinal: number | null = null;
  const totalDataDays = data.length;
  if (daysIntoSeason > 0 && latest.revenueGoal && totalDataDays > 0) {
    const paceRate = currentActual / daysIntoSeason;
    projectedFinal = paceRate * totalDataDays;
  }
  
  // Calculate today's day of season using display start date
  const today = new Date();
  const actualTodayDayOfSeason = calculateDayOfSeason(today, displayStartDate);
  const todayDayOfSeason = actualTodayDayOfSeason;
  
  return {
    currentActual,
    currentExpected,
    gapAmount,
    gapPercent,
    daysIntoSeason,
    projectedFinal,
    todayDayOfSeason,
    isSeasonComplete: actualTodayDayOfSeason > totalDataDays,
    actualTodayDayOfSeason
  };
}

export function useSalesPacing(productType: string = 'Total'): UseSalesPacingReturn {
  const [data, setData] = useState<SalesPacingDataPoint[]>([]);
  const [metrics, setMetrics] = useState<SalesPacingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasExpectedLine, setHasExpectedLine] = useState(false);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/sales-pacing?productType=${encodeURIComponent(productType)}&seasonType=REG`);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const result = (await response.json()) as { _fallback?: boolean; _error?: string; data?: RawSalesPacingData[] };
        
        if (result._fallback === true || result._error) {
          throw new Error(result._error ?? 'Sales pacing data not available');
        }

        const rawData: RawSalesPacingData[] = result.data ?? [];

        // Process the data with all business rules
        const processedMap = processRawData(rawData);
        const { series: continuousSeries, displayStartDate } = generateContinuousSeries(processedMap);
        
        // Ensure we have a valid display start date
        if (!displayStartDate) {
          throw new Error('Could not determine season start date from data');
        }

        // Determine revenue goal (season-level constant)
        let revenueGoal: number | null = null;
        for (const row of processedMap.values()) {
          if (typeof row.Revenue_Goal === 'number' && row.Revenue_Goal > 0) {
            revenueGoal = row.Revenue_Goal;
            break;
          }
        }
        
        // Get data start date for pre-filtering carry-forward logic
        const allDates = Array.from(processedMap.keys()).map(dateKey => new Date(dateKey)).sort((a, b) => a.getTime() - b.getTime());
        const dataStartDate = allDates.length > 0 ? allDates[0] : new Date();
        
        // Create chart data with smart season filtering
        const chartData = createChartData(continuousSeries, processedMap, revenueGoal, dataStartDate, displayStartDate);
        const calculatedMetrics = calculateMetrics(chartData, displayStartDate);

        setData(chartData);
        setMetrics(calculatedMetrics);
        setHasExpectedLine(revenueGoal !== null && revenueGoal > 0);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
        setMetrics(null);
        setHasExpectedLine(false);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [productType]);
  
  return {
    data,
    metrics,
    loading,
    error,
    hasExpectedLine
  };
}