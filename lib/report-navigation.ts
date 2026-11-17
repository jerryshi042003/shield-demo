import type { Franchise } from '@/lib/franchise';
import {
  defaultSalesGamePath,
  defaultSalesSeasonPath,
  kingsTicketSalesPath,
  salesAnalysisPath,
  salesDailySalesPath,
  salesPaymentsPath
} from '@/lib/routes';

export type ReportNavigationItem = {
  id: string;
  label: string;
  href: string;
};

/**
 * Exact sales report names revealed under the Sales tab, per franchise. Galaxy
 * exposes only accepted permanent reports. Unreleased routes fail closed and
 * stay out of navigation instead of looking like broken product screens.
 * SPOM still resolves its manager or representative scope from identity;
 * navigation never selects data scope.
 */
const SALES_REPORTS: Record<Franchise, ReportNavigationItem[]> = {
  LAK: [
    {
      id: 'ticket-sales',
      label: 'Ticket Sales',
      href: kingsTicketSalesPath()
    },
    { id: 'games', label: 'Games', href: defaultSalesGamePath() },
    { id: 'payments', label: 'Payments', href: salesPaymentsPath() },
    { id: 'sales-analysis', label: 'Sales Analysis', href: salesAnalysisPath() }
  ],
  LAG: [
    {
      id: 'spom',
      label: 'Salesperson of the Month',
      href: '/sales/spom'
    },
    {
      id: 'season-summary',
      label: 'Season Summary',
      href: '/sales/season-summary'
    }
  ],
  ONT: [
    { id: 'sales', label: 'Sales', href: defaultSalesSeasonPath() },
    { id: 'daily-sales', label: 'Daily Sales', href: salesDailySalesPath() },
    { id: 'payments', label: 'Payments', href: salesPaymentsPath() }
  ]
};

export function getSalesReportNavigation(
  franchise: Franchise
): ReportNavigationItem[] {
  return SALES_REPORTS[franchise];
}
