import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { defaultSalesSeasonPath } from '@/lib/routes';
import KingsPaymentsPage from '@/features/lak/payments/KingsPaymentsPage';
import ReignPaymentsPage from '@/features/ont/payments/ReignPaymentsPage';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    notFound();
  }

  // Payments is a per-franchise report. The trusted franchise selects the
  // franchise-specific module (each backed by its own accepted contract and
  // release flag); franchises without a payments report are sent to their
  // default sales surface rather than shown an empty or fabricated page.
  switch (franchiseResult.franchise) {
    case 'LAK':
      return <KingsPaymentsPage />;
    case 'ONT':
      return <ReignPaymentsPage />;
    default:
      redirect(defaultSalesSeasonPath());
  }
}
