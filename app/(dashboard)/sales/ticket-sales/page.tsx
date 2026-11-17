import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import KingsTicketSales from '@/features/lak/sales/KingsTicketSales';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';

export const dynamic = 'force-dynamic';

export default async function KingsTicketSalesPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required')
      redirect('/select-franchise');
    notFound();
  }

  if (franchiseResult.franchise !== 'LAK') notFound();
  return <KingsTicketSales />;
}
