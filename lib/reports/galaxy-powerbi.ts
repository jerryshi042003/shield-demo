/**
 * Production Shield linked these Galaxy pages to internal Power BI reports.
 * The public demo keeps the page design but links nowhere internal.
 */
export const GALAXY_POWER_BI_REPORTS = {
  seasonSummary: { name: 'Season Summary (internal Power BI, not in demo)', url: '#' },
  spom: { name: 'Sales Standings (internal Power BI, not in demo)', url: '#' },
  marketing: { name: 'Galaxy Marketing (internal Power BI, not in demo)', url: '#' },
  renewals: { name: 'Renewal Tracker (internal Power BI, not in demo)', url: '#' }
} as const;
