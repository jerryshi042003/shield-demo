import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { demoLegacy } from '@/lib/demo/data';
import type { GameSummaryApiRow } from '@/lib/hooks/useGameSummaryData';

export const dynamic = 'force-dynamic';

type Filters = {
  season?: string[];
  season_type?: string[];
  event_date_start?: string | null;
  event_date_end?: string | null;
  price_level?: string[];
  event_day_of_week?: string[];
  opponent?: string[];
};
type Query = {
  filters?: Filters;
  date_preset?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  pagination?: { page?: number; page_size?: number };
};

const allows = (values: string[] | undefined, value: string) =>
  !values?.length || values.includes('ALL') || values.map((v) => v.toUpperCase()).includes(value.toUpperCase());

/** Demo Sales Analysis query over the synthetic game-summary fixture rows. */
export async function POST(request: Request) {
  const access = authorizeApiRequest(request);
  if (!access.ok) return access.response;
  let query: Query;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    query = body as Query;
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Expected a query object.' } },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
  const filters = query.filters ?? {};
  const rows = ((demoLegacy(access.franchise)?.gameSummaryRows ?? []) as GameSummaryApiRow[])
    .filter((row) => allows(filters.season, String(row.season)))
    .filter((row) => allows(filters.season_type, row.season_type ?? ''))
    .filter((row) => allows(filters.event_day_of_week, row.dow))
    .filter((row) => allows(filters.opponent, row.opponent))
    .filter((row) => !filters.event_date_start || row.event_date >= filters.event_date_start)
    .filter((row) => !filters.event_date_end || row.event_date <= filters.event_date_end)
    .map((row) => {
      if (!filters.price_level?.length || filters.price_level.includes('ALL')) return row;
      const breakdown = (row.price_level_breakdown ?? []).filter((detail) =>
        filters.price_level!.includes(detail.price_level)
      );
      return breakdown.length === 1
        ? { ...row, price_level: breakdown[0].price_level, metrics: breakdown[0].metrics, price_level_breakdown: breakdown }
        : { ...row, price_level_breakdown: breakdown };
    });
  const sort = query.sort?.[0];
  if (sort?.field === 'event_date' || !sort) {
    rows.sort((a, b) => a.event_date.localeCompare(b.event_date) * (sort?.direction === 'desc' ? -1 : 1));
  }
  const pageSize = Math.min(500, Math.max(1, query.pagination?.page_size ?? 500));
  const page = Math.max(1, query.pagination?.page ?? 1);
  return NextResponse.json(
    { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
