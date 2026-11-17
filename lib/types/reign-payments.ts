import type { Franchise } from '@/lib/franchise';

export type ReignPaymentLifecycleRow = {
  status: string;
  label: string;
  orders: number;
};

export type ReignPaymentsData = {
  franchise: Franchise;
  season: string;
  seasonLabel: string;
  asOf: string;
  sourceStatus: 'verified_warehouse_snapshot';
  // "Needs action" = orders whose native payment lifecycle status is Declined.
  needsActionOrders: number;
  declinedAmount: number;
  recoveredOrders: number;
  noActivityOrders: number;
  paidOrders: number;
  totalOrders: number;
  lifecycle: ReignPaymentLifecycleRow[];
  disclosures: string[];
};
