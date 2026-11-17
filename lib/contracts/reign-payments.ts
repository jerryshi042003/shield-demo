import 'server-only';
import { demoReignPayments } from '@/lib/demo/data';

/** Demo: synthetic Reign payment lifecycle counts (see scripts/generate-demo-fixtures.mjs). */
export const REIGN_PAYMENTS_VERIFIED_SNAPSHOT = demoReignPayments();
