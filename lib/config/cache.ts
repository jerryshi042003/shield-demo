/**
 * Centralized cache configuration for consistent cache durations across the app
 * All durations are in milliseconds
 */

export const CACHE_CONFIG = {
  // API Route server-side cache durations
  KPI_DATA: 5 * 60 * 1000,           // 5 minutes - KPI data from blob storage
  KPI_PARSED_DATA: 15 * 60 * 1000,   // 15 minutes - parsed NDJSON (expensive operation)
  SCHEDULE_DATA: 15 * 60 * 1000,     // 15 minutes - schedule data (changes infrequently)  
  GLOSSARY_DATA: 10 * 60 * 1000,     // 10 minutes - glossary/definition data
  ENV_VALIDATION: 5 * 60 * 1000,     // 5 minutes - environment validation results
  HISTORICAL_DATA: 10 * 60 * 1000,   // 10 minutes - historical KPI data
  DATE_RANGES: 10 * 60 * 1000,       // 10 minutes - available date ranges

  // Hook-level cache durations (client-side)
  DASHBOARD_METRICS: 60 * 1000,      // 1 minute - dashboard metrics hook
  TREND_DATA: 5 * 60 * 1000,         // 5 minutes - trend data hook
  SCHEDULE_HOOK: 5 * 60 * 1000,      // 5 minutes - schedule data hook
  GLOSSARY_HOOK: 5 * 60 * 1000,      // 5 minutes - glossary hook

  // Browser cache control headers (in seconds, not milliseconds)
  BROWSER_CACHE: {
    KPI_DATA: 300,        // 5 minutes (max-age)
    STALE_REVALIDATE: 600, // 10 minutes (stale-while-revalidate)
    SCHEDULE: 900,        // 15 minutes
    GLOSSARY: 600,        // 10 minutes
  }
} as const;

export type CacheConfigKey = keyof typeof CACHE_CONFIG;
export type BrowserCacheKey = keyof typeof CACHE_CONFIG.BROWSER_CACHE;