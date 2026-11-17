import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { demoLegacy, densify } from '@/lib/demo/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = authorizeApiRequest(request);
  if (!access.ok) return access.response;
  const params = new URL(request.url).searchParams;
  const season = params.get('season')?.trim() ?? '';
  const seasonType = (params.get('season_type')?.trim() || 'REG').toUpperCase();
  const centers = (demoLegacy(access.franchise)?.seasonCenters ?? {}) as Record<string, unknown>;
  const center = centers[`${season}${seasonType}`];
  if (!center)
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'No demo season matches this selection.' } },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  type Point = { day_of_sales_cycle: number; actual_revenue: number; tickets_sold: number };
  type Center = {
    season_revenue_trend: Point[];
    product_revenue_trend: { products: unknown[]; series: Array<{ product_id: string; points: Point[] }> };
  };
  const report = center as Center;
  return NextResponse.json(
    {
      ...report,
      season_revenue_trend: densify(report.season_revenue_trend, 'day_of_sales_cycle'),
      product_revenue_trend: {
        ...report.product_revenue_trend,
        series: report.product_revenue_trend.series.map((series) => ({
          ...series,
          points: densify(series.points, 'day_of_sales_cycle')
        }))
      }
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
