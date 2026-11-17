export const SPOM_CATEGORIES = [
  'full_season',
  'partial_plan',
  'mini_plan',
  'individual',
  'youth_soccer',
  'grp',
  'rentals',
  'license'
] as const;
export type SpomCategory = (typeof SPOM_CATEGORIES)[number];
export type SpomRow = {
  repTag: string;
  repName: string;
  team: string;
  score: number;
  orders: number;
  categories: Record<SpomCategory, number>;
};
export type GalaxySpomReport = {
  audience: 'manager' | 'rep';
  scopeLabel: string;
  month: string;
  environment: string;
  validationOnly: boolean;
  contractVersion: string;
  queriedAt: string;
  sourceRefreshedAt?: string;
  refreshAfter: string;
  expiresAt: string;
  cacheState: 'fresh' | 'refreshing';
  definitionAsOf: string;
  source: string;
  sql: string;
  parameters: { month: string; scope: string };
  rows: SpomRow[];
  totalScore: number;
  totalOrders: number;
};
