import type { Franchise } from '@/lib/franchise';

export type KingsPaymentLifecycleRow = {
  status: string;
  label: string;
  orders: number;
};

export type KingsPaymentsData = {
  franchise: Franchise;
  season: string;
  seasonLabel: string;
  queriedAt: string;
  expiresAt: string;
  sourceStatus: 'live_warehouse_aggregate';
  // "Needs action" = orders whose native payment lifecycle status is Declined.
  needsActionOrders: number;
  declinedAmount: number;
  recoveredOrders: number;
  noActivityOrders: number;
  paidOrders: number;
  totalOrders: number;
  lifecycle: KingsPaymentLifecycleRow[];
};
