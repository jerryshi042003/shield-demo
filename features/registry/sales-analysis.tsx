import SalesAnalysisPage from '@/features/shared/sales/analysis/SalesAnalysisPage';
import type { Franchise } from '@/lib/franchise';

type SalesAnalysisModule = typeof SalesAnalysisPage;

const SALES_ANALYSIS_MODULES: Record<Franchise, SalesAnalysisModule> = {
  LAK: SalesAnalysisPage,
  LAG: SalesAnalysisPage,
  ONT: SalesAnalysisPage
};

export function resolveSalesAnalysisModule(franchise: Franchise): SalesAnalysisModule {
  return SALES_ANALYSIS_MODULES[franchise];
}
