export type KingsSalesCategory = {
  name: 'FSE' | 'Group' | 'Individual';
  revenue: number;
  goal: number;
  netTickets: number;
  attainment: number;
};

export type KingsSalesReport = {
  franchise: 'LAK';
  season: '2026-27';
  scopeLabel: string;
  source: string;
  queriedAt: string;
  expiresAt: string;
  revenueGoal: number;
  attainment: number;
  revenueGap: number;
  netTickets: number;
  paidTickets: number;
  compTickets: number;
  netRevenue: number;
  averagePaidPrice: number;
  categories: KingsSalesCategory[];
  lastWeek: {
    start: string;
    end: string;
    purchases: number;
    cancellations: number;
    netRevenue: number;
  };
  topGames: Array<{
    name: string;
    date: string;
    netRevenue: number;
    netTickets: number;
  }>;
};
