import 'server-only';
import { demoReignDailySales } from '@/lib/demo/data';

/** Demo: synthetic Reign net sales by product (see scripts/generate-demo-fixtures.mjs). */
export const REIGN_DAILY_SALES_VERIFIED_SNAPSHOT = demoReignDailySales();
