// Context-aware KPI info links. Production linked internal Power BI reports; the public demo links nowhere.

export const POWER_BI_DASHBOARDS = {
  KPI: {
    name: "KPI Dashboard",
    description: "View KPI Dashboard",
    url: "#"
  },
  TICKET_SALES: {
    name: "Ticket Sales Report",
    description: "View Ticket Sales Report",
    url: "#"
  },
  SALES_PACING: {
    name: "Sales Pacing Curve",
    description: "View Sales Pacing Curve",
    url: "#"
  },
  GAMES_REPORT: {
    name: "Games Report",
    description: "View Games Report",
    url: "#"
  }
} as const;

export const KPI_INFO_LINKS = {
  // Overview section - Only KPI dashboard (focused health check)
  overview: {
    // Legacy metrics
    'Ticket Sales Revenue': {
      title: '',
      blurb: 'View detailed ticket sales revenue analytics and trends in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [POWER_BI_DASHBOARDS.KPI],
    },
    'Known Fans': {
      title: '',
      blurb: 'View fan engagement and database growth analytics in Power BI.',
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Impressions (Organic)': {
      title: '',
      blurb: 'View social media performance and organic reach metrics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [POWER_BI_DASHBOARDS.KPI],
    },

    // NEW: Preseason-focused metrics
    'Ticket Sales\nRevenue': {
      title: '',
      blurb: 'View detailed ticket sales revenue and goal pacing analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'New FSE': {
      title: '',
      blurb: 'View full season equivalent sales and goal pacing analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Instagram\nImpressions': {
      title: '',
      blurb: 'View Instagram performance and engagement analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [POWER_BI_DASHBOARDS.KPI],
    },
    'App Power\nUsers': {
      title: '',
      blurb: 'View mobile app engagement and user analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [POWER_BI_DASHBOARDS.KPI],
    },
  },
  
  // Sales section - All three dashboards for comprehensive sales context
  sales: {
    // New preseason metrics
    'Net Full Season\nTickets Sold': {
      title: '',
      blurb: 'View full season ticket sales and goal pacing analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Full-Season\nDeposits': {
      title: '',
      blurb: 'View full season deposit tracking and conversion analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'App Power\nUsers': {
      title: '',
      blurb: 'View mobile app engagement and user analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Unique Website\nSessions': {
      title: '',
      blurb: 'View website traffic and user engagement analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },

    // Legacy metrics (fallback for demo data)
    'Ticket Sales Revenue': {
      title: '',
      blurb: 'View detailed ticket sales revenue analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'New FSE (25\'-26\')': {
      title: '',
      blurb: 'View full season equivalent sales analytics for 2025-26 in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'ATP': {
      title: '',
      blurb: 'View average ticket price analytics and trends in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },

    // Next Game Ticket Breakdown
    'Group\nTickets': {
      title: '',
      blurb: 'View group ticket sales and revenue analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.GAMES_REPORT,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Individual\nTickets': {
      title: '',
      blurb: 'View individual ticket sales and revenue analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.GAMES_REPORT,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Other\nTickets': {
      title: '',
      blurb: 'View other ticket categories and analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.GAMES_REPORT,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Plan\nTickets': {
      title: '',
      blurb: 'View season ticket plan holder analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.GAMES_REPORT,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },
    'Total\nTickets': {
      title: '',
      blurb: 'View total ticket sales analytics across all categories in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.GAMES_REPORT,
        POWER_BI_DASHBOARDS.TICKET_SALES
      ],
    },

    // Revenue-focused versions (for SalesPageDemo next game section)
    'Group\nRevenue': {
      title: '',
      blurb: 'View group ticket revenue analytics for this game in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.TICKET_SALES,
        POWER_BI_DASHBOARDS.GAMES_REPORT
      ],
    },
    'Individual\nRevenue': {
      title: '',
      blurb: 'View individual ticket revenue analytics for this game in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.TICKET_SALES,
        POWER_BI_DASHBOARDS.GAMES_REPORT
      ],
    },
    'Other\nRevenue': {
      title: '',
      blurb: 'View other ticket revenue analytics for this game in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.TICKET_SALES,
        POWER_BI_DASHBOARDS.GAMES_REPORT
      ],
    },
    'Plan\nRevenue': {
      title: '',
      blurb: 'View season ticket plan revenue analytics for this game in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.TICKET_SALES,
        POWER_BI_DASHBOARDS.GAMES_REPORT
      ],
    },
    'Total\nRevenue': {
      title: '',
      blurb: 'View total ticket revenue analytics for this game in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.TICKET_SALES,
        POWER_BI_DASHBOARDS.GAMES_REPORT
      ],
    },
  },
  
  // Marketing section - KPI dashboard only for marketing metrics
  marketing: {
    'Known Fans': {
      title: '',
      blurb: 'View fan engagement and database growth analytics in Power BI.',
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI
      ],
    },
    'Instagram\nImpressions': {
      title: '',
      blurb: 'View Instagram performance and engagement analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI
      ],
    },
    'App Power\nUsers': {
      title: '',
      blurb: 'View mobile app engagement and user analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [
        POWER_BI_DASHBOARDS.KPI
      ],
    },
  },

  // Social section - KPI dashboard for social metrics
  social: {
    'Social Impressions': {
      title: '',
      blurb: 'View social media performance and reach analytics in Power BI.',
      metrics: [],
      freshness: '',
      dashboards: [POWER_BI_DASHBOARDS.KPI],
    },
  },
} as const; 