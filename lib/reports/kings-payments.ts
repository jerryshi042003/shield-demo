import 'server-only';
import { demoKingsPayments } from '@/lib/demo/data';

export const KINGS_PAYMENTS_CONTRACT = 'kings-payments-report-v1';

/** Demo: always configured; data comes from synthetic fixtures. */
export function kingsPaymentsConfiguration() {
  return { environment: 'demo' };
}

export async function loadKingsPayments(_refresh = false) {
  return demoKingsPayments();
}
