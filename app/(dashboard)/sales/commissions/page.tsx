import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { defaultSalesSeasonPath } from '@/lib/routes';
import { ReportHoldPage } from '@/features/shared/report-hold/ReportHoldPage';

export const dynamic = 'force-dynamic';

const HELD_MISSING = [
  'Accepted first user and decision (executive visibility, payout validation, or analyst QA)',
  'Person-level identity mapping and a tested server row policy',
  'A non-payout readiness contract signoff from the commission owners'
];

const HELD_SUMMARY =
  'Commission data is maintained in governed Gold, but payout and rep-level figures are payroll-sensitive. Shield keeps them held until the first user and decision are agreed and person-level access is proven; no amounts are shown.';

export default async function CommissionsPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    notFound();
  }

  // Commissions is a per-franchise held report. It appears in the Galaxy, Kings,
  // and Reign canvas navigation; all render the same held state because payout
  // and rep-level figures are payroll-sensitive and access is not yet accepted.
  const contextByFranchise: Partial<Record<string, string>> = {
    LAG: 'Galaxy commission review · held',
    LAK: 'Kings commission review · held',
    ONT: 'Reign commission review · held'
  };
  const context = contextByFranchise[franchiseResult.franchise];
  if (!context) {
    redirect(defaultSalesSeasonPath());
  }

  return (
    <ReportHoldPage
      title="Commissions"
      context={context}
      summary={HELD_SUMMARY}
      missing={HELD_MISSING}
    />
  );
}
