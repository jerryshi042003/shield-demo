'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, Cell, LabelList, Line, CartesianGrid } from 'recharts';
import { getTeamLogo, getLocalFallback } from '@/lib/utils/teamLogos';
import { type GameSummaryQuery, useGameSummaryData } from '@/lib/hooks/useGameSummaryData';
import { useGameCenterData } from '@/lib/hooks/useGameCenterData';
import { useSeasonCenterData } from '@/lib/hooks/useSeasonCenterData';
import { useReferenceSchedules } from '@/app/(dashboard)/reference-schedules-context';
import { useFranchise } from '@/app/(dashboard)/franchise-context';
import { getFranchiseBrand } from '@/lib/franchise-brand';
import { formatGameDate, calculateDaysUntil } from '@/lib/utils/formatGameTime';
import { InfoIconButton } from '@/components/ui/info-icon-button';
import { useSearchableHeader } from '@/app/(dashboard)/header-registry';
import { SEARCHABLE_ITEMS } from '@/config/searchable-items';
import { GameSummaryTable } from '@/components/sections/GameSummaryTable';
import { HeatMapMatrix, type HeatMapCellValue } from '@/components/charts/HeatMapMatrix';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import {
  DEFAULT_SALES_SEASON_PARAM,
  defaultSalesGamePath,
  isDefaultSalesEventParam,
  parseSalesAnalysisQuery,
  salesAnalysisPath,
  eventCodeFromSalesPath,
  salesGamePath,
  salesSeasonPath,
  salesViewFromPathname,
  seasonFromSalesPath,
  type SalesAnalysisRouteQuery,
  type SalesView
} from '@/lib/routes';


// Interface for ticket demand data
interface TicketDemandData {
  gameDate: string;
  opponent: string;
  displayLabel: string;
  attendancePercent: number;
  ticketsSold: number;
  revenue: number;
  isHome: boolean;
  hasTheme: boolean;
  theme?: string;
  game_goal_amount?: number;
  percent_to_goal?: number;
}

interface GameSelectorOption {
  season: string;
  seasonType: string;
  seasonKey: string;
  eventCode: string;
  eventDate: string;
  opponent: string;
  themeNight: string;
  daysOut: number;
}

interface GameKpiCard {
  label: string;
  value: string;
  delta?: string;
  deltaTone: 'positive' | 'negative' | 'neutral';
}

interface GameRevenueTrendChartPoint {
  daysOut: number;
  actualRevenue: number;
  ticketsSold: number;
}

interface SeasonRevenueTrendChartPoint {
  dayOfSeason: number;
  actualRevenue: number;
  ticketsSold: number;
}

interface GameRevenueTrendProductOption {
  id: string;
  label: string;
  displayOrder: number;
}

type GameRevenueRangeKey = 'ALL' | '12M' | '6M' | '90D' | '30D';
type UpcomingGamesRangeKey = 'ALL' | '20' | '10';

const GAME_REVENUE_RANGE_OPTIONS: Array<{ key: GameRevenueRangeKey; label: string }> = [
  { key: 'ALL', label: 'All time' },
  { key: '12M', label: '12 months' },
  { key: '6M', label: '6 months' },
  { key: '90D', label: '90 days' },
  { key: '30D', label: '30 days' }
];

const GAME_REVENUE_RANGE_MAX_DAYS: Record<Exclude<GameRevenueRangeKey, 'ALL'>, number> = {
  '12M': 365,
  '6M': 183,
  '90D': 90,
  '30D': 30
};

const UPCOMING_GAMES_RANGE_OPTIONS: Array<{ key: UpcomingGamesRangeKey; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: '20', label: '20' },
  { key: '10', label: '10' }
];

const UPCOMING_GAMES_RANGE_LIMITS: Record<Exclude<UpcomingGamesRangeKey, 'ALL'>, number> = {
  '20': 20,
  '10': 10
};

// Custom X-axis tick component - simplified to just show dates
const CustomXAxisTick = (props: { x?: number; y?: number; payload?: { value?: string } }) => {
  const { x = 0, y = 0, payload } = props;

  if (!payload?.value) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Date label */}
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        fill="#6B7280"
        fontSize={10}
      >
        {payload.value}
      </text>
    </g>
  );
};

// Custom logo label for bars - positioned below each bar by Recharts
const CustomLogoLabel = (props: { x?: number; y?: number; width?: number; height?: number; value?: string; index?: number }) => {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;

  if (!value || typeof value !== 'string') return null;

  const logoUrl = getTeamLogo(value);
  if (!logoUrl) return null;

  const centerX = x + width / 2;
  const logoY = y + height + 28;

  return (
    <image
      x={centerX - 12} // Center the 24px logo
      y={logoY}
      width={24}
      height={24}
      href={logoUrl}
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

// ✅ REMOVED: Hardcoded demoPacingData - Now using real data from blob storage via useNextGamePacing hook

// Custom tooltip for ticket demand chart - executive-friendly with full details
interface DemandTooltipPayloadEntry {
  payload: TicketDemandData;
}

interface DemandTooltipProps {
  active?: boolean;
  payload?: DemandTooltipPayloadEntry[];
  label?: string;
}

const DemandTooltip = ({ active, payload }: DemandTooltipProps) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    // Parse as local date to avoid timezone issues
    const [year, month, day] = data.gameDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl min-w-[320px]">
        <div className="space-y-3">
          {/* Game Header */}
          <div className="border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              <Image
                src={getTeamLogo(data.opponent)}
                alt={`${data.opponent} logo`}
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallback = getLocalFallback(data.opponent);
                  if (fallback) target.src = fallback;
                }}
              />
              <p className="text-base font-bold text-gray-900">
                vs {data.opponent}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
          </div>

          {/* Revenue and Metrics */}
          <div className="space-y-3">
            {/* Revenue - Original Blue Styling */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-base font-bold text-blue-600">${(data.revenue / 1000000).toFixed(2)}M</span>
            </div>

            {/* Game Goal and Percent to Goal - show whenever a value is provided, including 0 */}
            {(() => {
              const gameGoalAmount = data.game_goal_amount;
              const percentToGoal = data.percent_to_goal;
              const hasGameGoalAmount = typeof gameGoalAmount === 'number' && Number.isFinite(gameGoalAmount);
              const hasPercentToGoal = typeof percentToGoal === 'number' && Number.isFinite(percentToGoal);

              if (!hasGameGoalAmount) {
                return null;
              }

              return (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Game Goal</span>
                  <span className="text-base font-semibold text-gray-700">${(gameGoalAmount / 1000000).toFixed(2)}M</span>
                </div>

                {hasPercentToGoal && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">To Goal</span>
                    <span
                      className={`text-base font-semibold ${
                        percentToGoal >= 100 ? 'text-green-600' :
                        percentToGoal >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}
                    >
                      {percentToGoal.toFixed(1)}%
                    </span>
                  </div>
                )}
              </>
              );
            })()}

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600">Tickets Sold</span>
              <span className="text-base font-semibold text-gray-900">{data.ticketsSold.toLocaleString()}</span>
            </div>
          </div>

          {/* Theme Night - only show if applicable */}
          {data.hasTheme && data.theme && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Theme: {data.theme}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Calculate "nice" rounded maximum for Y-axis with tighter intervals
const calculateNiceMax = (maxValue: number): number => {
  if (maxValue === 0) return 1000000; // Default to 1M if no data

  // Add 10% buffer to max value
  const buffered = maxValue * 1.1;

  // Round up to next nice interval with finer granularity
  const magnitude = Math.pow(10, Math.floor(Math.log10(buffered)));
  const normalized = buffered / magnitude;

  let niceValue;
  if (normalized <= 1.2) {
    niceValue = 1.2;
  } else if (normalized <= 1.5) {
    niceValue = 1.5;
  } else if (normalized <= 2.0) {
    niceValue = 2.0;
  } else if (normalized <= 2.5) {
    niceValue = 2.5;
  } else if (normalized <= 3.0) {
    niceValue = 3.0;
  } else if (normalized <= 4.0) {
    niceValue = 4.0;
  } else if (normalized <= 5.0) {
    niceValue = 5.0;
  } else {
    niceValue = 10;
  }

  return niceValue * magnitude;
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

const formatSeasonLabel = (seasonCode: string) => {
  const match = seasonCode.match(/^(\d{2})(\d{2})([A-Z]+)$/);
  if (!match) return seasonCode;

  const [, startYY, endYY, seasonType] = match;
  const startYear = 2000 + Number.parseInt(startYY, 10);
  const seasonTextByType: Record<string, string> = {
    PRE: 'Pre-season',
    REG: 'Regular Season',
    POST: 'Playoffs',
    PST: 'Playoffs'
  };
  const seasonText = seasonTextByType[seasonType] ?? seasonType;

  return `${startYear}-${endYY} ${seasonText}`;
};

const formatSeasonDisplay = (season: string) => {
  const normalized = season.trim();
  if (!/^\d{4}$/.test(normalized)) return normalized;
  const startYear = 2000 + Number.parseInt(normalized.slice(0, 2), 10);
  const endYY = normalized.slice(2);
  return `${startYear}-${endYY}`;
};

const formatSeasonTypeLabel = (seasonType: string) => {
  const normalized = seasonType.trim().toUpperCase();
  if (normalized === 'PRE') return 'Pre-season';
  if (normalized === 'REG') return 'Regular Season';
  if (normalized === 'POST' || normalized === 'PST') return 'Playoffs';
  return seasonType;
};

const formatStartTimeLabel = (startTimeLocal: string | null | undefined) => {
  const value = startTimeLocal?.trim();
  if (!value) return 'TBD';
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const hour24 = Number.parseInt(match[1], 10);
  const minute = match[2];
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period} PST`;
};

const formatProductLabel = (productId: string) =>
  productId
    .trim()
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const isExcludedTrendProduct = (productId: string, label?: string) =>
  productId.trim().toUpperCase() === 'COMP' || (label?.trim().toUpperCase() ?? '') === 'COMP';

const withTrimmedFallback = (value: string | null | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const SALES_ANALYSIS_DEFAULT_DAYS_OUT = ['0_7', '8_14', '15_30', '31_PLUS'] as const;
const GAME_ROUTE_NOTICE_STORAGE_KEY = 'sales.game.route.notice';

function parseSortRules(sortValues: string[] | undefined): Array<{ field: string; direction: 'asc' | 'desc' }> {
  if (!sortValues || sortValues.length === 0) return [{ field: 'event_date', direction: 'asc' }];

  const parsed = sortValues
    .map((value) => {
      const [fieldRaw = '', directionRaw = 'asc'] = value.split(':');
      const field = fieldRaw.trim();
      if (!field) return null;
      const direction = directionRaw.trim().toLowerCase() === 'desc' ? 'desc' : 'asc';
      return { field, direction } as { field: string; direction: 'asc' | 'desc' };
    })
    .filter((item): item is { field: string; direction: 'asc' | 'desc' } => item !== null);

  return parsed.length > 0 ? parsed : [{ field: 'event_date', direction: 'asc' }];
}

function buildGameSummaryQueryFromRoute(
  baseQuery: GameSummaryQuery,
  routeQuery: SalesAnalysisRouteQuery
): GameSummaryQuery {
  return {
    ...baseQuery,
    filters: {
      ...baseQuery.filters,
      season: routeQuery.season && routeQuery.season.length > 0 ? routeQuery.season : baseQuery.filters.season,
      season_type:
        routeQuery.season_type && routeQuery.season_type.length > 0
          ? routeQuery.season_type
          : baseQuery.filters.season_type,
      event_date_start:
        routeQuery.event_date_start !== undefined ? routeQuery.event_date_start : baseQuery.filters.event_date_start,
      event_date_end:
        routeQuery.event_date_end !== undefined ? routeQuery.event_date_end : baseQuery.filters.event_date_end,
      days_out_category:
        routeQuery.days_out_category && routeQuery.days_out_category.length > 0
          ? routeQuery.days_out_category
          : baseQuery.filters.days_out_category,
      sales_days_out_max:
        routeQuery.sales_days_out_max !== undefined
          ? routeQuery.sales_days_out_max
          : baseQuery.filters.sales_days_out_max,
      price_level:
        routeQuery.price_level && routeQuery.price_level.length > 0
          ? routeQuery.price_level
          : baseQuery.filters.price_level,
      event_day_of_week:
        routeQuery.event_day_of_week && routeQuery.event_day_of_week.length > 0
          ? routeQuery.event_day_of_week
          : baseQuery.filters.event_day_of_week,
      opponent:
        routeQuery.opponent && routeQuery.opponent.length > 0 ? routeQuery.opponent : baseQuery.filters.opponent
    },
    date_preset: routeQuery.date_preset ?? baseQuery.date_preset,
    sort: parseSortRules(routeQuery.sort),
    pagination: {
      page: routeQuery.page ?? baseQuery.pagination.page,
      page_size: routeQuery.page_size ?? baseQuery.pagination.page_size
    }
  };
}

function buildRouteQueryFromGameSummary(query: GameSummaryQuery): SalesAnalysisRouteQuery {
  const routeQuery: SalesAnalysisRouteQuery = {};

  if (query.filters.season.length > 0 && !query.filters.season.includes('ALL')) {
    routeQuery.season = query.filters.season;
  }
  if (query.filters.season_type.length > 0 && !query.filters.season_type.includes('ALL')) {
    routeQuery.season_type = query.filters.season_type;
  }
  if (query.date_preset !== 'ALL') {
    routeQuery.date_preset = query.date_preset;
  }
  if (query.filters.event_date_start) {
    routeQuery.event_date_start = query.filters.event_date_start;
  }
  if (query.filters.event_date_end) {
    routeQuery.event_date_end = query.filters.event_date_end;
  }
  if (
    query.filters.days_out_category.length > 0 &&
    JSON.stringify(query.filters.days_out_category) !== JSON.stringify(SALES_ANALYSIS_DEFAULT_DAYS_OUT)
  ) {
    routeQuery.days_out_category = query.filters.days_out_category;
  }
  if (typeof query.filters.sales_days_out_max === 'number') {
    routeQuery.sales_days_out_max = query.filters.sales_days_out_max;
  }
  if (query.filters.price_level.length > 0 && !query.filters.price_level.includes('ALL')) {
    routeQuery.price_level = query.filters.price_level;
  }
  if (query.filters.event_day_of_week.length > 0 && !query.filters.event_day_of_week.includes('ALL')) {
    routeQuery.event_day_of_week = query.filters.event_day_of_week;
  }
  if (query.filters.opponent.length > 0 && !query.filters.opponent.includes('ALL')) {
    routeQuery.opponent = query.filters.opponent;
  }
  if (query.sort.length > 0 && !(query.sort.length === 1 && query.sort[0].field === 'event_date' && query.sort[0].direction === 'asc')) {
    routeQuery.sort = query.sort.map((rule) => `${rule.field}:${rule.direction}`);
  }
  if (query.pagination.page !== 1) {
    routeQuery.page = query.pagination.page;
  }
  if (query.pagination.page_size !== 500) {
    routeQuery.page_size = query.pagination.page_size;
  }

  return routeQuery;
}


interface SalesSectionProps {
  selectedDate?: string;
  view?: SalesView;
}

export function SalesSection({ selectedDate: _selectedDate, view }: SalesSectionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { franchise } = useFranchise();
  const brand = getFranchiseBrand(franchise);
  const salesView: SalesView = view ?? salesViewFromPathname(pathname);
  const routeSeasonParam = seasonFromSalesPath(pathname);
  const routeEventCodeParam = eventCodeFromSalesPath(pathname);
  const shouldLoadSeasonData = salesView === 'season';
  const shouldLoadGameCenterData = salesView === 'game';
  const shouldLoadAnalysisData = salesView === 'analysis';
  const { data: referenceSchedules, loading: referenceSchedulesLoading } = useReferenceSchedules();
  const [selectedSeason, setSelectedSeason] = React.useState<string>('');
  const [selectedGameCode, setSelectedGameCode] = React.useState<string>('');
  const [selectedSeasonCenterSeason, setSelectedSeasonCenterSeason] = React.useState<string>('');
  const [selectedSeasonCenterType, setSelectedSeasonCenterType] = React.useState<string>('REG');
  const [selectedSeasonRevenueRange, setSelectedSeasonRevenueRange] = React.useState<GameRevenueRangeKey>('ALL');
  const [selectedUpcomingGamesRange, setSelectedUpcomingGamesRange] = React.useState<UpcomingGamesRangeKey>('ALL');
  const [selectedSeasonTrendProducts, setSelectedSeasonTrendProducts] = React.useState<string[]>([]);
  const [selectedRevenueRange, setSelectedRevenueRange] = React.useState<GameRevenueRangeKey>('ALL');
  const [selectedTrendProducts, setSelectedTrendProducts] = React.useState<string[]>([]);
  const [analysisQuery, setAnalysisQuery] = React.useState<GameSummaryQuery | null>(null);
  const [gameRouteNotice, setGameRouteNotice] = React.useState<string | null>(null);

  // Register searchable headers for sales section
  useSearchableHeader(SEARCHABLE_ITEMS.sales.seasonCenterSelector);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.seasonCenterKpis);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.seasonCenterPacing);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.recentGames);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.nextGame);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.seasonCenterPriceLevels);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.seasonCenterChannelMix);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.seasonCenterAncillaryProducts);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.gameSummary);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.gameCenterSelector);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.gameCenterKpis);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.gameCenterPacing);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.gameCenterPriceLevels);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.gameCenterChannelMix);
  useSearchableHeader(SEARCHABLE_ITEMS.sales.gameCenterAncillaryProducts);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const pendingNotice = window.sessionStorage.getItem(GAME_ROUTE_NOTICE_STORAGE_KEY);
    if (!pendingNotice) return;

    window.sessionStorage.removeItem(GAME_ROUTE_NOTICE_STORAGE_KEY);
    setGameRouteNotice(pendingNotice);
  }, []);

  React.useEffect(() => {
    if (!gameRouteNotice) return;
    const timer = window.setTimeout(() => {
      setGameRouteNotice(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [gameRouteNotice]);

  const {
    data: gameSummaryRows,
    loading: gameSummaryLoading,
    refetch: refetchGameSummary,
    defaultQuery: defaultGameSummaryQuery
  } = useGameSummaryData(franchise, shouldLoadAnalysisData, { autoFetch: false });

  const gameSelectorOptions = React.useMemo<GameSelectorOption[]>(() => {
    const seasons = referenceSchedules?.seasons ?? [];
    if (seasons.length === 0) return [];

    return seasons.flatMap((seasonEntry) =>
      seasonEntry.games.map((game) => ({
        season: seasonEntry.season,
        seasonType: seasonEntry.season_type,
        seasonKey: seasonEntry.season_key,
        eventCode: game.event_code,
        eventDate: game.event_date,
        opponent: game.opponent,
        themeNight: withTrimmedFallback(game.theme_night, 'No Theme'),
        daysOut: typeof game.days_out === 'number' ? game.days_out : 0
      }))
    );
  }, [referenceSchedules?.seasons]);

  const defaultSeasonFromReference = React.useMemo(() => {
    const nextSeason = referenceSchedules?.next_game?.season_key.trim() ?? '';
    if (nextSeason.length > 0) return nextSeason;
    return gameSelectorOptions[0]?.seasonKey ?? '';
  }, [gameSelectorOptions, referenceSchedules?.next_game?.season_key]);

  const defaultGameFromReference = React.useMemo(() => {
    const nextEvent = referenceSchedules?.next_game?.event_code.trim() ?? '';
    if (nextEvent.length > 0) return nextEvent;
    return gameSelectorOptions[0]?.eventCode ?? '';
  }, [gameSelectorOptions, referenceSchedules?.next_game?.event_code]);

  const seasonOptions = React.useMemo(
    () => Array.from(new Set(gameSelectorOptions.map((game) => game.seasonKey))),
    [gameSelectorOptions]
  );

  const gameOptionsForSeason = React.useMemo(
    () => gameSelectorOptions.filter((game) => game.seasonKey === selectedSeason),
    [gameSelectorOptions, selectedSeason]
  );

  const analysisSeasonOptions = React.useMemo(() => {
    const seasons = referenceSchedules?.seasons ?? [];
    if (seasons.length === 0) return undefined;
    return Array.from(new Set(seasons.map((seasonEntry) => seasonEntry.season))).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    );
  }, [referenceSchedules?.seasons]);

  const analysisRouteQuery = React.useMemo(() => parseSalesAnalysisQuery(searchParams), [searchParams]);
  const analysisQueryFromRoute = React.useMemo(
    () => buildGameSummaryQueryFromRoute(defaultGameSummaryQuery, analysisRouteQuery),
    [analysisRouteQuery, defaultGameSummaryQuery]
  );

  React.useEffect(() => {
    if (!shouldLoadAnalysisData) return;
    setAnalysisQuery(analysisQueryFromRoute);
  }, [analysisQueryFromRoute, shouldLoadAnalysisData]);

  React.useEffect(() => {
    if (!shouldLoadAnalysisData || !analysisQuery) return;
    refetchGameSummary(analysisQuery);
  }, [analysisQuery, refetchGameSummary, shouldLoadAnalysisData]);

  const requestedSeason = routeSeasonParam?.trim() ?? '';
  const hasRequestedSeason =
    requestedSeason.length > 0 && requestedSeason.toLowerCase() !== DEFAULT_SALES_SEASON_PARAM;
  const requestedEventCode = routeEventCodeParam?.trim() ?? '';
  const hasRequestedEventCode =
    requestedEventCode.length > 0 && !isDefaultSalesEventParam(requestedEventCode);
  const seasonForRequestedEvent = React.useMemo(() => {
    if (!hasRequestedEventCode) return '';
    return gameSelectorOptions.find((game) => game.eventCode === requestedEventCode)?.seasonKey ?? '';
  }, [gameSelectorOptions, hasRequestedEventCode, requestedEventCode]);

  React.useEffect(() => {
    if (salesView !== 'game') return;
    if (!hasRequestedEventCode) return;
    if (gameSelectorOptions.length === 0) return;
    if (seasonForRequestedEvent) return;

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(GAME_ROUTE_NOTICE_STORAGE_KEY, 'Game not found');
    }
    router.replace(defaultSalesGamePath(), { scroll: false });
  }, [
    gameSelectorOptions.length,
    hasRequestedEventCode,
    router,
    salesView,
    seasonForRequestedEvent
  ]);

  React.useEffect(() => {
    if (!seasonOptions.length) return;
    if (seasonForRequestedEvent && seasonOptions.includes(seasonForRequestedEvent)) {
      if (selectedSeason !== seasonForRequestedEvent) {
        setSelectedSeason(seasonForRequestedEvent);
      }
      return;
    }

    if (hasRequestedSeason && seasonOptions.includes(requestedSeason)) {
      if (selectedSeason !== requestedSeason) {
        setSelectedSeason(requestedSeason);
      }
      return;
    }

    if (!seasonOptions.includes(selectedSeason)) {
      setSelectedSeason(defaultSeasonFromReference);
    }
  }, [
    defaultSeasonFromReference,
    hasRequestedSeason,
    requestedSeason,
    seasonForRequestedEvent,
    seasonOptions,
    selectedSeason
  ]);

  const seasonCenterSeasonOptions = React.useMemo(() => {
    const seasons = referenceSchedules?.seasons ?? [];
    if (seasons.length === 0) return [];
    return Array.from(new Set(seasons.map((seasonEntry) => seasonEntry.season))).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    );
  }, [referenceSchedules?.seasons]);

  const seasonCenterTypeOptions = React.useMemo(() => {
    if (!selectedSeasonCenterSeason) return [];
    const seasons = referenceSchedules?.seasons ?? [];
    const typeOrder = ['REG', 'PRE', 'POST'];
    return Array.from(
      new Set(
        seasons
          .filter((seasonEntry) => seasonEntry.season === selectedSeasonCenterSeason)
          .map((seasonEntry) => seasonEntry.season_type)
          .filter(Boolean)
      )
    ).sort((a, b) => {
      const aIndex = typeOrder.indexOf(a);
      const bIndex = typeOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [referenceSchedules?.seasons, selectedSeasonCenterSeason]);

  const defaultSeasonCenterSelection = React.useMemo(() => {
    const seasons = referenceSchedules?.seasons ?? [];
    if (seasons.length === 0) return { season: '', seasonType: 'REG' };

    const nextSeasonKey = referenceSchedules?.next_game?.season_key.trim() ?? '';
    const matchingNextSeason = seasons.find((seasonEntry) => seasonEntry.season_key === nextSeasonKey);
    if (matchingNextSeason) {
      return {
        season: matchingNextSeason.season,
        seasonType: matchingNextSeason.season_type || 'REG'
      };
    }

    const fallbackSeason = seasonCenterSeasonOptions[0] ?? seasons[0].season;
    const fallbackTypes = seasons
      .filter((seasonEntry) => seasonEntry.season === fallbackSeason)
      .map((seasonEntry) => seasonEntry.season_type)
      .filter(Boolean);
    const fallbackType = fallbackTypes.includes('REG') ? 'REG' : fallbackTypes[0] ?? 'REG';
    return { season: fallbackSeason, seasonType: fallbackType };
  }, [referenceSchedules?.next_game?.season_key, referenceSchedules?.seasons, seasonCenterSeasonOptions]);

  React.useEffect(() => {
    if (!seasonCenterSeasonOptions.length) return;
    if (hasRequestedSeason && seasonCenterSeasonOptions.includes(requestedSeason)) {
      if (selectedSeasonCenterSeason !== requestedSeason) {
        setSelectedSeasonCenterSeason(requestedSeason);
      }
      return;
    }

    if (!seasonCenterSeasonOptions.includes(selectedSeasonCenterSeason)) {
      setSelectedSeasonCenterSeason(defaultSeasonCenterSelection.season);
    }
  }, [
    defaultSeasonCenterSelection.season,
    hasRequestedSeason,
    requestedSeason,
    seasonCenterSeasonOptions,
    selectedSeasonCenterSeason
  ]);

  React.useEffect(() => {
    if (!seasonCenterTypeOptions.length) return;
    if (!seasonCenterTypeOptions.includes(selectedSeasonCenterType)) {
      const nextType = seasonCenterTypeOptions.includes(defaultSeasonCenterSelection.seasonType)
        ? defaultSeasonCenterSelection.seasonType
        : seasonCenterTypeOptions[0];
      setSelectedSeasonCenterType(nextType);
    }
  }, [defaultSeasonCenterSelection.seasonType, seasonCenterTypeOptions, selectedSeasonCenterType]);

  const seasonCenterQuery = React.useMemo(() => {
    if (!selectedSeasonCenterSeason) return null;
    const seasonType =
      seasonCenterTypeOptions.includes(selectedSeasonCenterType)
        ? selectedSeasonCenterType
        : seasonCenterTypeOptions[0] ?? '';
    if (!seasonType) return null;
    return {
      franchise,
      season: selectedSeasonCenterSeason,
      season_type: seasonType
    };
  }, [franchise, selectedSeasonCenterSeason, selectedSeasonCenterType, seasonCenterTypeOptions]);
  const { data: seasonCenterData, loading: seasonCenterLoading, error: seasonCenterError } = useSeasonCenterData(
    shouldLoadSeasonData ? seasonCenterQuery : null
  );

  React.useEffect(() => {
    if (!gameOptionsForSeason.length) return;
    if (hasRequestedEventCode && !seasonForRequestedEvent) return;

    if (hasRequestedEventCode && gameOptionsForSeason.some((game) => game.eventCode === requestedEventCode)) {
      if (selectedGameCode !== requestedEventCode) {
        setSelectedGameCode(requestedEventCode);
      }
      return;
    }

    if (!gameOptionsForSeason.some((game) => game.eventCode === selectedGameCode)) {
      const nextGameInSeason = gameOptionsForSeason.find((game) => game.eventCode === defaultGameFromReference);
      const fallbackGameCode = gameOptionsForSeason.length > 0 ? gameOptionsForSeason[0].eventCode : '';
      setSelectedGameCode(nextGameInSeason?.eventCode ?? fallbackGameCode);
    }
  }, [
    defaultGameFromReference,
    gameOptionsForSeason,
    hasRequestedEventCode,
    requestedEventCode,
    seasonForRequestedEvent,
    selectedGameCode
  ]);

  const selectedGameDetails = gameOptionsForSeason.find((game) => game.eventCode === selectedGameCode) ?? null;
  const gameCenterQuery = React.useMemo(
    () =>
      selectedGameDetails
        ? {
            franchise,
            season: selectedGameDetails.season,
            season_type: selectedGameDetails.seasonType,
            event_code: selectedGameDetails.eventCode
          }
        : null,
    [franchise, selectedGameDetails]
  );
  const { data: gameCenterData, loading: gameCenterLoading, error: gameCenterError } = useGameCenterData(
    shouldLoadGameCenterData ? gameCenterQuery : null
  );

  const seasonCenterKpis = React.useMemo<GameKpiCard[]>(() => {
    if (!seasonCenterData) return [];
    const goalText =
      seasonCenterData.goals.revenue_goal > 0
        ? `Goal ${formatCompactCurrency(seasonCenterData.goals.revenue_goal)} (${seasonCenterData.goals.revenue_percent_to_goal.toFixed(1)}%)`
        : undefined;
    return [
      {
        label: 'Tickets Sold',
        value: Math.round(seasonCenterData.kpis.tickets_sold).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Paid Tickets',
        value: Math.round(seasonCenterData.kpis.paid_tickets).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Revenue',
        value: formatCompactCurrency(seasonCenterData.kpis.revenue),
        delta: goalText,
        deltaTone: seasonCenterData.goals.revenue_variance >= 0 ? 'positive' : 'negative'
      },
      {
        label: 'New FSE',
        value: Math.round(seasonCenterData.kpis.new_fse).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'ATP',
        value: `$${seasonCenterData.kpis.atp.toFixed(2)}`,
        deltaTone: 'neutral'
      }
    ];
  }, [seasonCenterData]);

  const seasonCenterSecondaryKpis = React.useMemo<GameKpiCard[]>(() => {
    if (!seasonCenterData) return [];
    return [
      {
        label: 'Parking Tickets',
        value: Math.round(seasonCenterData.ancillary_products.parking_tickets).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Experience Vouchers',
        value: Math.round(seasonCenterData.ancillary_products.experience_vouchers).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Passes',
        value: Math.round(seasonCenterData.ancillary_products.passes).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Item Giveaway',
        value: Math.round(seasonCenterData.ancillary_products.item_giveaway).toLocaleString(),
        deltaTone: 'neutral'
      }
    ];
  }, [seasonCenterData]);

  const seasonRevenueTrendData = React.useMemo<SeasonRevenueTrendChartPoint[]>(
    () =>
      (seasonCenterData?.season_revenue_trend ?? [])
        .map((point) => ({
          dayOfSeason: point.day_of_sales_cycle,
          actualRevenue: point.actual_revenue,
          ticketsSold: point.tickets_sold
        }))
        .sort((a, b) => a.dayOfSeason - b.dayOfSeason),
    [seasonCenterData?.season_revenue_trend]
  );

  const seasonRevenueTrendProductOptions = React.useMemo<GameRevenueTrendProductOption[]>(() => {
    const productRows = seasonCenterData?.product_revenue_trend.products ?? [];
    const seriesRows = seasonCenterData?.product_revenue_trend.series ?? [];
    const productMap = new Map<string, GameRevenueTrendProductOption>();

    for (const productRow of productRows) {
      const id = productRow.product_id.trim();
      if (!id) continue;
      if (isExcludedTrendProduct(id, productRow.label)) continue;
      productMap.set(id, {
        id,
        label: productRow.label.trim() || formatProductLabel(id),
        displayOrder: typeof productRow.display_order === 'number' ? productRow.display_order : Number.MAX_SAFE_INTEGER
      });
    }

    for (const seriesRow of seriesRows) {
      const id = seriesRow.product_id.trim();
      if (!id || productMap.has(id)) continue;
      if (isExcludedTrendProduct(id)) continue;
      productMap.set(id, {
        id,
        label: formatProductLabel(id),
        displayOrder: Number.MAX_SAFE_INTEGER
      });
    }

    return Array.from(productMap.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)
    );
  }, [seasonCenterData?.product_revenue_trend.products, seasonCenterData?.product_revenue_trend.series]);

  React.useEffect(() => {
    if (seasonRevenueTrendProductOptions.length === 0) {
      setSelectedSeasonTrendProducts([]);
      return;
    }

    const validIds = new Set(seasonRevenueTrendProductOptions.map((option) => option.id));
    setSelectedSeasonTrendProducts((previous) => {
      const filtered = previous.filter((productId) => validIds.has(productId));
      if (filtered.length > 0) return filtered;
      return seasonRevenueTrendProductOptions.map((option) => option.id);
    });
  }, [seasonRevenueTrendProductOptions]);

  const allSeasonTrendProductIds = React.useMemo(
    () => seasonRevenueTrendProductOptions.map((option) => option.id),
    [seasonRevenueTrendProductOptions]
  );

  const selectedSeasonTrendProductSet = React.useMemo(() => {
    return new Set(selectedSeasonTrendProducts);
  }, [selectedSeasonTrendProducts]);

  const isAllSeasonTrendProductsSelected =
    allSeasonTrendProductIds.length > 0 &&
    selectedSeasonTrendProductSet.size === allSeasonTrendProductIds.length &&
    allSeasonTrendProductIds.every((productId) => selectedSeasonTrendProductSet.has(productId));

  const hasSeasonProductRevenueTrend =
    (seasonCenterData?.product_revenue_trend.products.length ?? 0) > 0 ||
    (seasonCenterData?.product_revenue_trend.series.length ?? 0) > 0;

  const aggregatedSeasonProductRevenueTrendData = React.useMemo<SeasonRevenueTrendChartPoint[]>(() => {
    const seriesRows = seasonCenterData?.product_revenue_trend.series ?? [];
    if (seriesRows.length === 0 || selectedSeasonTrendProductSet.size === 0) return [];

    const selectedSeries = seriesRows.filter((seriesRow) => {
      const productId = seriesRow.product_id.trim();
      return productId.length > 0 && selectedSeasonTrendProductSet.has(productId);
    });
    if (selectedSeries.length === 0) return [];

    const baselineDaysOfSeason = seasonRevenueTrendData.map((point) => point.dayOfSeason);
    const fallbackDaysOfSeason = selectedSeries.flatMap((seriesRow) =>
      seriesRow.points.map((point) => point.day_of_sales_cycle)
    );
    const dayCandidates = baselineDaysOfSeason.length > 0 ? baselineDaysOfSeason : fallbackDaysOfSeason;
    if (dayCandidates.length === 0) return [];

    const maxDayOfSeason = Math.max(...dayCandidates);
    const minDayOfSeason = Math.min(...dayCandidates);
    const denseDaysOfSeason = Array.from(
      { length: maxDayOfSeason - minDayOfSeason + 1 },
      (_, index) => minDayOfSeason + index
    );

    const seriesState = selectedSeries.map((seriesRow) => ({
      points: [...seriesRow.points].sort((a, b) => a.day_of_sales_cycle - b.day_of_sales_cycle),
      cursor: 0,
      lastRevenue: 0,
      lastTickets: 0
    }));

    return denseDaysOfSeason.map((dayOfSeason) => {
      let combinedRevenue = 0;
      let combinedTickets = 0;

      for (const state of seriesState) {
        while (
          state.cursor < state.points.length &&
          state.points[state.cursor].day_of_sales_cycle === dayOfSeason
        ) {
          state.lastRevenue = state.points[state.cursor].actual_revenue;
          state.lastTickets = state.points[state.cursor].tickets_sold;
          state.cursor += 1;
        }

        combinedRevenue += state.lastRevenue;
        combinedTickets += state.lastTickets;
      }

      return {
        dayOfSeason,
        actualRevenue: combinedRevenue,
        ticketsSold: combinedTickets
      };
    });
  }, [seasonCenterData?.product_revenue_trend.series, seasonRevenueTrendData, selectedSeasonTrendProductSet]);

  const seasonRevenueTrendChartData = React.useMemo(
    () => (hasSeasonProductRevenueTrend ? aggregatedSeasonProductRevenueTrendData : seasonRevenueTrendData),
    [aggregatedSeasonProductRevenueTrendData, hasSeasonProductRevenueTrend, seasonRevenueTrendData]
  );

  const filteredSeasonRevenueTrendData = React.useMemo(() => {
    if (selectedSeasonRevenueRange === 'ALL') return seasonRevenueTrendChartData;
    if (seasonRevenueTrendChartData.length === 0) return [];
    const windowDays = GAME_REVENUE_RANGE_MAX_DAYS[selectedSeasonRevenueRange];
    const maxDayOfSeason = Math.max(...seasonRevenueTrendChartData.map((point) => point.dayOfSeason));
    const minDayInWindow = Math.max(1, maxDayOfSeason - windowDays + 1);
    return seasonRevenueTrendChartData.filter((point) => point.dayOfSeason >= minDayInWindow);
  }, [seasonRevenueTrendChartData, selectedSeasonRevenueRange]);

  const toggleSeasonTrendProduct = React.useCallback(
    (productId: string) => {
      setSelectedSeasonTrendProducts((previous) => {
        const nextSet = new Set(previous);

        if (nextSet.has(productId)) {
          nextSet.delete(productId);
        } else {
          nextSet.add(productId);
        }

        return allSeasonTrendProductIds.filter((id) => nextSet.has(id));
      });
    },
    [allSeasonTrendProductIds]
  );

  const seasonRevenueYAxisDomain = React.useMemo<[number, number]>(() => {
    if (filteredSeasonRevenueTrendData.length === 0) return [0, 100000];

    const revenueValues = filteredSeasonRevenueTrendData.map((point) => point.actualRevenue);
    const minValue = Math.min(...revenueValues);
    const maxValue = Math.max(...revenueValues);
    const spread = maxValue - minValue;
    const padding = Math.max(25000, (spread || maxValue * 0.2) * 0.18);
    const domainMin = Math.max(0, minValue - padding);
    const domainMax = maxValue + padding;

    return [Math.floor(domainMin / 25000) * 25000, Math.ceil(domainMax / 25000) * 25000];
  }, [filteredSeasonRevenueTrendData]);

  const seasonTicketDemandData: TicketDemandData[] = React.useMemo(() => {
    const upcomingGames = seasonCenterData?.upcoming_games ?? [];
    if (upcomingGames.length === 0) return [];

    return upcomingGames
      .filter((game) => game.opponent.trim().toLowerCase() !== 'unknown')
      .map((game) => {
        const [year, month, day] = game.event_date.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          gameDate: game.event_date,
          opponent: game.opponent,
          displayLabel: dateLabel,
          attendancePercent: 0,
          ticketsSold: game.tickets_sold,
          revenue: game.revenue,
          isHome: true,
          hasTheme: Boolean(game.theme_night),
          theme: game.theme_night ?? undefined,
          game_goal_amount: game.game_goal_amount,
          percent_to_goal: game.percent_to_goal
        };
      });
  }, [seasonCenterData?.upcoming_games]);

  const filteredSeasonTicketDemandData = React.useMemo(() => {
    if (selectedUpcomingGamesRange === 'ALL') return seasonTicketDemandData;
    const barLimit = UPCOMING_GAMES_RANGE_LIMITS[selectedUpcomingGamesRange];
    return seasonTicketDemandData.slice(0, barLimit);
  }, [seasonTicketDemandData, selectedUpcomingGamesRange]);

  const seasonNextGame = React.useMemo(() => seasonCenterData?.next_game ?? null, [seasonCenterData?.next_game]);
  const seasonHeatMapPriceLevels = React.useMemo(() => seasonCenterData?.heatmap.x_axis_values ?? [], [seasonCenterData?.heatmap.x_axis_values]);
  const seasonHeatMapProducts = React.useMemo(() => seasonCenterData?.heatmap.y_axis_values ?? [], [seasonCenterData?.heatmap.y_axis_values]);
  const seasonHeatMapCells = React.useMemo<HeatMapCellValue[]>(
    () =>
      (seasonCenterData?.heatmap.cells ?? []).map((cell) => ({
        x: cell.x,
        y: cell.y,
        value: cell.revenue,
        tickets: cell.tickets
      })),
    [seasonCenterData?.heatmap.cells]
  );
  const sortedSeasonPriceLevelInventory = React.useMemo(
    () =>
      [...(seasonCenterData?.price_level_inventory ?? [])].sort((a, b) =>
        a.price_level.localeCompare(b.price_level, undefined, { sensitivity: 'base', numeric: true })
      ),
    [seasonCenterData?.price_level_inventory]
  );

  const gameCenterKpis = React.useMemo<GameKpiCard[]>(() => {
    if (!gameCenterData) return [];
    return [
      {
        label: 'Tickets Sold',
        value: Math.round(gameCenterData.kpis.tickets_sold).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Paid Tickets',
        value: Math.round(gameCenterData.kpis.paid_tickets).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Revenue',
        value: formatCompactCurrency(gameCenterData.kpis.revenue),
        deltaTone: 'neutral'
      },
      {
        label: 'Sell Through',
        value: `${gameCenterData.kpis.sell_through.toFixed(1)}%`,
        deltaTone: 'neutral'
      },
      {
        label: 'ATP',
        value: `$${gameCenterData.kpis.atp.toFixed(2)}`,
        deltaTone: 'neutral'
      }
    ];
  }, [gameCenterData]);
  const gameCenterSecondaryKpis = React.useMemo<GameKpiCard[]>(() => {
    if (!gameCenterData) return [];
    return [
      {
        label: 'Parking Tickets',
        value: Math.round(gameCenterData.kpis.parking_tickets).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Experience Vouchers',
        value: Math.round(gameCenterData.kpis.experience_vouchers).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Passes',
        value: Math.round(gameCenterData.kpis.passes).toLocaleString(),
        deltaTone: 'neutral'
      },
      {
        label: 'Item Giveaway',
        value: Math.round(gameCenterData.kpis.item_giveaway).toLocaleString(),
        deltaTone: 'neutral'
      }
    ];
  }, [gameCenterData]);

  const overallGameRevenueTrendData = React.useMemo<GameRevenueTrendChartPoint[]>(
    () =>
      (gameCenterData?.game_revenue_trend ?? [])
        .map((point) => ({
          daysOut: point.days_out,
          actualRevenue: point.actual_revenue,
          ticketsSold: point.tickets_sold
        }))
        .sort((a, b) => b.daysOut - a.daysOut),
    [gameCenterData?.game_revenue_trend]
  );

  const gameRevenueTrendProductOptions = React.useMemo<GameRevenueTrendProductOption[]>(() => {
    const productRows = gameCenterData?.product_revenue_trend.products ?? [];
    const seriesRows = gameCenterData?.product_revenue_trend.series ?? [];
    const productMap = new Map<string, GameRevenueTrendProductOption>();

    for (const productRow of productRows) {
      const id = productRow.product_id.trim();
      if (!id) continue;
      if (isExcludedTrendProduct(id, productRow.label)) continue;
      productMap.set(id, {
        id,
        label: productRow.label.trim() || formatProductLabel(id),
        displayOrder: typeof productRow.display_order === 'number' ? productRow.display_order : Number.MAX_SAFE_INTEGER
      });
    }

    for (const seriesRow of seriesRows) {
      const id = seriesRow.product_id.trim();
      if (!id || productMap.has(id)) continue;
      if (isExcludedTrendProduct(id)) continue;
      productMap.set(id, {
        id,
        label: formatProductLabel(id),
        displayOrder: Number.MAX_SAFE_INTEGER
      });
    }

    return Array.from(productMap.values()).sort(
      (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)
    );
  }, [gameCenterData?.product_revenue_trend.products, gameCenterData?.product_revenue_trend.series]);

  React.useEffect(() => {
    if (gameRevenueTrendProductOptions.length === 0) {
      setSelectedTrendProducts([]);
      return;
    }

    const validIds = new Set(gameRevenueTrendProductOptions.map((option) => option.id));
    setSelectedTrendProducts((previous) => {
      const filtered = previous.filter((productId) => validIds.has(productId));
      if (filtered.length > 0) return filtered;
      return gameRevenueTrendProductOptions.map((option) => option.id);
    });
  }, [gameRevenueTrendProductOptions]);

  const allTrendProductIds = React.useMemo(
    () => gameRevenueTrendProductOptions.map((option) => option.id),
    [gameRevenueTrendProductOptions]
  );

  const selectedTrendProductSet = React.useMemo(() => {
    return new Set(selectedTrendProducts);
  }, [selectedTrendProducts]);

  const isAllTrendProductsSelected =
    allTrendProductIds.length > 0 &&
    selectedTrendProductSet.size === allTrendProductIds.length &&
    allTrendProductIds.every((productId) => selectedTrendProductSet.has(productId));

  const hasProductRevenueTrend =
    (gameCenterData?.product_revenue_trend.products.length ?? 0) > 0 ||
    (gameCenterData?.product_revenue_trend.series.length ?? 0) > 0;

  const aggregatedProductRevenueTrendData = React.useMemo<GameRevenueTrendChartPoint[]>(() => {
    const seriesRows = gameCenterData?.product_revenue_trend.series ?? [];
    if (seriesRows.length === 0 || selectedTrendProductSet.size === 0) return [];

    const selectedSeries = seriesRows.filter((seriesRow) => {
      const productId = seriesRow.product_id.trim();
      return productId.length > 0 && selectedTrendProductSet.has(productId);
    });
    if (selectedSeries.length === 0) return [];

    // Use overall series day range when available for a stable x-axis across product toggles.
    const baselineDaysOut = overallGameRevenueTrendData.map((point) => point.daysOut);
    const fallbackDaysOut = selectedSeries.flatMap((seriesRow) => seriesRow.points.map((point) => point.days_out));
    const dayCandidates = baselineDaysOut.length > 0 ? baselineDaysOut : fallbackDaysOut;
    if (dayCandidates.length === 0) return [];

    const maxDaysOut = Math.max(...dayCandidates);
    const minDaysOut = Math.min(...dayCandidates);
    const denseDaysOut = Array.from({ length: maxDaysOut - minDaysOut + 1 }, (_, index) => maxDaysOut - index);

    const seriesState = selectedSeries.map((seriesRow) => ({
      points: [...seriesRow.points].sort((a, b) => b.days_out - a.days_out),
      cursor: 0,
      lastRevenue: 0,
      lastTickets: 0
    }));

    return denseDaysOut.map((daysOut) => {
      let combinedRevenue = 0;
      let combinedTickets = 0;

      for (const state of seriesState) {
        while (state.cursor < state.points.length && state.points[state.cursor].days_out === daysOut) {
          state.lastRevenue = state.points[state.cursor].actual_revenue;
          state.lastTickets = state.points[state.cursor].tickets_sold;
          state.cursor += 1;
        }

        combinedRevenue += state.lastRevenue;
        combinedTickets += state.lastTickets;
      }

      return {
        daysOut,
        actualRevenue: combinedRevenue,
        ticketsSold: combinedTickets
      };
    });
  }, [gameCenterData?.product_revenue_trend.series, overallGameRevenueTrendData, selectedTrendProductSet]);

  const gameRevenueTrendData = React.useMemo(
    () => (hasProductRevenueTrend ? aggregatedProductRevenueTrendData : overallGameRevenueTrendData),
    [aggregatedProductRevenueTrendData, hasProductRevenueTrend, overallGameRevenueTrendData]
  );

  const filteredGameRevenueTrendData = React.useMemo(() => {
    if (selectedRevenueRange === 'ALL') return gameRevenueTrendData;
    const maxDaysOut = GAME_REVENUE_RANGE_MAX_DAYS[selectedRevenueRange];
    return gameRevenueTrendData.filter((point) => point.daysOut <= maxDaysOut);
  }, [gameRevenueTrendData, selectedRevenueRange]);

  const toggleTrendProduct = React.useCallback(
    (productId: string) => {
      setSelectedTrendProducts((previous) => {
        const nextSet = new Set(previous);

        if (nextSet.has(productId)) {
          nextSet.delete(productId);
        } else {
          nextSet.add(productId);
        }

        return allTrendProductIds.filter((id) => nextSet.has(id));
      });
    },
    [allTrendProductIds]
  );

  const heatMapPriceLevels = React.useMemo(() => gameCenterData?.heatmap.x_axis_values ?? [], [gameCenterData?.heatmap.x_axis_values]);
  const heatMapProducts = React.useMemo(() => gameCenterData?.heatmap.y_axis_values ?? [], [gameCenterData?.heatmap.y_axis_values]);
  const gameHeatMapCells = React.useMemo<HeatMapCellValue[]>(
    () =>
      (gameCenterData?.heatmap.cells ?? []).map((cell) => ({
        x: cell.x,
        y: cell.y,
        value: cell.revenue,
        tickets: cell.tickets
      })),
    [gameCenterData?.heatmap.cells]
  );
  const sortedPriceLevelInventory = React.useMemo(
    () =>
      [...(gameCenterData?.price_level_inventory ?? [])].sort((a, b) =>
        a.price_level.localeCompare(b.price_level, undefined, { sensitivity: 'base', numeric: true })
      ),
    [gameCenterData?.price_level_inventory]
  );
  const gameRevenueYAxisDomain = React.useMemo<[number, number]>(() => {
    if (filteredGameRevenueTrendData.length === 0) return [0, 100000];

    const revenueValues = filteredGameRevenueTrendData.map((point) => point.actualRevenue);
    const minValue = Math.min(...revenueValues);
    const maxValue = Math.max(...revenueValues);
    const spread = maxValue - minValue;
    const padding = Math.max(25000, (spread || maxValue * 0.2) * 0.18);
    const domainMin = Math.max(0, minValue - padding);
    const domainMax = maxValue + padding;

    return [Math.floor(domainMin / 25000) * 25000, Math.ceil(domainMax / 25000) * 25000];
  }, [filteredGameRevenueTrendData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {(salesView === 'season') && (
        <div className="space-y-4">
          <div id="season-center-selector" className="relative border-0 rounded-lg shadow-sm p-4 sm:p-5" style={{ backgroundColor: '#ededed' }}>
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-text-primary">Season Command Center</h2>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Season</span>
                <select
                  value={seasonCenterSeasonOptions.length === 0 ? '' : selectedSeasonCenterSeason}
                  onChange={(event) => {
                    const nextSeason = event.target.value;
                    setSelectedSeasonCenterSeason(nextSeason);
                    if (nextSeason) {
                      router.push(salesSeasonPath(nextSeason), { scroll: false });
                    }
                  }}
                  disabled={referenceSchedulesLoading || seasonCenterSeasonOptions.length === 0}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {seasonCenterSeasonOptions.length === 0 ? (
                    <option value="">
                      {referenceSchedulesLoading ? 'Loading seasons...' : 'No seasons available'}
                    </option>
                  ) : (
                    seasonCenterSeasonOptions.map((season) => (
                      <option key={season} value={season}>
                        {formatSeasonDisplay(season)}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Season Type</span>
                <select
                  value={seasonCenterTypeOptions.length === 0 ? '' : selectedSeasonCenterType}
                  onChange={(event) => setSelectedSeasonCenterType(event.target.value)}
                  disabled={referenceSchedulesLoading || seasonCenterTypeOptions.length === 0}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {seasonCenterTypeOptions.length === 0 ? (
                    <option value="">
                      {referenceSchedulesLoading ? 'Loading season types...' : 'No season types available'}
                    </option>
                  ) : (
                    seasonCenterTypeOptions.map((seasonType) => (
                      <option key={seasonType} value={seasonType}>
                        {formatSeasonTypeLabel(seasonType)}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
            {seasonCenterData && (
              <div className="mt-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">
                  {seasonCenterData.season_label ??
                    `${formatSeasonDisplay(seasonCenterData.season)} ${formatSeasonTypeLabel(seasonCenterData.season_type)}`}
                </span>
                {seasonCenterData.last_updated && (
                  <>
                    <span className="mx-2">|</span>
                    <span>Updated {new Date(seasonCenterData.last_updated).toLocaleString()}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div id="season-center-kpis" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {seasonCenterLoading &&
              Array.from({ length: 5 }, (_, index) => (
                <div key={`season-kpi-skeleton-${index}`} className="rounded-lg shadow-sm p-4 animate-pulse" style={{ backgroundColor: '#ededed' }}>
                  <div className="h-3 w-24 rounded bg-gray-300" />
                  <div className="mt-3 h-8 w-20 rounded bg-gray-300" />
                </div>
              ))}
            {!seasonCenterLoading &&
              seasonCenterKpis.map((kpi) => (
                <div key={kpi.label} className="rounded-lg shadow-sm p-4" style={{ backgroundColor: '#ededed' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>
                  {kpi.delta && (
                    <p className={`mt-1 text-xs font-medium ${kpi.deltaTone === 'negative' ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {kpi.delta}
                    </p>
                  )}
                </div>
              ))}
            {!seasonCenterLoading && !seasonCenterData && (
              <div className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 md:col-span-2 xl:col-span-5">
                Season data is unavailable for this selection.
              </div>
            )}
          </div>

          <div className="relative overflow-visible">
            <div id="season-center-pacing" className="rounded-lg shadow-sm p-4 sm:p-5" style={{ backgroundColor: '#ededed' }}>
              <div className="mb-3 flex items-center">
                <h3 className="text-base font-semibold text-text-primary">Season Revenue Trend</h3>
                <div className="h-px flex-1 bg-border-light ml-3" />
              </div>
              {seasonCenterLoading ? (
                <ChartSkeleton height="h-96" showTitle={false} />
              ) : filteredSeasonRevenueTrendData.length > 0 ? (
                <>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={filteredSeasonRevenueTrendData} margin={{ top: 12, right: 20, left: 8, bottom: 8 }}>
                        <CartesianGrid stroke="#D1D5DB" strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="dayOfSeason"
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          axisLine={false}
                          tickLine={false}
                          domain={seasonRevenueYAxisDomain}
                          tickFormatter={(value) => `$${Math.round(value / 1000)}K`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const point = payload[0]?.payload as { actualRevenue: number; ticketsSold: number } | undefined;
                            if (!point) return null;
                            return (
                              <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm">
                                <p className="text-xs text-gray-500">Day of Season {label}</p>
                                <p className="text-sm font-medium text-gray-900">
                                  Actual Revenue: ${point.actualRevenue.toLocaleString()}
                                </p>
                                <p className="text-sm font-medium text-gray-900">Tickets Sold: {point.ticketsSold.toLocaleString()}</p>
                              </div>
                            );
                          }}
                          cursor={{ stroke: '#D1D5DB', strokeDasharray: '4 4' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="actualRevenue"
                          name="Actual Revenue"
                          stroke="#1E3A8A"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 5, fill: '#1E3A8A', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600">Day of Season</p>
                </>
              ) : (
                <div className="flex h-96 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-600">
                  {hasSeasonProductRevenueTrend && selectedSeasonTrendProductSet.size === 0
                    ? 'Please Select a product'
                    : seasonRevenueTrendChartData.length > 0
                    ? `No revenue trend data available for the ${selectedSeasonRevenueRange} window.`
                    : 'No revenue trend data available for this season.'}
                </div>
              )}
              {seasonRevenueTrendProductOptions.length > 0 && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Products</p>
                  <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSeasonTrendProducts(isAllSeasonTrendProductsSelected ? [] : allSeasonTrendProductIds)
                      }
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isAllSeasonTrendProductsSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-pressed={isAllSeasonTrendProductsSelected}
                    >
                      All
                    </button>
                    {seasonRevenueTrendProductOptions.map((productOption) => {
                      const isSelected = selectedSeasonTrendProductSet.has(productOption.id);
                      return (
                        <button
                          key={productOption.id}
                          type="button"
                          onClick={() => toggleSeasonTrendProduct(productOption.id)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-600 text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          aria-pressed={isSelected}
                        >
                          {productOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="absolute left-full top-0 ml-3 hidden xl:flex flex-col space-y-2">
              {GAME_REVENUE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedSeasonRevenueRange(option.key)}
                  className={`flex h-12 w-16 items-center justify-center rounded-md border text-[13px] font-semibold transition-colors ${
                    selectedSeasonRevenueRange === option.key
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 xl:hidden">
              {GAME_REVENUE_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedSeasonRevenueRange(option.key)}
                  className={`flex h-10 min-w-14 items-center justify-center rounded-md border px-2 text-[12px] font-semibold transition-colors ${
                    selectedSeasonRevenueRange === option.key
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div id="recent-games" className="space-y-3">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-text-primary">Upcoming Games</h2>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>
            <div className="xl:relative">
              {seasonCenterLoading ? (
                <ChartSkeleton height="h-80" showTitle={false} />
              ) : filteredSeasonTicketDemandData.length > 0 ? (
                <div className="relative border-0 rounded-lg shadow-sm px-3 sm:px-6 py-3 sm:py-4 overflow-x-auto" style={{ backgroundColor: '#ededed' }}>
                  <div className="h-64 sm:h-80 min-w-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={filteredSeasonTicketDemandData}
                        margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
                        barCategoryGap="15%"
                      >
                        <XAxis
                          dataKey="displayLabel"
                          tick={<CustomXAxisTick />}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          height={30}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                          width={50}
                          domain={[
                            0,
                            () => {
                              const maxGoal = Math.max(...filteredSeasonTicketDemandData.map((d) => d.game_goal_amount ?? 0));
                              const maxRevenue = Math.max(...filteredSeasonTicketDemandData.map((d) => d.revenue));
                              const actualMax = Math.max(maxGoal, maxRevenue);
                              return calculateNiceMax(actualMax);
                            }
                          ]}
                          ticks={(() => {
                            const maxGoal = Math.max(...filteredSeasonTicketDemandData.map((d) => d.game_goal_amount ?? 0));
                            const maxRevenue = Math.max(...filteredSeasonTicketDemandData.map((d) => d.revenue));
                            const actualMax = Math.max(maxGoal, maxRevenue);
                            const niceMax = calculateNiceMax(actualMax);
                            const tickCount = 5;
                            const interval = niceMax / (tickCount - 1);
                            return Array.from({ length: tickCount }, (_, i) => i * interval);
                          })()}
                        />
                        <Tooltip content={<DemandTooltip />} cursor={false} />
                        <Bar
                          dataKey="revenue"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={55}
                          shape={(props: unknown) => {
                            const { x, y, width, height, payload, fill, fillOpacity, index } = props as {
                              x: number;
                              y: number;
                              width: number;
                              height: number;
                              payload: TicketDemandData;
                              fill: string;
                              fillOpacity: number;
                              index: number;
                            };
                            const goalAmount = payload.game_goal_amount;
                            const revenue = payload.revenue;
                            const hasGoalAmount = typeof goalAmount === 'number' && Number.isFinite(goalAmount);
                            let goalY = null;
                            if (hasGoalAmount && revenue > 0) {
                              const pixelsPerDollar = height / revenue;
                              goalY = y + height - goalAmount * pixelsPerDollar;
                            }

                            return (
                              <g>
                                <rect
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={height}
                                  fill={fill}
                                  fillOpacity={fillOpacity}
                                  rx={4}
                                  ry={4}
                                />
                                {goalY !== null && (
                                  <>
                                    <line
                                      x1={x}
                                      y1={goalY}
                                      x2={x + width}
                                      y2={goalY}
                                      stroke="#9CA3AF"
                                      strokeWidth={2.5}
                                      strokeDasharray="5,5"
                                    />
                                    {index === filteredSeasonTicketDemandData.length - 1 && (
                                      <text
                                        x={x + width + 5}
                                        y={goalY + 3}
                                        fill="#6B7280"
                                        fontSize={10}
                                        fontFamily="system-ui, -apple-system, sans-serif"
                                      >
                                        Goal
                                      </text>
                                    )}
                                  </>
                                )}
                              </g>
                            );
                          }}
                        >
                          {filteredSeasonTicketDemandData.map((entry, index) => (
                            <Cell
                              key={`season-cell-${index}`}
                              fill={entry.hasTheme ? '#F97316' : '#6366F1'}
                              fillOpacity={entry.hasTheme ? 0.35 : 0.15}
                            />
                          ))}
                          <LabelList dataKey="opponent" content={<CustomLogoLabel />} />
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <InfoIconButton>
                    <div className="w-64 p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Upcoming Games</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            View upcoming game goals and seasonal pacing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </InfoIconButton>
                </div>
              ) : (
                <div className="relative border-0 rounded-lg shadow-sm p-4 sm:p-6 md:p-8 text-center text-gray-500" style={{ backgroundColor: '#ededed' }}>
                  No upcoming games scheduled
                </div>
              )}
              {seasonTicketDemandData.length > 0 && (
                <div className="absolute left-full top-0 ml-3 hidden xl:flex flex-col space-y-2">
                  {UPCOMING_GAMES_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedUpcomingGamesRange(option.key)}
                      className={`flex h-12 w-16 items-center justify-center rounded-md border text-[13px] font-semibold transition-colors ${
                        selectedUpcomingGamesRange === option.key
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {seasonTicketDemandData.length > 0 && (
              <div className="mt-3 flex items-center gap-2 xl:hidden">
                {UPCOMING_GAMES_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedUpcomingGamesRange(option.key)}
                    className={`flex h-10 min-w-14 items-center justify-center rounded-md border px-2 text-[12px] font-semibold transition-colors ${
                      selectedUpcomingGamesRange === option.key
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div id="next-game" className="space-y-3">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-text-primary">Next Game</h2>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>
            {seasonCenterLoading ? (
              <ChartSkeleton height="h-48" showTitle={false} />
            ) : seasonNextGame ? (
              <div className="relative border-0 rounded-lg shadow-sm p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#ededed' }}>
                <div className="space-y-6">
                  <div className="flex items-center justify-center space-x-4 sm:space-x-8 md:space-x-12">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <Image
                        src={getTeamLogo(brand.homeTeamName, 500, franchise)}
                        alt={`${brand.shortDisplayName} Logo`}
                        width={64}
                        height={64}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const fallback = getLocalFallback(brand.homeTeamName);
                          if (fallback) target.src = fallback;
                        }}
                      />
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{brand.shortDisplayName}</span>
                    </div>
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-400">vs</span>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{seasonNextGame.opponent.toUpperCase()}</span>
                      <Image
                        src={getTeamLogo(seasonNextGame.opponent, 500, franchise)}
                        alt={`${seasonNextGame.opponent} Logo`}
                        width={64}
                        height={64}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const fallback = getLocalFallback(seasonNextGame.opponent);
                          if (fallback) target.src = fallback;
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Game Date</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatGameDate(seasonNextGame.event_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Start Time</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatStartTimeLabel(seasonNextGame.start_time_local)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Theme Night</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {withTrimmedFallback(seasonNextGame.theme_night, 'Standard Game')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Days Until</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {typeof seasonNextGame.days_out === 'number'
                          ? seasonNextGame.days_out
                          : calculateDaysUntil(seasonNextGame.event_date)}{' '}
                        Days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative border-0 rounded-lg shadow-sm p-4 sm:p-6 md:p-8 text-center text-gray-500" style={{ backgroundColor: '#ededed' }}>
                No upcoming games scheduled
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div
              id="season-center-price-levels"
              className="rounded-lg shadow-sm p-4 sm:p-5 xl:col-span-4 h-[38rem] flex flex-col"
              style={{ backgroundColor: '#ededed' }}
            >
              <div className="flex items-center mb-3">
                <h3 className="text-base font-semibold text-text-primary">Price Level Inventory</h3>
                <div className="flex-1 h-px bg-gray-200 ml-4"></div>
              </div>
              <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                {sortedSeasonPriceLevelInventory.map((row) => (
                  <div key={row.price_level} className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="text-sm font-semibold text-gray-900">{row.price_level}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                      <span>{Math.round(row.sold_tickets).toLocaleString()} tickets</span>
                      <span>{formatCompactCurrency(row.revenue)} revenue</span>
                    </div>
                  </div>
                ))}
                {!seasonCenterLoading && sortedSeasonPriceLevelInventory.length === 0 && (
                  <div className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-600">
                    No price level data available.
                  </div>
                )}
              </div>
            </div>

            <div
              id="season-center-channel-mix"
              className="rounded-lg shadow-sm p-4 sm:p-5 xl:col-span-8 h-[38rem] flex flex-col overflow-hidden"
              style={{ backgroundColor: '#ededed' }}
            >
              <div className="flex items-center mb-3">
                <h3 className="text-base font-semibold text-text-primary">Product x Price Level Heat Map</h3>
                <div className="flex-1 h-px bg-gray-200 ml-4"></div>
              </div>
              <div className="flex-1 min-h-0">
                {seasonCenterLoading ? (
                  <ChartSkeleton height="h-full" showTitle={false} />
                ) : seasonHeatMapPriceLevels.length > 0 && seasonHeatMapProducts.length > 0 ? (
                  <HeatMapMatrix
                    title="Revenue Concentration"
                    subtitle={
                      seasonCenterData
                        ? `${formatSeasonDisplay(seasonCenterData.season)} • ${formatSeasonTypeLabel(seasonCenterData.season_type)}`
                        : 'Selected season'
                    }
                    xLabel="Price Levels"
                    yLabel="Products"
                    xValues={seasonHeatMapPriceLevels}
                    yValues={seasonHeatMapProducts}
                    cells={seasonHeatMapCells}
                    valueLabel="Revenue"
                    fillHeight
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-600">
                    No heat map data available for this season.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div id="season-center-ancillary-products" className="space-y-3">
            <div className="flex items-center">
              <h3 className="text-base font-semibold text-text-primary">Ancillary Products</h3>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {seasonCenterLoading &&
                Array.from({ length: 4 }, (_, index) => (
                  <div key={`season-secondary-kpi-skeleton-${index}`} className="rounded-lg shadow-sm p-4 animate-pulse" style={{ backgroundColor: '#ededed' }}>
                    <div className="h-3 w-28 rounded bg-gray-300" />
                    <div className="mt-3 h-8 w-20 rounded bg-gray-300" />
                  </div>
                ))}
              {!seasonCenterLoading &&
                seasonCenterSecondaryKpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-lg shadow-sm p-4" style={{ backgroundColor: '#ededed' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>
                  </div>
                ))}
            </div>
          </div>

          {seasonCenterError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Failed to load Season Command Center data. {seasonCenterError}
            </div>
          )}
        </div>
      )}

      {(salesView === 'game') && (
      <div className="space-y-4">
        <div id="game-center-selector" className="relative border-0 rounded-lg shadow-sm p-4 sm:p-5" style={{ backgroundColor: '#ededed' }}>
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-text-primary">Game Command Center</h2>
            <div className="flex-1 h-px bg-gray-200 ml-4"></div>
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Season</span>
              <select
                value={seasonOptions.length === 0 ? '' : selectedSeason}
                onChange={(event) => setSelectedSeason(event.target.value)}
                disabled={referenceSchedulesLoading || seasonOptions.length === 0}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {seasonOptions.length === 0 ? (
                  <option value="">
                    {referenceSchedulesLoading ? 'Loading seasons...' : 'No seasons available'}
                  </option>
                ) : (
                  seasonOptions.map((season) => (
                    <option key={season} value={season}>
                      {formatSeasonLabel(season)}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">Game</span>
              <select
                value={gameOptionsForSeason.length === 0 ? '' : selectedGameCode}
                onChange={(event) => {
                  const nextEventCode = event.target.value;
                  setSelectedGameCode(nextEventCode);
                  if (nextEventCode) {
                    router.push(salesGamePath(nextEventCode), { scroll: false });
                  }
                }}
                disabled={referenceSchedulesLoading || gameOptionsForSeason.length === 0}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {gameOptionsForSeason.length === 0 ? (
                  <option value="">
                    {referenceSchedulesLoading ? 'Loading games...' : 'No games available'}
                  </option>
                ) : (
                  gameOptionsForSeason.map((game) => (
                    <option key={game.eventCode} value={game.eventCode}>
                      {game.eventCode} - {formatGameDate(game.eventDate)} vs {game.opponent}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
          {referenceSchedulesLoading && (
            <div className="mt-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
              Loading games...
            </div>
          )}
          {selectedGameDetails && (
            <div className="mt-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{selectedGameDetails.eventCode}</span>
              <span className="mx-2">|</span>
              <span>{formatGameDate(selectedGameDetails.eventDate)} vs {selectedGameDetails.opponent}</span>
              <span className="mx-2">|</span>
              <span>Theme: {selectedGameDetails.themeNight}</span>
              <span className="mx-2">|</span>
              <span>{selectedGameDetails.daysOut} days out</span>
            </div>
          )}
          {!referenceSchedulesLoading && !selectedGameDetails && (
            <div className="mt-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
              No games available for the selected season.
            </div>
          )}
        </div>

        <div id="game-center-kpis" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {gameCenterLoading &&
            Array.from({ length: 5 }, (_, index) => (
              <div key={`game-kpi-skeleton-${index}`} className="rounded-lg shadow-sm p-4 animate-pulse" style={{ backgroundColor: '#ededed' }}>
                <div className="h-3 w-24 rounded bg-gray-300" />
                <div className="mt-3 h-8 w-20 rounded bg-gray-300" />
              </div>
            ))}
          {!gameCenterLoading && gameCenterKpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg shadow-sm p-4" style={{ backgroundColor: '#ededed' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>
              {kpi.delta && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    kpi.deltaTone === 'positive'
                      ? 'text-emerald-700'
                      : kpi.deltaTone === 'negative'
                        ? 'text-rose-700'
                        : 'text-gray-700'
                  }`}
                >
                  {kpi.delta}
                </p>
              )}
            </div>
          ))}
          {!gameCenterLoading && !gameCenterData && (
            <div className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 md:col-span-2 xl:col-span-5">
              Game data is unavailable for this selection.
            </div>
          )}
        </div>

        <div className="relative overflow-visible">
          <div id="game-center-pacing" className="rounded-lg shadow-sm p-4 sm:p-5" style={{ backgroundColor: '#ededed' }}>
            <div className="mb-3 flex items-center">
              <h3 className="text-base font-semibold text-text-primary">Game Revenue Trend</h3>
              <div className="h-px flex-1 bg-border-light ml-3" />
            </div>
            {gameCenterLoading ? (
              <ChartSkeleton height="h-96" showTitle={false} />
            ) : filteredGameRevenueTrendData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={filteredGameRevenueTrendData} margin={{ top: 12, right: 20, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke="#D1D5DB" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="daysOut"
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      axisLine={false}
                      tickLine={false}
                      domain={gameRevenueYAxisDomain}
                      tickFormatter={(value) => `$${Math.round(value / 1000)}K`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;

                        const point = payload[0]?.payload as { daysOut: number; actualRevenue: number; ticketsSold: number } | undefined;
                        if (!point) return null;

                        return (
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm">
                            <p className="text-xs text-gray-500">{label} days out</p>
                            <p className="text-sm font-medium text-gray-900">
                              Actual Revenue: ${point.actualRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              Tickets Sold: {point.ticketsSold.toLocaleString()}
                            </p>
                          </div>
                        );
                      }}
                      cursor={{ stroke: '#D1D5DB', strokeDasharray: '4 4' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualRevenue"
                      name="Actual Revenue"
                      stroke="#1E3A8A"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: '#1E3A8A', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-600">
                {hasProductRevenueTrend && selectedTrendProductSet.size === 0
                  ? 'Please Select a product'
                  : gameRevenueTrendData.length > 0
                  ? `No revenue trend data available for the ${selectedRevenueRange} window.`
                  : 'No revenue trend data available for this game.'}
              </div>
            )}
            {gameRevenueTrendProductOptions.length > 0 && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">Products</p>
                <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTrendProducts(isAllTrendProductsSelected ? [] : allTrendProductIds)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isAllTrendProductsSelected
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-pressed={isAllTrendProductsSelected}
                  >
                    All
                  </button>
                  {gameRevenueTrendProductOptions.map((productOption) => {
                    const isSelected = selectedTrendProductSet.has(productOption.id);
                    return (
                      <button
                        key={productOption.id}
                        type="button"
                        onClick={() => toggleTrendProduct(productOption.id)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600 text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {productOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="absolute left-full top-0 ml-3 hidden xl:flex flex-col space-y-2">
            {GAME_REVENUE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRevenueRange(option.key)}
                className={`flex h-12 w-16 items-center justify-center rounded-md border text-[13px] font-semibold transition-colors ${
                  selectedRevenueRange === option.key
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 xl:hidden">
            {GAME_REVENUE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRevenueRange(option.key)}
                className={`flex h-10 min-w-14 items-center justify-center rounded-md border px-2 text-[12px] font-semibold transition-colors ${
                  selectedRevenueRange === option.key
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div id="game-center-price-levels" className="rounded-lg shadow-sm p-4 sm:p-5 xl:col-span-4 h-[38rem] flex flex-col" style={{ backgroundColor: '#ededed' }}>
            <div className="flex items-center mb-3">
              <h3 className="text-base font-semibold text-text-primary">Price Level Inventory</h3>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>
            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
              {sortedPriceLevelInventory.map((row) => (
                <div key={row.price_level} className="rounded-md border border-gray-200 bg-white p-3">
                  <p className="text-sm font-semibold text-gray-900">{row.price_level}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                    <span>{Math.round(row.sold_tickets).toLocaleString()} tickets</span>
                    <span>{formatCompactCurrency(row.revenue)} revenue</span>
                  </div>
                </div>
              ))}
              {!gameCenterLoading && sortedPriceLevelInventory.length === 0 && (
                <div className="rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-600">
                  No price level data available.
                </div>
              )}
            </div>
          </div>

          <div id="game-center-channel-mix" className="rounded-lg shadow-sm p-4 sm:p-5 xl:col-span-8 h-[38rem] flex flex-col overflow-hidden" style={{ backgroundColor: '#ededed' }}>
            <div className="flex items-center mb-3">
              <h3 className="text-base font-semibold text-text-primary">Product x Price Level Heat Map</h3>
              <div className="flex-1 h-px bg-gray-200 ml-4"></div>
            </div>
            <div className="flex-1 min-h-0">
              {gameCenterLoading ? (
                <ChartSkeleton height="h-full" showTitle={false} />
              ) : heatMapPriceLevels.length > 0 && heatMapProducts.length > 0 ? (
                <HeatMapMatrix
                  title="Revenue Concentration"
                  subtitle={selectedGameDetails ? `${selectedGameDetails.eventCode} • ${selectedGameDetails.opponent}` : 'Selected game'}
                  xLabel="Price Levels"
                  yLabel="Products"
                  xValues={heatMapPriceLevels}
                  yValues={heatMapProducts}
                  cells={gameHeatMapCells}
                  valueLabel="Revenue"
                  fillHeight
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-md border border-gray-300 bg-white text-sm text-gray-600">
                  No heat map data available for this game.
                </div>
              )}
            </div>
          </div>
        </div>

        <div id="game-center-ancillary-products" className="space-y-3">
          <div className="flex items-center">
            <h3 className="text-base font-semibold text-text-primary">Ancillary Products</h3>
            <div className="flex-1 h-px bg-gray-200 ml-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {gameCenterLoading &&
            Array.from({ length: 4 }, (_, index) => (
              <div key={`game-secondary-kpi-skeleton-${index}`} className="rounded-lg shadow-sm p-4 animate-pulse" style={{ backgroundColor: '#ededed' }}>
                <div className="h-3 w-28 rounded bg-gray-300" />
                <div className="mt-3 h-8 w-20 rounded bg-gray-300" />
              </div>
            ))}
          {!gameCenterLoading && gameCenterSecondaryKpis.map((kpi) => (
            <div key={kpi.label} className="rounded-lg shadow-sm p-4" style={{ backgroundColor: '#ededed' }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          ))}
          </div>
        </div>
        {gameCenterError && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load Game Command Center data. {gameCenterError}
          </div>
        )}

      </div>
      )}

      {/* Game Summary Section - Always render with ID for search navigation */}
      {(salesView === 'analysis') && (
      <div id="game-summary" className="space-y-3">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-text-primary">Game Summary</h2>
          <div className="flex-1 h-px bg-gray-200 ml-4"></div>
        </div>

        <GameSummaryTable
          rows={gameSummaryRows}
          onQueryChange={(query) => {
            const routeQuery = buildRouteQueryFromGameSummary(query);
            router.replace(salesAnalysisPath(routeQuery), { scroll: false });
          }}
          isLoading={gameSummaryLoading}
          seasonOptions={analysisSeasonOptions}
          routeSortValues={analysisRouteQuery.sort}
          defaultQuery={analysisQueryFromRoute}
        />
      </div>
      )}
      {gameRouteNotice && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {gameRouteNotice}
        </div>
      )}
    </motion.div>
  );
}
