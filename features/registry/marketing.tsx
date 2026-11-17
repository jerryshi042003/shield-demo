import LakMarketingPage from '@/features/lak/marketing/MarketingPage';
import LagMarketingPage from '@/features/lag/marketing/MarketingPage';
import OntMarketingPage from '@/features/ont/marketing/MarketingPage';
import type { Franchise } from '@/lib/franchise';

type MarketingModule = typeof LakMarketingPage;

const MARKETING_MODULES: Record<Franchise, MarketingModule> = {
  LAK: LakMarketingPage,
  LAG: LagMarketingPage,
  ONT: OntMarketingPage
};

export function resolveMarketingModule(franchise: Franchise): MarketingModule {
  return MARKETING_MODULES[franchise];
}
