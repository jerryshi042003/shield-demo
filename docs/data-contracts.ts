/**
 * Data Contracts - Databricks → Frontend
 *
 * Backend calculates all math (pacing, YoY). Frontend displays.
 * One JSON per page. Frontend consumes directly, no adapters.
 */

// Shared Types

export interface KPIMetric {
    title: string;
    value: number;
    formattedValue: string;
    goal?: number;
    goalFormatted?: string;
    goalPacing?: number;            // decimal: 0.94 = 94%
    trend?: {
        percentChange: number;      // decimal: 0.05 = +5%
        direction: "up" | "down" | "flat";
        comparisonLabel: string;
    };
    history: {                      // Last 7 days for hover tooltips & line graphs
        date: string;               // YYYY-MM-DD
        value: number;
        formattedValue: string;
    }[];
    powerBiLinks?: {
        label: string;
        url: string;
    }[];
}

export interface SocialPlatform {
    platformName: string;
    impressions: number;
    engagementRate: number;         // decimal: 0.032 = 3.2%
    leagueRank?: {
        rank: number;
        totalTeams: number;
    };
}

// Overview Page - /api/shield-overview

export interface OverviewPageData {
    lastUpdated: string;            // ISO timestamp of when JSON was generated
    dataDate: string;                // YYYY-MM-DD - which warehouse date this data represents
    kpis: {
        ticketSalesRevenue: KPIMetric;
        newFSE: KPIMetric;
        fanGrowth: KPIMetric;
    };
    salesPacing: {
        meta: {
            seasonStart: string;
            seasonEnd: string;
        };
        products: {
            fse: PacingSeries;
            group: PacingSeries;
            individual: PacingSeries;
        };
    };
}

export interface PacingSeries {
    meta: {
        revenueGoal: number;
        revenueGoalFormatted: string;
    };
    series: SalesPacingPoint[];
}

export interface SalesPacingPoint {
    date: string;
    dayOfSeason: number;
    actualRevenue: number | null;       // null for future dates
    projectedRevenue: number;
    variance: number;
    variancePercent: number;
}

// Sales Page - /api/shield-sales

export interface SalesPageData {
    lastUpdated: string;            // ISO timestamp of when JSON was generated
    dataDate: string;                // YYYY-MM-DD - which warehouse date this data represents
    seasonKpis: {
        ticketSalesRevenue: KPIMetric;
        newFSE: KPIMetric;
        avgTicketPrice: KPIMetric;
    };
    upcomingGames: UpcomingGame[];
    nextGame: {
        meta: {
            gameId: string;
            opponent: string;
            opponentAbbrev: string;
            date: string;
            time: string;
            formattedDate: string;
            daysUntil: number;
            isHome: boolean;
            themeNight: string | null;
        };
        products: {
            plan: ProductBreakdown;
            group: ProductBreakdown;
            individual: ProductBreakdown;
            other: ProductBreakdown;
        };
    };
}

export interface UpcomingGame {
    gameId: string;
    date: string;
    formattedDate: string;
    opponent: string;
    opponentAbbrev: string;
    isHome: boolean;
    themeNight: string | null;
    metrics: {
        revenue: number;
        revenueFormatted: string;
        ticketsSold: number;
        goalAmount: number;
        percentToGoal: number;
    };
}

export interface ProductBreakdown {
    label: string;
    revenue: number;
    revenueFormatted: string;
    tickets: number;
    atp: number;
    atpFormatted: string;
    history: {                      // Last 7 days for next game product breakdown
        date: string;               // YYYY-MM-DD
        revenue: number;
        revenueFormatted: string;
        tickets: number;
    }[];
}

// Marketing Page - /api/shield-marketing

export interface MarketingPageData {
    lastUpdated: string;            // ISO timestamp of when JSON was generated
    dataDate: string;                // YYYY-MM-DD - which warehouse date this data represents
    kpis: {
        appPowerUsers: KPIMetric;
        socialImpressions: KPIMetric;
        fanGrowth: KPIMetric;
    };
    socialPlatforms: SocialPlatform[];
}
