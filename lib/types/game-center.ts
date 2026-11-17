export interface GameCenterQuery {
  franchise: string;
  season: string;
  season_type: string;
  event_code: string;
}

export interface GameCenterKpis {
  tickets_sold: number;
  paid_tickets: number;
  revenue: number;
  sell_through: number;
  atp: number;
  parking_tickets: number;
  experience_vouchers: number;
  passes: number;
  item_giveaway: number;
}

export interface GameRevenueTrendPoint {
  days_out: number;
  actual_revenue: number;
  tickets_sold: number;
}

export interface ProductRevenueTrendProduct {
  product_id: string;
  label: string;
  display_order?: number;
}

export interface ProductRevenueTrendSeries {
  product_id: string;
  points: GameRevenueTrendPoint[];
}

export interface ProductRevenueTrend {
  products: ProductRevenueTrendProduct[];
  series: ProductRevenueTrendSeries[];
}

export interface PriceLevelInventoryRow {
  price_level: string;
  sold_tickets: number;
  revenue: number;
}

export interface HeatMapCell {
  x: string;
  y: string;
  revenue: number;
  tickets: number;
}

export interface GameCenterHeatMap {
  x_axis_values: string[];
  y_axis_values: string[];
  cells: HeatMapCell[];
}

export interface GameCenterApiResponse {
  franchise: string;
  season: string;
  season_type: string;
  event_code: string;
  event_date: string;
  opponent: string;
  last_updated?: string;
  kpis: GameCenterKpis;
  game_revenue_trend: GameRevenueTrendPoint[];
  product_revenue_trend: ProductRevenueTrend;
  price_level_inventory: PriceLevelInventoryRow[];
  heatmap: GameCenterHeatMap;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function parseGameCenterApiResponse(payload: unknown): GameCenterApiResponse {
  const response = (payload ?? {}) as Record<string, unknown>;
  const rawKpis = (response.kpis ?? {}) as Record<string, unknown>;
  const rawHeatmap = (response.heatmap ?? {}) as Record<string, unknown>;
  const rawTrend = Array.isArray(response.game_revenue_trend) ? response.game_revenue_trend : [];
  const rawProductTrend = (response.product_revenue_trend ?? {}) as Record<string, unknown>;
  const rawProductTrendProducts = Array.isArray(rawProductTrend.products) ? rawProductTrend.products : [];
  const rawProductTrendSeries = Array.isArray(rawProductTrend.series) ? rawProductTrend.series : [];
  const rawPriceLevels = Array.isArray(response.price_level_inventory) ? response.price_level_inventory : [];
  const rawCells = Array.isArray(rawHeatmap.cells) ? rawHeatmap.cells : [];

  return {
    franchise: toString(response.franchise),
    season: toString(response.season),
    season_type: toString(response.season_type),
    event_code: toString(response.event_code),
    event_date: toString(response.event_date),
    opponent: toString(response.opponent),
    last_updated: toString(response.last_updated) || undefined,
    kpis: {
      tickets_sold: toNumber(rawKpis.tickets_sold),
      paid_tickets: toNumber(rawKpis.paid_tickets),
      revenue: toNumber(rawKpis.revenue),
      sell_through: toNumber(rawKpis.sell_through),
      atp: toNumber(rawKpis.atp),
      parking_tickets: toNumber(rawKpis.parking_tickets),
      experience_vouchers: toNumber(rawKpis.experience_vouchers),
      passes: toNumber(rawKpis.passes),
      item_giveaway: toNumber(rawKpis.item_giveaway)
    },
    game_revenue_trend: rawTrend.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        days_out: toNumber(row.days_out),
        actual_revenue: toNumber(row.actual_revenue),
        tickets_sold: toNumber(row.tickets_sold)
      };
    }),
    product_revenue_trend: {
      products: rawProductTrendProducts
        .map((item) => {
          const row = item as Record<string, unknown>;
          return {
            product_id: toString(row.product_id),
            label: toString(row.label),
            display_order: toOptionalNumber(row.display_order)
          };
        })
        .filter((product) => product.product_id.length > 0),
      series: rawProductTrendSeries
        .map((item) => {
          const row = item as Record<string, unknown>;
          const rawPoints = Array.isArray(row.points) ? row.points : [];
          return {
            product_id: toString(row.product_id),
            points: rawPoints.map((pointItem) => {
              const point = pointItem as Record<string, unknown>;
              return {
                days_out: toNumber(point.days_out),
                actual_revenue: toNumber(point.actual_revenue),
                tickets_sold: toNumber(point.tickets_sold)
              };
            })
          };
        })
        .filter((seriesRow) => seriesRow.product_id.length > 0)
    },
    price_level_inventory: rawPriceLevels.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        price_level: toString(row.price_level),
        sold_tickets: toNumber(row.sold_tickets),
        revenue: toNumber(row.revenue)
      };
    }),
    heatmap: {
      x_axis_values: Array.isArray(rawHeatmap.x_axis_values)
        ? rawHeatmap.x_axis_values.map((value) => toString(value)).filter(Boolean)
        : [],
      y_axis_values: Array.isArray(rawHeatmap.y_axis_values)
        ? rawHeatmap.y_axis_values.map((value) => toString(value)).filter(Boolean)
        : [],
      cells: rawCells.map((item) => {
        const cell = item as Record<string, unknown>;
        return {
          x: toString(cell.x),
          y: toString(cell.y),
          revenue: toNumber(cell.revenue),
          tickets: toNumber(cell.tickets)
        };
      })
    }
  };
}
