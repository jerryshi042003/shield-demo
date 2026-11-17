import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { getDefaultPathForFranchise } from '@/lib/franchise-navigation';
import { defaultSalesSeasonPath } from '@/lib/routes';

export default async function DashboardRootPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    redirect(defaultSalesSeasonPath());
  }

  redirect(getDefaultPathForFranchise(franchiseResult.franchise));
}
