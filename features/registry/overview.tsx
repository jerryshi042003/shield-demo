import type { ComponentType } from 'react';
import DashboardPageClient from '@/app/(dashboard)/dashboard-page-client';
import GalaxyOverviewPage from '@/features/lag/overview/GalaxyOverviewPage';
import KingsOverviewPage from '@/features/lak/overview/KingsOverviewPage';
import type { Franchise } from '@/lib/franchise';

type OverviewModule = ComponentType;

const OVERVIEW_MODULES: Record<Franchise, OverviewModule> = {
  LAK: KingsOverviewPage,
  LAG: GalaxyOverviewPage,
  ONT: DashboardPageClient
};

export function resolveOverviewModule(franchise: Franchise): OverviewModule {
  return OVERVIEW_MODULES[franchise];
}
