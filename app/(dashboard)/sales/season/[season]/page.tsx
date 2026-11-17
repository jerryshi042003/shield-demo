import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { resolveSalesSeasonModule } from '@/features/registry/sales-season';

export default async function SalesSeasonPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    notFound();
  }

  const Module = resolveSalesSeasonModule(franchiseResult.franchise);
  return <Module />;
}
