export type GalaxySeasonReport = {
  contractVersion: string;
  season: string;
  environment: string;
  queriedAt: string;
  sourceRefreshedAt?: string;
  refreshAfter: string;
  expiresAt: string;
  cacheState: 'fresh' | 'refreshing';
  definitionAsOf: string;
  definitionMode: 'maintained' | 'dated_extract';
  source: string;
  sql: string;
  parameters: { season: string };
  events: Array<{
    eventCode: string;
    opponent: string;
    eventDate: string;
    revenue: number;
    goal: number;
    tickets: number;
    attainment: number;
    gap: number;
  }>;
  totals: { revenue: number; goal: number; eventCount: number };
};
