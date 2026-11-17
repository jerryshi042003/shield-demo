import type { Franchise } from '@/lib/franchise';

export type ReignProductSalesRow = {
  category: string;
  items: number;
  netRevenue: number;
};

export type ReignDailySalesData = {
  franchise: Franchise;
  season: string;
  seasonLabel: string;
  asOf: string;
  sourceStatus: 'verified_warehouse_snapshot';
  netRevenue: number;
  activeItems: number;
  canceledItems: number;
  byProduct: ReignProductSalesRow[];
  disclosures: string[];
};
