import GameCommandCenterPage from '@/features/shared/sales/game/GameCommandCenterPage';
import type { Franchise } from '@/lib/franchise';

type SalesGameModule = typeof GameCommandCenterPage;

const SALES_GAME_MODULES: Record<Franchise, SalesGameModule> = {
  LAK: GameCommandCenterPage,
  LAG: GameCommandCenterPage,
  ONT: GameCommandCenterPage
};

export function resolveSalesGameModule(franchise: Franchise): SalesGameModule {
  return SALES_GAME_MODULES[franchise];
}
