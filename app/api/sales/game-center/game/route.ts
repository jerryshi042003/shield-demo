import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { demoLegacy, densify } from '@/lib/demo/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = authorizeApiRequest(request);
  if (!access.ok) return access.response;
  const eventCode = new URL(request.url).searchParams.get('event_code')?.trim() ?? '';
  const centers = (demoLegacy(access.franchise)?.gameCenters ?? {}) as Record<string, unknown>;
  const center = centers[eventCode];
  if (!center)
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'No demo game matches this event.' } },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  type Point = { days_out: number; actual_revenue: number; tickets_sold: number };
  type Center = {
    game_revenue_trend: Point[];
    product_revenue_trend: { products: unknown[]; series: Array<{ product_id: string; points: Point[] }> };
  };
  const game = center as Center;
  return NextResponse.json(
    {
      ...game,
      game_revenue_trend: densify(game.game_revenue_trend, 'days_out'),
      product_revenue_trend: {
        ...game.product_revenue_trend,
        series: game.product_revenue_trend.series.map((series) => ({
          ...series,
          points: densify(series.points, 'days_out')
        }))
      }
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
