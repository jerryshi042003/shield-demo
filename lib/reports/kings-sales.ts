import 'server-only';
import { demoKingsSales } from '@/lib/demo/data';

/** Demo: always configured; data comes from synthetic fixtures. */
export function kingsSalesConfiguration() {
  return { environment: 'demo' };
}

export async function loadKingsSales(_refresh = false) {
  return demoKingsSales();
}
