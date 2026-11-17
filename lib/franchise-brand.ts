import type { Franchise } from '@/lib/franchise';

export interface FranchiseBrand {
  displayName: string;
  shortDisplayName: string;
  homeTeamName: string;
  logoPath: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const BRANDS: Record<Franchise, FranchiseBrand> = {
  LAK: {
    displayName: 'Los Angeles Kings',
    shortDisplayName: 'LA KINGS',
    homeTeamName: 'Los Angeles Kings',
    logoPath: '/lak-logo.png',
    theme: {
      primary: '#111827',
      secondary: '#6B7280',
      accent: '#1D4ED8',
    },
  },
  LAG: {
    displayName: 'LA Galaxy',
    shortDisplayName: 'LA GALAXY',
    homeTeamName: 'LA Galaxy',
    logoPath: '/lag-logo.png',
    theme: {
      primary: '#0D1B4C',
      secondary: '#9CA3AF',
      accent: '#FBBF24',
    },
  },
  ONT: {
    displayName: 'Ontario Reign',
    shortDisplayName: 'ONTARIO REIGN',
    homeTeamName: 'Ontario Reign',
    logoPath: '/ont-logo.png',
    theme: {
      primary: '#1F2937',
      secondary: '#9CA3AF',
      accent: '#10B981',
    },
  }
};

export function getFranchiseBrand(franchise: Franchise): FranchiseBrand {
  return BRANDS[franchise];
}
