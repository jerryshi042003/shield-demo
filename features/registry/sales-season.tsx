import SeasonCommandCenterPage from '@/features/shared/sales/season/SeasonCommandCenterPage';
import KingsTicketSales from '@/features/lak/sales/KingsTicketSales';
import type { Franchise } from '@/lib/franchise';

type SalesSeasonModule = typeof SeasonCommandCenterPage;

const SALES_SEASON_MODULES: Record<Franchise, SalesSeasonModule> = {
  LAK: KingsTicketSales,
  LAG: SeasonCommandCenterPage,
  ONT: SeasonCommandCenterPage
};

export function resolveSalesSeasonModule(franchise: Franchise): SalesSeasonModule {
  return SALES_SEASON_MODULES[franchise];
}
