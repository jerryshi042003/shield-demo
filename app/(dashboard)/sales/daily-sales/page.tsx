import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { defaultSalesSeasonPath } from '@/lib/routes';
import ReignDailySalesPage from '@/features/ont/daily-sales/ReignDailySalesPage';

export const dynamic = 'force-dynamic';

export default async function DailySalesPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    notFound();
  }

  // Reign-scoped daily-sales report; other franchises are sent to their default
  // sales surface rather than shown an empty or fabricated page.
  if (franchiseResult.franchise !== 'ONT') {
    redirect(defaultSalesSeasonPath());
  }

  return <ReignDailySalesPage />;
}
