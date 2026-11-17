import 'server-only';
import { ReportUnavailable } from '@/lib/server/databricks';
import { demoGalaxySpom } from '@/lib/demo/data';
import type { SpomActor } from '@/lib/auth/galaxy-spom-access';
import type { GalaxySpomReport } from '@/lib/types/galaxy-spom';

export const SPOM_CONTRACT = 'galaxy-spom-report-v2';

export async function loadGalaxySpom(
  actor: SpomActor,
  month: string
): Promise<GalaxySpomReport> {
  const report = demoGalaxySpom(month);
  if (!report) throw new ReportUnavailable('month_unavailable');
  return { ...report, audience: actor.audience };
}
