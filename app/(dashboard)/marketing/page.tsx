import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { resolveMarketingModule } from '@/features/registry/marketing';
import { defaultSalesSeasonPath } from '@/lib/routes';

export default async function MarketingPage() {
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

  const Module = resolveMarketingModule(franchiseResult.franchise);
  return <Module />;
}
