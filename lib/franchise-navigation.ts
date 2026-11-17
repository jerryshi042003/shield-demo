import type { Section } from '@/lib/constants';
import type { Franchise } from '@/lib/franchise';
import { defaultSalesSeasonPath, overviewPath } from '@/lib/routes';

const FRANCHISE_SECTIONS: Record<Franchise, Section[]> = {
  LAK: ['overview', 'sales', 'marketing'],
  LAG: ['overview', 'sales', 'marketing'],
  ONT: ['sales'],
};

export function getVisibleSectionsForFranchise(franchise: Franchise): Section[] {
  return FRANCHISE_SECTIONS[franchise];
}

export function canAccessSection(franchise: Franchise, section: Section): boolean {
  return FRANCHISE_SECTIONS[franchise].includes(section);
}

export function getDefaultSectionForFranchise(franchise: Franchise): Section {
  return FRANCHISE_SECTIONS[franchise][0];
}

export function getDefaultPathForFranchise(franchise: Franchise): string {
  const defaultSection = getDefaultSectionForFranchise(franchise);
  if (defaultSection === 'overview') return overviewPath();
  return defaultSalesSeasonPath();
}
