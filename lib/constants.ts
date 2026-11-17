export const SECTIONS = ['overview', 'sales', 'marketing', 'social', 'merch', 'digital', 'ops'] as const;
export type Section = typeof SECTIONS[number];

export const DEFAULT_SECTION: Section = 'overview';

// Production sections: Ready for production with real data
export const PRODUCTION_SECTIONS: Section[] = ['overview', 'sales', 'marketing'];

// Demo sections: Have demo/placeholder functionality but not production-ready
export const DEMO_SECTIONS: Section[] = ['social'];

// Placeholder sections: Minimal functionality, mostly placeholders
export const PLACEHOLDER_SECTIONS: Section[] = ['merch', 'digital', 'ops'];

// Currently visible sections (production sections)
export const VISIBLE_SECTIONS: Section[] = PRODUCTION_SECTIONS;

// Feature flags
export const FEATURES = {
  DATA_FRESHNESS_INDICATORS: true, // Set to false to disable all data freshness indicators
  DATA_FRESHNESS_VERSION: 'business' as 'text' | 'timeline' | 'business' | 'coverage' | 'confidence'
} as const; 