import 'server-only';
import { ReportUnavailable } from '@/lib/server/databricks';
import { demoGalaxySeason } from '@/lib/demo/data';
import type { GalaxySeasonReport } from '@/lib/types/galaxy-season';

export const SEASON_CONTRACT = 'galaxy-season-report-v2';

export async function loadGalaxySeason(
  season = '26REG'
): Promise<GalaxySeasonReport> {
  if (season !== '26REG') throw new ReportUnavailable('season_unavailable');
  return demoGalaxySeason();
}
