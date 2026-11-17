import 'server-only';
/**
 * Public demo data layer. Every value comes from the synthetic fixtures written
 * by `scripts/generate-demo-fixtures.mjs` (seeded, deterministic). There is no
 * warehouse, blob store, function app or other network source behind it.
 */
import kings from '@/lib/demo/fixtures/kings.json';
import galaxy from '@/lib/demo/fixtures/galaxy.json';
import reign from '@/lib/demo/fixtures/reign.json';
import kpiDaily from '@/lib/demo/fixtures/kpi-daily.json';
import legacyLak from '@/lib/demo/fixtures/legacy-lak.json';
import legacyOnt from '@/lib/demo/fixtures/legacy-ont.json';
import type { Franchise } from '@/lib/franchise';
import type { KingsSalesReport } from '@/lib/types/kings-sales';
import type { KingsPaymentsData } from '@/lib/types/kings-payments';
import type { GalaxySeasonReport } from '@/lib/types/galaxy-season';
import type { GalaxySpomReport, SpomRow } from '@/lib/types/galaxy-spom';
import type { ReignDailySalesData } from '@/lib/types/reign-daily-sales';
import type { ReignPaymentsData } from '@/lib/types/reign-payments';

export const DEMO_AS_OF = kings.asOf;
export const DEMO_SOURCE_LABEL = 'Demo fixtures (synthetic, seeded)';

const freshness = (minutes = 60) => {
  const now = Date.now();
  return {
    queriedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + minutes * 60_000).toISOString()
  };
};

export function demoKingsSales(): KingsSalesReport {
  return {
    ...(kings.sales as Omit<KingsSalesReport, 'queriedAt' | 'expiresAt'>),
    ...freshness()
  };
}

export function demoKingsPayments(): KingsPaymentsData {
  return {
    ...(kings.payments as Omit<KingsPaymentsData, 'queriedAt' | 'expiresAt'>),
    ...freshness()
  };
}

export const demoKingsWeekly = () => kings.weekly;
export const demoKingsGames = () => kings.games;

export const GALAXY_SEASON_SQL = `SELECT m.event_code, m.opponent, CAST(m.event_date AS DATE) event_date,
  ROUND(MEASURE(m.net_revenue), 2) revenue, MEASURE(m.revenue_goal) goal,
  MEASURE(m.ticket_count) tickets
FROM demo.shield.galaxy_season_metrics m
WHERE m.season = :season
GROUP BY ALL ORDER BY event_date, event_code`;

export function demoGalaxySeason(): GalaxySeasonReport {
  const events = galaxy.season.events.map((event) => ({
    eventCode: event.eventCode,
    opponent: event.opponent,
    eventDate: event.eventDate,
    revenue: event.revenue,
    goal: event.goal,
    tickets: event.tickets,
    attainment: event.attainment,
    gap: event.gap
  }));
  const now = Date.now();
  return {
    contractVersion: 'galaxy-season-report-v2',
    season: galaxy.season.season,
    environment: 'demo',
    queriedAt: new Date(now).toISOString(),
    refreshAfter: new Date(now + 5 * 60_000).toISOString(),
    expiresAt: new Date(now + 24 * 60 * 60_000).toISOString(),
    cacheState: 'fresh',
    definitionAsOf: galaxy.season.definitionAsOf,
    definitionMode: 'maintained',
    source: galaxy.season.source,
    sql: GALAXY_SEASON_SQL,
    parameters: { season: galaxy.season.season },
    events,
    totals: {
      revenue: events.reduce((sum, e) => sum + e.revenue, 0),
      goal: events.reduce((sum, e) => sum + e.goal, 0),
      eventCount: events.length
    }
  };
}

export const demoGalaxyEvents = () => galaxy.season.events;
export const demoGalaxyByProduct = () => galaxy.byProduct;
export const demoGalaxyWeekly = () => galaxy.weekly;

export const SPOM_DEFAULT_MONTH = galaxy.spom.defaultMonth;
export const SPOM_MONTHS = galaxy.spom.months.map((month) => month.month);

export function demoSpomRows(month: string): SpomRow[] | null {
  const normalized = /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : month;
  const found = galaxy.spom.months.find((entry) => entry.month === normalized);
  return found ? (found.rows as SpomRow[]) : null;
}

export function demoGalaxySpom(month: string): GalaxySpomReport | null {
  const rows = demoSpomRows(month || SPOM_DEFAULT_MONTH);
  if (!rows) return null;
  const now = Date.now();
  const resolved = /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : month || SPOM_DEFAULT_MONTH;
  return {
    audience: 'manager',
    scopeLabel: 'Demo manager · all demo representatives',
    month: resolved,
    environment: 'demo',
    validationOnly: false,
    contractVersion: 'galaxy-spom-report-v2',
    queriedAt: new Date(now).toISOString(),
    refreshAfter: new Date(now + 5 * 60_000).toISOString(),
    expiresAt: new Date(now + 60 * 60_000).toISOString(),
    cacheState: 'fresh',
    definitionAsOf: galaxy.spom.definitionAsOf,
    source: galaxy.spom.source,
    sql: `SELECT rep_tag, rep_name, team, spom_score, order_count, ${'full_season, partial_plan, mini_plan, individual, youth_soccer, grp, rentals, license'}
FROM ${galaxy.spom.source}
WHERE payment_month = :month
ORDER BY spom_score DESC, rep_name`,
    parameters: { month: resolved, scope: 'demo-manager' },
    rows,
    totalScore: rows.reduce((sum, row) => sum + row.score, 0),
    totalOrders: rows.reduce((sum, row) => sum + row.orders, 0)
  };
}

export const demoReignDailySales = () => reign.dailySales as ReignDailySalesData;
export const demoReignPayments = () => reign.payments as ReignPaymentsData;

/* Legacy command-center fixtures (Kings + Reign). */
type Legacy = typeof legacyLak;
const LEGACY: Partial<Record<Franchise, Legacy>> = {
  LAK: legacyLak,
  ONT: legacyOnt as unknown as Legacy
};
export const demoLegacy = (franchise: Franchise) => LEGACY[franchise] ?? null;

/* Kings Marketing daily KPI records (legacy dashboard contract). */
export const demoKpiDaily = () => kpiDaily;

/**
 * Fixtures store a sparse sales curve; the legacy charts expect one point per
 * day. Linearly interpolate between fixture points at request time.
 */
export function densify<T extends Record<string, number>>(points: T[], key: keyof T & string): T[] {
  if (points.length < 2) return points;
  const sorted = [...points].sort((a, b) => a[key] - b[key]);
  const out: T[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const from = sorted[i];
    const to = sorted[i + 1];
    const span = to[key] - from[key];
    for (let step = 0; step < span; step += 1) {
      const t = step / span;
      const point = { ...from } as Record<string, number>;
      for (const field of Object.keys(from)) {
        const a = from[field];
        const b = to[field];
        point[field] = field === key ? a + step : Math.round((a + (b - a) * t) * 100) / 100;
      }
      out.push(point as T);
    }
  }
  out.push(sorted[sorted.length - 1]);
  return key === 'days_out' ? out.sort((a, b) => b[key] - a[key]) : out;
}
