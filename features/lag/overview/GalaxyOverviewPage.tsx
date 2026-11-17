import { demoGalaxySeason } from '@/lib/demo/data';
import { GalaxySeasonSummary } from '@/features/lag/reports/GalaxySeasonSummary';

export default async function GalaxyOverviewPage() {
  return <GalaxySeasonSummary overview initialData={demoGalaxySeason()} />;
}
