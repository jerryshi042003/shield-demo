import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { demoGalaxySeason } from '@/lib/demo/data';
import { GalaxySeasonSummary } from '@/features/lag/reports/GalaxySeasonSummary';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const selected = resolveFranchiseFromHeaders(await headers());
  if (!selected.ok || selected.franchise !== 'LAG') redirect('/overview');
  return <GalaxySeasonSummary initialData={demoGalaxySeason()} />;
}
