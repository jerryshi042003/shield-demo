import 'server-only';
import { demoKpiDaily } from '@/lib/demo/data';

type KPIRecord = ReturnType<typeof demoKpiDaily>[number];

/** Legacy Kings dashboard KPI records (same contract as the former daily blob). */
export function kpiRecords(): KPIRecord[] {
  return [...demoKpiDaily()].sort((a, b) => a.date.localeCompare(b.date));
}

export function kpiRecordFor(date: string | null): KPIRecord {
  const records = kpiRecords();
  return records.find((record) => record.date === date) ?? records[records.length - 1];
}
