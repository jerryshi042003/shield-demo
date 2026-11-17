import { Section } from '@/lib/constants';

export interface SearchableItemConfig {
  id: string;
  displayName: string;
  section: Section;
  type: 'card' | 'graph';
  keywords: string[];
  priority: number;
}

/**
 * Centralized source of truth for all searchable items in the dashboard.
 * This config is used by both:
 * 1. Static search index (for instant search on page load)
 * 2. Dynamic component registrations (for keeping search in sync with mounted components)
 *
 * Adding a new searchable item:
 * 1. Add it to the appropriate section below
 * 2. Import SEARCHABLE_ITEMS in your component
 * 3. Call useSearchableHeader(SEARCHABLE_ITEMS.section.itemName)
 * 4. Ensure your component has an HTML element with matching ID
 */
export const SEARCHABLE_ITEMS = {
  overview: {
    seasonSummary: {
      id: 'season-summary',
      displayName: 'Sales Health Check',
      section: 'overview' as Section,
      type: 'card' as const,
      keywords: ['kpi', 'metrics', 'season', 'summary', 'health'],
      priority: 10
    },
    salesPacingChart: {
      id: 'sales-pacing-chart',
      displayName: 'Sales Pacing',
      section: 'overview' as Section,
      type: 'graph' as const,
      keywords: ['chart', 'pacing', 'trend', 'revenue'],
      priority: 9
    }
  },
  sales: {
    seasonCenterSelector: {
      id: 'season-center-selector',
      displayName: 'Season Command Center',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['season', 'command center', 'season type', 'selector'],
      priority: 10
    },
    seasonCenterKpis: {
      id: 'season-center-kpis',
      displayName: 'Season KPIs',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['season', 'kpi', 'tickets sold', 'revenue', 'new fse', 'atp'],
      priority: 9
    },
    seasonCenterPacing: {
      id: 'season-center-pacing',
      displayName: 'Season Revenue Trend',
      section: 'sales' as Section,
      type: 'graph' as const,
      keywords: ['season', 'revenue', 'trend', 'line'],
      priority: 9
    },
    recentGames: {
      id: 'recent-games',
      displayName: 'Upcoming Games',
      section: 'sales' as Section,
      type: 'graph' as const,
      keywords: ['games', 'upcoming', 'revenue', 'trend'],
      priority: 9
    },
    nextGame: {
      id: 'next-game',
      displayName: 'Next Game',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['next', 'game', 'matchup', 'tickets'],
      priority: 8
    },
    seasonCenterPriceLevels: {
      id: 'season-center-price-levels',
      displayName: 'Season Price Level Inventory',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['season', 'price level', 'inventory', 'tickets'],
      priority: 8
    },
    seasonCenterChannelMix: {
      id: 'season-center-channel-mix',
      displayName: 'Season Product x Price Level Heat Map',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['season', 'heat map', 'product', 'price level', 'revenue', 'tickets', 'matrix'],
      priority: 8
    },
    seasonCenterAncillaryProducts: {
      id: 'season-center-ancillary-products',
      displayName: 'Season Ancillary Products',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['season', 'ancillary', 'products', 'parking tickets', 'experience vouchers', 'passes', 'item giveaway'],
      priority: 7
    },
    gameSummary: {
      id: 'game-summary',
      displayName: 'Game Summary',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['game', 'summary', 'table', 'ticket', 'price code', 'analysis'],
      priority: 6
    },
    gameCenterSelector: {
      id: 'game-center-selector',
      displayName: 'Game Command Center',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['game', 'selector', 'matchup', 'command center'],
      priority: 8
    },
    gameCenterKpis: {
      id: 'game-center-kpis',
      displayName: 'Game KPIs',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['kpi', 'game', 'tickets sold', 'sell through', 'atp'],
      priority: 8
    },
    gameCenterPacing: {
      id: 'game-center-pacing',
      displayName: 'Game Revenue Trend',
      section: 'sales' as Section,
      type: 'graph' as const,
      keywords: ['game', 'revenue', 'trend', 'line', 'pacing'],
      priority: 7
    },
    gameCenterPriceLevels: {
      id: 'game-center-price-levels',
      displayName: 'Price Level Inventory',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['price level', 'inventory', 'sell through'],
      priority: 7
    },
    gameCenterChannelMix: {
      id: 'game-center-channel-mix',
      displayName: 'Product x Price Level Heat Map',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['heat map', 'product', 'price level', 'revenue', 'tickets', 'matrix'],
      priority: 7
    },
    gameCenterAncillaryProducts: {
      id: 'game-center-ancillary-products',
      displayName: 'Ancillary Products',
      section: 'sales' as Section,
      type: 'card' as const,
      keywords: ['ancillary', 'products', 'parking tickets', 'experience vouchers', 'passes', 'item giveaway', 'non-ticketing'],
      priority: 7
    }
  },
  marketing: {
    fanEngagement: {
      id: 'fan-engagement',
      displayName: 'Marketing Engagement',
      section: 'marketing' as Section,
      type: 'card' as const,
      keywords: ['fan', 'engagement', 'marketing', 'social'],
      priority: 8
    },
    socialMedia: {
      id: 'social-media',
      displayName: 'Social Media Performance',
      section: 'marketing' as Section,
      type: 'card' as const,
      keywords: ['social', 'media', 'impressions', 'platforms'],
      priority: 7
    },
    platformPerformance: {
      id: 'platform-performance',
      displayName: 'Platform Performance Metrics',
      section: 'marketing' as Section,
      type: 'graph' as const,
      keywords: ['platform', 'performance', 'metrics', 'positioning'],
      priority: 6
    }
  }
};

/**
 * Helper function to get all searchable items as a flat array.
 * Used by the static search index for instant search on page load.
 */
export function getAllSearchableItems(): SearchableItemConfig[] {
  const items: SearchableItemConfig[] = [];

  for (const section of Object.values(SEARCHABLE_ITEMS)) {
    for (const item of Object.values(section)) {
      items.push(item as SearchableItemConfig);
    }
  }

  return items;
}

/**
 * Groups search results by section for organized display.
 * Used by the search component to display results in categorized groups.
 */
export function groupSearchResults(items: SearchableItemConfig[]):
  { section: string; items: SearchableItemConfig[] }[] {
  const groups: Record<string, SearchableItemConfig[]> = {};
  for (const item of items) {
    const sectionName = item.section.charAt(0).toUpperCase() + item.section.slice(1);
    if (!(sectionName in groups)) groups[sectionName] = [];
    groups[sectionName].push(item);
  }

  return Object.entries(groups).map(([section, items]) => ({ section, items }));
}
