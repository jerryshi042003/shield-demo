import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { GalaxySpomReport } from '@/features/lag/spom/GalaxySpomReport';
import { authorizeGalaxySpom } from '@/lib/auth/galaxy-spom-access';
import { demoGalaxySpom, SPOM_DEFAULT_MONTH } from '@/lib/demo/data';

export const dynamic = 'force-dynamic';

export default async function GalaxySpomPage() {
  const actor = authorizeGalaxySpom(await headers());
  if (!actor) redirect('/overview');
  return (
    <GalaxySpomReport audience={actor.audience} defaultMonth={SPOM_DEFAULT_MONTH} initialData={demoGalaxySpom(SPOM_DEFAULT_MONTH) ?? undefined} />
  );
}
