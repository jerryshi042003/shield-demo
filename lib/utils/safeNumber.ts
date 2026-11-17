import { formatGoalTarget } from '@/lib/utils/format';

/**
 * Safe number utilities for handling potentially undefined/null metric values.
 * Extracted to avoid duplication across formatMetrics.ts and page.tsx.
 */

/**
 * Safely convert a value to a number with fallback.
 * Returns the fallback if value is null, undefined, empty string, or NaN.
 */
export const safeNumber = (value: unknown, fallback: number | string = '---'): number | string => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : (value as number);
  return isNaN(num) ? fallback : num;
};

/**
 * Safely calculate goal percentage from a pacing value (decimal like 0.94 = 94%).
 */
export const safeGoalPercentage = (goalPacing: unknown): number => {
  const pacing = safeNumber(goalPacing, 0);
  return typeof pacing === 'number' ? Math.round(pacing * 100) : 0;
};

/**
 * Safely calculate goal target from current value and pacing.
 * Returns formatted string like "$1.2M" or "---" if calculation not possible.
 */
export const safeGoalTarget = (currentValue: unknown, goalPacing: unknown, prefix: string = ''): string => {
  const current = safeNumber(currentValue, 0);
  const pacing = safeNumber(goalPacing, 0);
  if (typeof current === 'number' && typeof pacing === 'number' && pacing > 0) {
    const target = current / pacing;
    return formatGoalTarget(target, prefix);
  }
  return '---';
};

/**
 * Safely extract delta/YoY percentage value.
 * Returns undefined if value is 0 or not a valid number.
 */
export const safeDelta = (yoyValue: unknown): number | undefined => {
  const yoy = safeNumber(yoyValue, 0);
  if (typeof yoy === 'number' && yoy !== 0) {
    return yoy;
  }
  return undefined;
};
