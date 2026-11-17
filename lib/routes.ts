import type { Section } from '@/lib/constants';

export type SalesAnalysisDatePreset =
  | 'ALL'
  | 'TODAY'
  | 'PREV_DAY'
  | 'LAST_7'
  | 'LAST_30'
  | 'LAST_90';

export interface SalesAnalysisRouteQuery {
  season?: string[];
  season_type?: string[];
  date_preset?: SalesAnalysisDatePreset;
  event_date_start?: string | null;
  event_date_end?: string | null;
  days_out_category?: Array<'0_7' | '8_14' | '15_30' | '31_PLUS'>;
  sales_days_out_max?: number | null;
  price_level?: string[];
  event_day_of_week?: string[];
  opponent?: string[];
  sort?: string[];
  page?: number;
  page_size?: number;
}

interface QueryInput {
  get(name: string): string | null;
}

export type SalesView = 'season' | 'game' | 'analysis';

export const DEFAULT_SALES_SEASON_PARAM = 'current';
export const DEFAULT_SALES_EVENT_PARAM = 'current';
export const LEGACY_DEFAULT_SALES_EVENT_PARAM = 'next';

const CSV_KEYS: Array<keyof SalesAnalysisRouteQuery> = [
  'season',
  'season_type',
  'days_out_category',
  'price_level',
  'event_day_of_week',
  'opponent',
  'sort'
];

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function toCsv(values: string[] | undefined): string | null {
  if (!values || values.length === 0) return null;
  return values.join(',');
}

export function overviewPath(): string {
  return '/overview';
}

export function marketingPath(): string {
  return '/marketing';
}

export function salesSeasonPath(season: string): string {
  return `/sales/season/${encodeURIComponent(season.trim())}`;
}

export function salesGamePath(eventCode: string): string {
  return `/sales/game/${encodeURIComponent(eventCode.trim())}`;
}

export function salesPaymentsPath(): string {
  return '/sales/payments';
}

export function kingsTicketSalesPath(): string {
  return '/sales/ticket-sales';
}

export function salesDailySalesPath(): string {
  return '/sales/daily-sales';
}

export function defaultSalesSeasonPath(): string {
  return salesSeasonPath(DEFAULT_SALES_SEASON_PARAM);
}

export function defaultSalesGamePath(): string {
  return salesGamePath(DEFAULT_SALES_EVENT_PARAM);
}

export function isDefaultSalesEventParam(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === DEFAULT_SALES_EVENT_PARAM || normalized === LEGACY_DEFAULT_SALES_EVENT_PARAM;
}

export function salesAnalysisPath(query?: SalesAnalysisRouteQuery): string {
  if (!query) return '/sales/analysis';

  const params = new URLSearchParams();

  for (const key of CSV_KEYS) {
    const rawValue = query[key];
    const value = Array.isArray(rawValue) ? toCsv(rawValue.map((item) => String(item))) : null;
    if (value) params.set(key, value);
  }

  if (query.date_preset) params.set('date_preset', query.date_preset);
  if (query.event_date_start) params.set('event_date_start', query.event_date_start);
  if (query.event_date_end) params.set('event_date_end', query.event_date_end);
  if (typeof query.sales_days_out_max === 'number') params.set('sales_days_out_max', String(query.sales_days_out_max));
  if (typeof query.page === 'number') params.set('page', String(query.page));
  if (typeof query.page_size === 'number') params.set('page_size', String(query.page_size));

  const serialized = params.toString();
  return serialized.length > 0 ? `/sales/analysis?${serialized}` : '/sales/analysis';
}

export function parseSalesAnalysisQuery(input: QueryInput): SalesAnalysisRouteQuery {
  const query: SalesAnalysisRouteQuery = {};

  for (const key of CSV_KEYS) {
    const values = parseCsv(input.get(key));
    if (values.length > 0) {
      switch (key) {
        case 'season':
          query.season = values;
          break;
        case 'season_type':
          query.season_type = values;
          break;
        case 'days_out_category':
          query.days_out_category = values as SalesAnalysisRouteQuery['days_out_category'];
          break;
        case 'price_level':
          query.price_level = values;
          break;
        case 'event_day_of_week':
          query.event_day_of_week = values;
          break;
        case 'opponent':
          query.opponent = values;
          break;
        case 'sort':
          query.sort = values;
          break;
        default:
          break;
      }
    }
  }

  const datePreset = input.get('date_preset')?.trim();
  if (datePreset) query.date_preset = datePreset as SalesAnalysisDatePreset;

  const eventDateStart = input.get('event_date_start')?.trim();
  if (eventDateStart) query.event_date_start = eventDateStart;

  const eventDateEnd = input.get('event_date_end')?.trim();
  if (eventDateEnd) query.event_date_end = eventDateEnd;

  const salesDaysOutMax = input.get('sales_days_out_max')?.trim();
  if (salesDaysOutMax) {
    const parsed = Number.parseInt(salesDaysOutMax, 10);
    if (Number.isFinite(parsed)) query.sales_days_out_max = parsed;
  }

  const page = input.get('page')?.trim();
  if (page) {
    const parsed = Number.parseInt(page, 10);
    if (Number.isFinite(parsed)) query.page = parsed;
  }

  const pageSize = input.get('page_size')?.trim();
  if (pageSize) {
    const parsed = Number.parseInt(pageSize, 10);
    if (Number.isFinite(parsed)) query.page_size = parsed;
  }

  return query;
}

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function sectionFromPathname(pathname: string): Section {
  const normalized = normalizePathname(pathname);

  if (normalized === '/overview') return 'overview';
  if (normalized === '/marketing') return 'marketing';
  if (normalized === '/sales' || normalized.startsWith('/sales/')) return 'sales';

  return 'overview';
}

export function salesViewFromPathname(pathname: string): SalesView {
  const normalized = normalizePathname(pathname);
  if (normalized === '/sales/analysis' || normalized.startsWith('/sales/analysis/')) return 'analysis';
  if (normalized === '/sales/game' || normalized.startsWith('/sales/game/')) return 'game';
  return 'season';
}

export function seasonFromSalesPath(pathname: string): string | null {
  const match = normalizePathname(pathname).match(/^\/sales\/season\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function eventCodeFromSalesPath(pathname: string): string | null {
  const match = normalizePathname(pathname).match(/^\/sales\/game\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
