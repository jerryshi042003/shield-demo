import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { resolveOverviewModule } from '@/features/registry/overview';
import { defaultSalesSeasonPath } from '@/lib/routes';

export default async function OverviewPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    notFound();
  }
  if (franchiseResult.franchise === 'ONT') {
    redirect(defaultSalesSeasonPath());
  }
  const Module = resolveOverviewModule(franchiseResult.franchise);
  return <Module />;
}
