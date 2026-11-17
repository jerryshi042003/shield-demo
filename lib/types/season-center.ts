export interface SeasonCenterQuery {
  franchise: string;
  season: string;
  season_type?: string;
}

export interface SeasonCenterKpis {
  tickets_sold: number;
  paid_tickets: number;
  revenue: number;
  new_fse: number;
  atp: number;
}

export interface SeasonCenterGoals {
  revenue_goal: number;
  revenue_percent_to_goal: number;
  revenue_variance: number;
}

export interface SeasonRevenueTrendPoint {
  day_of_sales_cycle: number;
  actual_revenue: number;
  tickets_sold: number;
}

export interface SeasonProductRevenueTrendProduct {
  product_id: string;
  label: string;
  display_order?: number;
}

export interface SeasonProductRevenueTrendSeries {
  product_id: string;
  points: SeasonRevenueTrendPoint[];
}

export interface SeasonProductRevenueTrend {
  products: SeasonProductRevenueTrendProduct[];
  series: SeasonProductRevenueTrendSeries[];
}

export interface SeasonUpcomingGame {
  event_code: string;
  event_date: string;
  opponent: string;
  theme_night?: string | null;
  days_out?: number | null;
  revenue: number;
  tickets_sold: number;
  game_goal_amount: number;
  percent_to_goal: number;
}

export interface SeasonNextGame {
  event_code: string;
  event_date: string;
  start_time_local?: string | null;
  opponent: string;
  theme_night?: string | null;
  days_out: number;
}

export interface SeasonPriceLevelInventoryRow {
  price_level: string;
  sold_tickets: number;
  revenue: number;
}

export interface SeasonHeatMapCell {
  x: string;
  y: string;
  revenue: number;
  tickets: number;
}

export interface SeasonCenterHeatMap {
  x_axis_values: string[];
  y_axis_values: string[];
  cells: SeasonHeatMapCell[];
}

export interface SeasonAncillaryProducts {
  parking_tickets: number;
  experience_vouchers: number;
  passes: number;
  item_giveaway: number;
}

export interface SeasonCenterApiResponse {
  franchise: string;
  season: string;
  season_type: string;
  season_key: string;
  season_label?: string;
  last_updated?: string;
  kpis: SeasonCenterKpis;
  goals: SeasonCenterGoals;
  season_revenue_trend: SeasonRevenueTrendPoint[];
  product_revenue_trend: SeasonProductRevenueTrend;
  upcoming_games: SeasonUpcomingGame[];
  next_game: SeasonNextGame | null;
  price_level_inventory: SeasonPriceLevelInventoryRow[];
  heatmap: SeasonCenterHeatMap;
  ancillary_products: SeasonAncillaryProducts;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseRevenueTrendPoint(point: unknown): SeasonRevenueTrendPoint {
  const row = point as Record<string, unknown>;
  return {
    day_of_sales_cycle: toNumber(row.day_of_sales_cycle),
    actual_revenue: toNumber(row.actual_revenue),
    tickets_sold: toNumber(row.tickets_sold)
  };
}

export function parseSeasonCenterApiResponse(payload: unknown): SeasonCenterApiResponse {
  const response = (payload ?? {}) as Record<string, unknown>;
  const rawKpis = (response.kpis ?? {}) as Record<string, unknown>;
  const rawGoals = (response.goals ?? {}) as Record<string, unknown>;
  const rawTrend = Array.isArray(response.season_revenue_trend) ? response.season_revenue_trend : [];
  const rawProductTrend = (response.product_revenue_trend ?? {}) as Record<string, unknown>;
  const rawProductTrendProducts = Array.isArray(rawProductTrend.products) ? rawProductTrend.products : [];
  const rawProductTrendSeries = Array.isArray(rawProductTrend.series) ? rawProductTrend.series : [];
  const rawUpcomingGames = Array.isArray(response.upcoming_games) ? response.upcoming_games : [];
  const rawNextGame = (response.next_game ?? null) as Record<string, unknown> | null;
  const rawPriceLevels = Array.isArray(response.price_level_inventory) ? response.price_level_inventory : [];
  const rawHeatMap = (response.heatmap ?? {}) as Record<string, unknown>;
  const rawHeatMapCells = Array.isArray(rawHeatMap.cells) ? rawHeatMap.cells : [];
  const rawAncillaryProducts = (response.ancillary_products ?? {}) as Record<string, unknown>;

  return {
    franchise: toString(response.franchise),
    season: toString(response.season),
    season_type: toString(response.season_type),
    season_key: toString(response.season_key),
    season_label: toString(response.season_label) || undefined,
    last_updated: toString(response.last_updated) || undefined,
    kpis: {
      tickets_sold: toNumber(rawKpis.tickets_sold),
      paid_tickets: toNumber(rawKpis.paid_tickets),
      revenue: toNumber(rawKpis.revenue),
      new_fse: toNumber(rawKpis.new_fse),
      atp: toNumber(rawKpis.atp)
    },
    goals: {
      revenue_goal: toNumber(rawGoals.revenue_goal),
      revenue_percent_to_goal: toNumber(rawGoals.revenue_percent_to_goal),
      revenue_variance: toNumber(rawGoals.revenue_variance)
    },
    season_revenue_trend: rawTrend.map(parseRevenueTrendPoint),
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
        .filter((row) => row.product_id.length > 0),
      series: rawProductTrendSeries
        .map((item) => {
          const row = item as Record<string, unknown>;
          const rawPoints = Array.isArray(row.points) ? row.points : [];
          return {
            product_id: toString(row.product_id),
            points: rawPoints.map(parseRevenueTrendPoint)
          };
        })
        .filter((row) => row.product_id.length > 0)
    },
    upcoming_games: rawUpcomingGames.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        event_code: toString(row.event_code),
        event_date: toString(row.event_date),
        opponent: toString(row.opponent),
        theme_night: toString(row.theme_night) || null,
        days_out: toOptionalNumber(row.days_out) ?? null,
        revenue: toNumber(row.revenue),
        tickets_sold: toNumber(row.tickets_sold),
        game_goal_amount: toNumber(row.game_goal_amount),
        percent_to_goal: toNumber(row.percent_to_goal)
      };
    }),
    next_game: rawNextGame
      ? {
          event_code: toString(rawNextGame.event_code),
          event_date: toString(rawNextGame.event_date),
          start_time_local: toString(rawNextGame.start_time_local) || null,
          opponent: toString(rawNextGame.opponent),
          theme_night: toString(rawNextGame.theme_night) || null,
          days_out: toNumber(rawNextGame.days_out)
        }
      : null,
    price_level_inventory: rawPriceLevels.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        price_level: toString(row.price_level),
        sold_tickets: toNumber(row.sold_tickets),
        revenue: toNumber(row.revenue)
      };
    }),
    heatmap: {
      x_axis_values: Array.isArray(rawHeatMap.x_axis_values)
        ? rawHeatMap.x_axis_values.map((value) => toString(value)).filter(Boolean)
        : [],
      y_axis_values: Array.isArray(rawHeatMap.y_axis_values)
        ? rawHeatMap.y_axis_values.map((value) => toString(value)).filter(Boolean)
        : [],
      cells: rawHeatMapCells.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          x: toString(row.x),
          y: toString(row.y),
          revenue: toNumber(row.revenue),
          tickets: toNumber(row.tickets)
        };
      })
    },
    ancillary_products: {
      parking_tickets: toNumber(rawAncillaryProducts.parking_tickets),
      experience_vouchers: toNumber(rawAncillaryProducts.experience_vouchers),
      passes: toNumber(rawAncillaryProducts.passes),
      item_giveaway: toNumber(rawAncillaryProducts.item_giveaway)
    }
  };
}
