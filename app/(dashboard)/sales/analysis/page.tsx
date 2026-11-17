import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { resolveSalesAnalysisModule } from '@/features/registry/sales-analysis';

export default async function SalesAnalysisPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    notFound();
  }

  const Module = resolveSalesAnalysisModule(franchiseResult.franchise);
  return <Module />;
}
