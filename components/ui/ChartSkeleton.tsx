'use client';

interface ChartSkeletonProps {
  /** Tailwind height class (e.g., 'h-80', 'h-96') */
  height?: string;
  /** Show title skeleton bar */
  showTitle?: boolean;
  /** Custom background color for card */
  backgroundColor?: string;
}

/**
 * Reusable skeleton loader for chart components
 * Based on the proven pattern from SalesPacingChart
 *
 * @example
 * ```tsx
 * if (loading) {
 *   return <ChartSkeleton height="h-96" />;
 * }
 * ```
 */
export function ChartSkeleton({
  height = 'h-80',
  showTitle = true,
  backgroundColor = '#ededed'
}: ChartSkeletonProps) {
  return (
    <div
      className="border-0 rounded-lg shadow-sm p-6"
      style={{ backgroundColor }}
    >
      <div className="animate-pulse">
        {showTitle && (
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
        )}
        <div className={`${height} bg-gray-200 rounded`}></div>
      </div>
    </div>
  );
}
