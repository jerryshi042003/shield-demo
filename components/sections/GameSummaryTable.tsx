'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SALES_ANALYSIS_SEASON,
  type GameSummaryApiRow,
  type GameSummaryQuery
} from '@/lib/hooks/useGameSummaryData';

type TextAlign = 'left' | 'center' | 'right';
type SortDirection = 'asc' | 'desc';
type DatePreset = 'ALL' | 'TODAY' | 'PREV_DAY' | 'LAST_7' | 'LAST_30' | 'LAST_90';
type DaysOutBucket = 'ALL' | '0_7' | '8_14' | '15_30' | '31_PLUS';

interface PriceLevelBreakdown {
  priceLevel: string;
  individualTickets: number;
  groupTickets: number;
  compTickets: number;
  parkingTickets: number;
  experienceVouchers: number;
  passes: number;
  itemGiveaway: number;
  paidTickets: number;
  distributedTickets: number;
  individualRevenue: number;
  groupRevenue: number;
  totalRevenue: number;
  atp: number;
  scans: number;
  attendees: number;
}

interface GameSummaryRow {
  eventId: string;
  eventCode: string;
  eventDate: string;
  dateObj: Date;
  dow: string;
  eventTime: string;
  opponent: string;
  seasonEventYear: string;
  seasonType: string;
  daysOut: number;
  individualTickets: number;
  groupTickets: number;
  compTickets: number;
  parkingTickets: number;
  experienceVouchers: number;
  passes: number;
  itemGiveaway: number;
  paidTickets: number;
  distributedTickets: number;
  individualRevenue: number;
  groupRevenue: number;
  totalRevenue: number;
  atp: number;
  scans: number;
  attendees: number;
  priceLevelBreakdown: PriceLevelBreakdown[];
}

interface DisplayRow extends GameSummaryRow {
  displayPriceLevel: string;
  visiblePriceLevels: PriceLevelBreakdown[];
}

export interface GameSummaryColumn {
  id: string;
  label: string;
  align?: TextAlign;
  className?: string;
  render: (row: DisplayRow, index: number) => React.ReactNode;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

function parseLocalDate(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  }).format(date);
}

function formatDayOfWeek(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

function formatEventTimeLabel(timeValue: string): string {
  const [hourText = '0', minuteText = '0'] = timeValue.split(':');
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeValue;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  const minutePadded = String(minute).padStart(2, '0');
  return `${twelveHour}:${minutePadded} ${suffix} PST`;
}

function normalizeSeasonValue(value: string | number): string {
  return String(value).trim();
}

function parseSeasonForApi(value: string): string {
  const normalized = value.trim();
  if (!normalized) return 'ALL';
  return normalized.toUpperCase() === 'ALL' ? 'ALL' : normalized;
}

function formatSeasonDisplay(value: string): string {
  if (value === 'ALL') return 'All';
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return trimmed;
  const startYY = Number.parseInt(trimmed.slice(0, 2), 10);
  const endYY = trimmed.slice(2);
  const startYear = 2000 + startYY;
  return `${startYear}-${endYY}`;
}

function formatSeasonTypeDisplay(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'ALL') return 'All';
  if (normalized === 'PRE') return 'Pre-season';
  if (normalized === 'REG') return 'Regular Season';
  if (normalized === 'POST' || normalized === 'PST') return 'Playoffs';
  return value;
}

function buildSeasonOptionsFrom1516ToNext(): string[] {
  const startYearYY = 15;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const currentSeasonStart = month < 6 ? year - 1 : year;
  const nextSeasonStartYY = (currentSeasonStart + 1) % 100;

  const options: string[] = [];
  for (let yy = startYearYY; ; yy += 1) {
    const start = yy % 100;
    const end = (start + 1) % 100;
    options.push(`${String(start).padStart(2, '0')}${String(end).padStart(2, '0')}`);
    if (start === nextSeasonStartYY) break;
  }
  return options.reverse();
}

function alignClassName(align: TextAlign) {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

function compareSortValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true });
}

function getSortValue(row: DisplayRow, columnId: string): string | number {
  if (columnId === 'event_code') return row.eventCode;
  if (columnId === 'event_date') return row.dateObj.getTime();
  if (columnId === 'dow') return row.dow;
  if (columnId === 'event_time') return row.eventTime;
  if (columnId === 'opponent') return row.opponent;
  if (columnId === 'price_level') return row.displayPriceLevel;
  if (columnId === 'individual_tickets') return row.individualTickets;
  if (columnId === 'group_tickets') return row.groupTickets;
  if (columnId === 'comp_tickets') return row.compTickets;
  if (columnId === 'parking_tickets') return row.parkingTickets;
  if (columnId === 'experience_vouchers') return row.experienceVouchers;
  if (columnId === 'passes') return row.passes;
  if (columnId === 'item_giveaway') return row.itemGiveaway;
  if (columnId === 'paid_tickets') return row.paidTickets;
  if (columnId === 'distributed_tickets') return row.distributedTickets;
  if (columnId === 'individual_revenue') return row.individualRevenue;
  if (columnId === 'group_revenue') return row.groupRevenue;
  if (columnId === 'total_revenue') return row.totalRevenue;
  if (columnId === 'atp') return row.atp;
  if (columnId === 'scans') return row.scans;
  if (columnId === 'attendees') return row.attendees;
  return '';
}

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function metricForChild(child: PriceLevelBreakdown, columnId: string): React.ReactNode {
  if (columnId === 'price_level') return child.priceLevel;
  if (columnId === 'individual_tickets') return integerFormatter.format(child.individualTickets);
  if (columnId === 'group_tickets') return integerFormatter.format(child.groupTickets);
  if (columnId === 'comp_tickets') return integerFormatter.format(child.compTickets);
  if (columnId === 'parking_tickets') return integerFormatter.format(child.parkingTickets);
  if (columnId === 'experience_vouchers') return integerFormatter.format(child.experienceVouchers);
  if (columnId === 'passes') return integerFormatter.format(child.passes);
  if (columnId === 'item_giveaway') return integerFormatter.format(child.itemGiveaway);
  if (columnId === 'paid_tickets') return integerFormatter.format(child.paidTickets);
  if (columnId === 'distributed_tickets') return integerFormatter.format(child.distributedTickets);
  if (columnId === 'individual_revenue') return currencyFormatter.format(child.individualRevenue);
  if (columnId === 'group_revenue') return currencyFormatter.format(child.groupRevenue);
  if (columnId === 'total_revenue') return currencyFormatter.format(child.totalRevenue);
  if (columnId === 'atp') return currencyFormatter.format(child.atp);
  if (columnId === 'scans') return integerFormatter.format(child.scans);
  if (columnId === 'attendees') return integerFormatter.format(child.attendees);
  return '';
}

// Keep this array as the single source of truth for column order/visibility.
export const GAME_SUMMARY_COLUMNS: GameSummaryColumn[] = [
  { id: 'event_code', label: 'Event Code', className: 'min-w-40', render: (row) => row.eventCode },
  { id: 'event_date', label: 'Event Date', className: 'min-w-28', render: (row) => row.eventDate },
  { id: 'dow', label: 'Day of week', className: 'w-16', render: (row) => row.dow },
  { id: 'event_time', label: 'Event Time', className: 'min-w-24', render: (row) => row.eventTime },
  { id: 'opponent', label: 'Opponent', className: 'min-w-44', render: (row) => row.opponent },
  { id: 'price_level', label: 'Price Level', className: 'min-w-32', render: (row) => row.displayPriceLevel },
  { id: 'individual_tickets', label: 'Individual Tickets', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.individualTickets) },
  { id: 'group_tickets', label: 'Group Tickets', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.groupTickets) },
  { id: 'comp_tickets', label: 'Complimentary Tickets', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.compTickets) },
  { id: 'paid_tickets', label: 'Paid Tickets', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.paidTickets) },
  { id: 'distributed_tickets', label: 'Distributed Tickets', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.distributedTickets) },
  { id: 'individual_revenue', label: 'Individual Revenue', align: 'right', className: 'min-w-28', render: (row) => currencyFormatter.format(row.individualRevenue) },
  { id: 'group_revenue', label: 'Group Revenue', align: 'right', className: 'min-w-28', render: (row) => currencyFormatter.format(row.groupRevenue) },
  { id: 'total_revenue', label: 'Total Revenue', align: 'right', className: 'min-w-28', render: (row) => currencyFormatter.format(row.totalRevenue) },
  { id: 'atp', label: 'Average Ticket Price', align: 'right', className: 'min-w-20', render: (row) => currencyFormatter.format(row.atp) },
  { id: 'scans', label: 'Scans', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.scans) },
  { id: 'attendees', label: 'Attendees', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.attendees) },
  { id: 'parking_tickets', label: 'Parking Tickets', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.parkingTickets) },
  { id: 'experience_vouchers', label: 'Experience Vouchers', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.experienceVouchers) },
  { id: 'passes', label: 'Passes', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.passes) },
  { id: 'item_giveaway', label: 'Item Giveaway', align: 'right', className: 'min-w-24', render: (row) => integerFormatter.format(row.itemGiveaway) }
];

export function GameSummaryTable({
  rows,
  columns = GAME_SUMMARY_COLUMNS,
  onApplyFilters,
  onQueryChange,
  isLoading = false,
  seasonOptions,
  routeSortValues,
  defaultQuery
}: {
  rows: GameSummaryApiRow[];
  columns?: GameSummaryColumn[];
  onApplyFilters?: (query: GameSummaryQuery) => void;
  onQueryChange?: (query: GameSummaryQuery) => void;
  isLoading?: boolean;
  seasonOptions?: string[];
  routeSortValues?: string[];
  defaultQuery: GameSummaryQuery;
}) {
  const defaultSeason = normalizeSeasonValue(defaultQuery.filters.season[0] ?? DEFAULT_SALES_ANALYSIS_SEASON);
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [seasonYear, setSeasonYear] = useState<string>(defaultSeason);
  const [seasonType, setSeasonType] = useState<string>('ALL');
  const [priceLevel, setPriceLevel] = useState<string>('ALL');
  const [eventDayOfWeek, setEventDayOfWeek] = useState<string>('ALL');
  const [opponent, setOpponent] = useState<string>('ALL');
  const [daysOutBucket, setDaysOutBucket] = useState<DaysOutBucket>('ALL');
  const [salesDaysOutNumber, setSalesDaysOutNumber] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('event_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [appliedFiltersState, setAppliedFiltersState] = useState({
    datePreset: 'ALL' as DatePreset,
    seasonYear: defaultSeason,
    seasonType: 'ALL',
    priceLevel: 'ALL',
    eventDayOfWeek: 'ALL',
    opponent: 'ALL',
    daysOutBucket: 'ALL' as DaysOutBucket,
    salesDaysOutNumber: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const querySeasonRaw = defaultQuery.filters.season[0] ?? parseSeasonForApi(defaultSeason);
    const querySeason = normalizeSeasonValue(querySeasonRaw);
    const nextSeasonYear = querySeason === 'ALL' ? defaultSeason : querySeason;
    const nextSeasonType = defaultQuery.filters.season_type[0] ?? 'ALL';
    const nextPriceLevel = defaultQuery.filters.price_level[0] ?? 'ALL';
    const nextEventDayOfWeek = defaultQuery.filters.event_day_of_week[0] ?? 'ALL';
    const nextOpponent = defaultQuery.filters.opponent[0] ?? 'ALL';
    const nextDaysOut =
      defaultQuery.filters.days_out_category.length === 1 ? defaultQuery.filters.days_out_category[0] : 'ALL';
    const nextSalesDaysOutNumber =
      typeof defaultQuery.filters.sales_days_out_max === 'number' ? String(defaultQuery.filters.sales_days_out_max) : '';
    const nextStartDate = defaultQuery.filters.event_date_start ?? '';
    const nextEndDate = defaultQuery.filters.event_date_end ?? '';
    const nextDatePreset = defaultQuery.date_preset as DatePreset;

    setDatePreset(nextDatePreset);
    setSeasonYear(nextSeasonYear);
    setSeasonType(nextSeasonType);
    setPriceLevel(nextPriceLevel);
    setEventDayOfWeek(nextEventDayOfWeek);
    setOpponent(nextOpponent);
    setDaysOutBucket(nextDaysOut as DaysOutBucket);
    setSalesDaysOutNumber(nextSalesDaysOutNumber);
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    setAppliedFiltersState({
      datePreset: nextDatePreset,
      seasonYear: nextSeasonYear,
      seasonType: nextSeasonType,
      priceLevel: nextPriceLevel,
      eventDayOfWeek: nextEventDayOfWeek,
      opponent: nextOpponent,
      daysOutBucket: nextDaysOut as DaysOutBucket,
      salesDaysOutNumber: nextSalesDaysOutNumber,
      startDate: nextStartDate,
      endDate: nextEndDate
    });
  }, [defaultQuery, defaultSeason]);

  const validSortColumns = useMemo(() => new Set(columns.map((column) => column.id)), [columns]);

  useEffect(() => {
    if (!routeSortValues || routeSortValues.length === 0) return;

    const [rawField = '', rawDirection = 'asc'] = routeSortValues[0].split(':');
    const field = rawField.trim();
    if (!field || !validSortColumns.has(field)) return;

    const direction: SortDirection = rawDirection.trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
    setSortColumn(field);
    setSortDirection(direction);
  }, [routeSortValues, validSortColumns]);

  const today = useMemo(() => normalizeDate(new Date()), []);

  const tableRows = useMemo<GameSummaryRow[]>(() => {
    return rows.map((row) => {
      const dateObj = parseLocalDate(row.event_date);
      const metrics = row.metrics;
      const daysOut = Math.ceil((normalizeDate(dateObj).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const breakdown = (row.price_level_breakdown?.length
        ? row.price_level_breakdown.map((detail) => ({
            priceLevel: detail.price_level,
            individualTickets: detail.metrics.individual_tickets,
            groupTickets: detail.metrics.group_tickets,
            compTickets: detail.metrics.comp_tickets,
            parkingTickets: detail.metrics.parking_tickets,
            experienceVouchers: detail.metrics.experience_vouchers,
            passes: detail.metrics.passes,
            itemGiveaway: detail.metrics.item_giveaway,
            paidTickets: detail.metrics.paid_tickets,
            distributedTickets: detail.metrics.distributed_tickets,
            individualRevenue: detail.metrics.individual_revenue,
            groupRevenue: detail.metrics.group_revenue,
            totalRevenue: detail.metrics.total_revenue,
            atp: detail.metrics.atp,
            scans: detail.metrics.scans,
            attendees: detail.metrics.attendees
          }))
        : []);

      if (breakdown.length === 0 && row.price_level.trim()) {
        breakdown.push({
          priceLevel: row.price_level,
          individualTickets: metrics.individual_tickets,
          groupTickets: metrics.group_tickets,
          compTickets: metrics.comp_tickets,
          parkingTickets: metrics.parking_tickets,
          experienceVouchers: metrics.experience_vouchers,
          passes: metrics.passes,
          itemGiveaway: metrics.item_giveaway,
          paidTickets: metrics.paid_tickets,
          distributedTickets: metrics.distributed_tickets,
          individualRevenue: metrics.individual_revenue,
          groupRevenue: metrics.group_revenue,
          totalRevenue: metrics.total_revenue,
          atp: metrics.atp,
          scans: metrics.scans,
          attendees: metrics.attendees
        });
      }

      return {
        eventId: row.event_id,
        eventCode: row.event_code,
        eventDate: formatDateLabel(dateObj),
        dateObj,
        dow: row.dow || formatDayOfWeek(dateObj),
        eventTime: formatEventTimeLabel(row.event_time),
        opponent: row.opponent,
        seasonEventYear: normalizeSeasonValue(row.season),
        seasonType: (row.season_type ?? '').trim(),
        daysOut,
        individualTickets: metrics.individual_tickets,
        groupTickets: metrics.group_tickets,
        compTickets: metrics.comp_tickets,
        parkingTickets: metrics.parking_tickets,
        experienceVouchers: metrics.experience_vouchers,
        passes: metrics.passes,
        itemGiveaway: metrics.item_giveaway,
        paidTickets: metrics.paid_tickets,
        distributedTickets: metrics.distributed_tickets,
        individualRevenue: metrics.individual_revenue,
        groupRevenue: metrics.group_revenue,
        totalRevenue: metrics.total_revenue,
        atp: metrics.atp,
        scans: metrics.scans,
        attendees: metrics.attendees,
        priceLevelBreakdown: breakdown
      };
    });
  }, [rows, today]);

  const fallbackSeasonOptions = useMemo(buildSeasonOptionsFrom1516ToNext, []);
  const resolvedSeasonOptions = useMemo(
    () => (seasonOptions && seasonOptions.length > 0 ? seasonOptions : fallbackSeasonOptions),
    [fallbackSeasonOptions, seasonOptions]
  );
  const seasonOptionsWithDefault = useMemo(
    () => (resolvedSeasonOptions.includes(defaultSeason) ? resolvedSeasonOptions : [defaultSeason, ...resolvedSeasonOptions]),
    [defaultSeason, resolvedSeasonOptions]
  );
  const seasonTypeOptions = useMemo(
    () =>
      Array.from(new Set(tableRows.map((row) => row.seasonType).filter(Boolean))).sort((a, b) =>
        formatSeasonTypeDisplay(a).localeCompare(formatSeasonTypeDisplay(b), undefined, { sensitivity: 'base' })
      ),
    [tableRows]
  );
  const dayOptions = useMemo(() => Array.from(new Set(tableRows.map((row) => row.dow))), [tableRows]);
  const opponentOptions = useMemo(() => Array.from(new Set(tableRows.map((row) => row.opponent))), [tableRows]);
  const priceLevelOptions = useMemo(
    () => Array.from(new Set(tableRows.flatMap((row) => row.priceLevelBreakdown.map((detail) => detail.priceLevel)))),
    [tableRows]
  );

  const filteredRows = useMemo<DisplayRow[]>(() => {
    return tableRows.map((row) => ({
      ...row,
      displayPriceLevel: row.priceLevelBreakdown.length === 1 ? row.priceLevelBreakdown[0].priceLevel : 'All',
      visiblePriceLevels: row.priceLevelBreakdown
    }));
  }, [tableRows]);

  const sortedRows = useMemo<DisplayRow[]>(() => {
    return [...filteredRows].sort((a, b) => {
      const comparison = compareSortValues(getSortValue(a, sortColumn), getSortValue(b, sortColumn));
      if (comparison === 0) return a.eventCode.localeCompare(b.eventCode, undefined, { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  const activeFilters = useMemo(() => {
    const chips: Array<{ label: string; onClear: () => void }> = [];
    if (appliedFiltersState.datePreset !== 'ALL') chips.push({ label: `Date Preset: ${appliedFiltersState.datePreset.replace('_', ' ')}`, onClear: () => setDatePreset('ALL') });
    if (appliedFiltersState.seasonYear !== defaultSeason) {
      chips.push({ label: `Season: ${formatSeasonDisplay(appliedFiltersState.seasonYear)}`, onClear: () => setSeasonYear(defaultSeason) });
    }
    if (appliedFiltersState.seasonType !== 'ALL') chips.push({ label: `Season Type: ${formatSeasonTypeDisplay(appliedFiltersState.seasonType)}`, onClear: () => setSeasonType('ALL') });
    if (appliedFiltersState.priceLevel !== 'ALL') chips.push({ label: `Price Level: ${appliedFiltersState.priceLevel}`, onClear: () => setPriceLevel('ALL') });
    if (appliedFiltersState.eventDayOfWeek !== 'ALL') chips.push({ label: `Day: ${appliedFiltersState.eventDayOfWeek}`, onClear: () => setEventDayOfWeek('ALL') });
    if (appliedFiltersState.opponent !== 'ALL') chips.push({ label: `Opponent: ${appliedFiltersState.opponent}`, onClear: () => setOpponent('ALL') });
    if (appliedFiltersState.daysOutBucket !== 'ALL') chips.push({ label: `Days Out Category: ${appliedFiltersState.daysOutBucket.replace('_', '-')}`, onClear: () => setDaysOutBucket('ALL') });
    if (appliedFiltersState.salesDaysOutNumber) chips.push({ label: `Sales Days Out <= ${appliedFiltersState.salesDaysOutNumber}`, onClear: () => setSalesDaysOutNumber('') });
    if (appliedFiltersState.startDate) chips.push({ label: `Start: ${appliedFiltersState.startDate}`, onClear: () => setStartDate('') });
    if (appliedFiltersState.endDate) chips.push({ label: `End: ${appliedFiltersState.endDate}`, onClear: () => setEndDate('') });
    return chips;
  }, [appliedFiltersState, defaultSeason]);

  const clearAll = () => {
    setDatePreset('ALL');
    setSeasonYear(defaultSeason);
    setSeasonType('ALL');
    setPriceLevel('ALL');
    setEventDayOfWeek('ALL');
    setOpponent('ALL');
    setDaysOutBucket('ALL');
    setSalesDaysOutNumber('');
    setStartDate('');
    setEndDate('');
    setExpandedGames(new Set());
    setAppliedFiltersState({
      datePreset: 'ALL',
      seasonYear: defaultSeason,
      seasonType: 'ALL',
      priceLevel: 'ALL',
      eventDayOfWeek: 'ALL',
      opponent: 'ALL',
      daysOutBucket: 'ALL',
      salesDaysOutNumber: '',
      startDate: '',
      endDate: ''
    });
    onApplyFilters?.(defaultQuery);
    onQueryChange?.(defaultQuery);
  };

  const applyFilters = () => {
    const parsedSalesDaysOut = salesDaysOutNumber ? Number.parseInt(salesDaysOutNumber, 10) : null;
    const query: GameSummaryQuery = {
      ...defaultQuery,
      filters: {
        season: seasonYear === 'ALL' ? ['ALL'] : [parseSeasonForApi(seasonYear)],
        season_type: seasonType === 'ALL' ? ['ALL'] : [seasonType],
        event_date_start: startDate || null,
        event_date_end: endDate || null,
        days_out_category: daysOutBucket === 'ALL' ? ['0_7', '8_14', '15_30', '31_PLUS'] : [daysOutBucket],
        sales_days_out_max: parsedSalesDaysOut !== null && !Number.isNaN(parsedSalesDaysOut) ? parsedSalesDaysOut : null,
        price_level: priceLevel === 'ALL' ? ['ALL'] : [priceLevel],
        event_day_of_week: eventDayOfWeek === 'ALL' ? ['ALL'] : [eventDayOfWeek],
        opponent: opponent === 'ALL' ? ['ALL'] : [opponent]
      },
      date_preset: datePreset
    };

    onApplyFilters?.(query);
    onQueryChange?.(query);
    setAppliedFiltersState({
      datePreset,
      seasonYear,
      seasonType,
      priceLevel,
      eventDayOfWeek,
      opponent,
      daysOutBucket,
      salesDaysOutNumber,
      startDate,
      endDate
    });
  };

  const toggleGameExpanded = (eventCode: string) => {
    setExpandedGames((prev) => {
      const next = new Set(prev);
      if (next.has(eventCode)) next.delete(eventCode);
      else next.add(eventCode);
      return next;
    });
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(columnId);
    setSortDirection('asc');
  };

  return (
    <div className="space-y-4">
      <div className="border-0 rounded-lg shadow-sm p-4 sm:p-5" style={{ backgroundColor: '#ededed' }}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">Invoice Date Range</div>
          {[
            { value: 'ALL', label: 'All' },
            { value: 'TODAY', label: 'Today' },
            { value: 'PREV_DAY', label: 'Previous day' },
            { value: 'LAST_7', label: 'Last 7 days' },
            { value: 'LAST_30', label: 'Last 30 days' },
            { value: 'LAST_90', label: 'Last 90 days' }
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => setDatePreset(preset.value as DatePreset)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                datePreset === preset.value
                  ? 'bg-indigo-700 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Season
            <select value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900">
              <option value="ALL">Select values</option>
              {seasonOptionsWithDefault.map((value) => <option key={value} value={value}>{formatSeasonDisplay(value)}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Season Type
            <select value={seasonType} onChange={(e) => setSeasonType(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900">
              <option value="ALL">Select values</option>
              {seasonTypeOptions.map((value) => <option key={value} value={value}>{formatSeasonTypeDisplay(value)}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Event Date - Range
            <div className="grid grid-cols-2 gap-1">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900" />
            </div>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Event - Days Out Category
            <select value={daysOutBucket} onChange={(e) => setDaysOutBucket(e.target.value as DaysOutBucket)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900">
              <option value="ALL">Select values</option>
              <option value="0_7">0 - 7</option>
              <option value="8_14">8 - 14</option>
              <option value="15_30">15 - 30</option>
              <option value="31_PLUS">31+</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Sales - Days Out Number
            <input
              type="number"
              min={0}
              placeholder="e.g. 30"
              value={salesDaysOutNumber}
              onChange={(e) => setSalesDaysOutNumber(e.target.value)}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Price Level
            <select value={priceLevel} onChange={(e) => setPriceLevel(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900">
              <option value="ALL">Select values</option>
              {priceLevelOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Event - Day of Week
            <select value={eventDayOfWeek} onChange={(e) => setEventDayOfWeek(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900">
              <option value="ALL">Select values</option>
              {dayOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Opponent
            <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="h-9 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900">
              <option value="ALL">Select values</option>
              {opponentOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="mr-2 h-9 w-full rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-800"
            >
              Apply Filters
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearAll}
              className="h-9 w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-900"
            >
              Clear All
            </button>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.onClear}
                className="rounded-full border border-gray-300 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                {chip.label} x
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative border-0 rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: '#ededed' }}>
        <div className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-700">Game Summary Table</div>
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">{compactFormatter.format(sortedRows.length)} rows</div>
        </div>

        <div className="max-h-[30rem] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-gray-200">
              <tr className="border-b border-gray-300">
                {columns.map((column) => {
                  const align = alignClassName(column.align ?? 'left');
                  const isSortedColumn = sortColumn === column.id;
                  const indicator = isSortedColumn ? (sortDirection === 'asc' ? '▲' : '▼') : '';
                  return (
                    <th
                      key={column.id}
                      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 ${align} ${column.className ?? ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(column.id)}
                        className={`inline-flex items-center gap-1 hover:text-gray-900 ${align === 'text-right' ? 'ml-auto' : ''}`}
                      >
                        <span>{column.label}</span>
                        <span className="text-[10px] text-gray-500" aria-hidden="true">{indicator}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => {
                const isExpanded = expandedGames.has(row.eventCode);
                const canExpand = row.visiblePriceLevels.length > 1;

                return (
                  <Fragment key={row.eventCode}>
                    <tr
                      className="border-b border-gray-200 text-gray-700 transition-colors hover:bg-white/70"
                    >
                      {columns.map((column) => {
                        const align = alignClassName(column.align ?? 'left');
                        const value = column.render(row, index);
                        if (column.id === 'event_date') {
                          return (
                            <td
                              key={`${row.eventCode}-${column.id}`}
                              className={`px-3 py-2 font-medium ${align} ${column.className ?? ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleGameExpanded(row.eventCode)}
                                  className={`h-4 w-4 rounded-sm border text-[10px] leading-none ${
                                    canExpand
                                      ? 'border-gray-400 bg-white text-gray-700'
                                      : 'border-transparent bg-transparent text-transparent cursor-default'
                                  }`}
                                  aria-label={isExpanded ? 'Collapse price levels' : 'Expand price levels'}
                                  disabled={!canExpand}
                                >
                                  {canExpand ? (isExpanded ? '-' : '+') : ''}
                                </button>
                                <span>{value}</span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td
                            key={`${row.eventCode}-${column.id}`}
                            className={`px-3 py-2 font-medium ${align} ${column.className ?? ''}`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>

                    {isExpanded && canExpand && row.visiblePriceLevels.map((detail) => (
                      <tr
                        key={`${row.eventCode}-${detail.priceLevel}`}
                        className="border-b border-gray-100 bg-white/60 text-gray-700"
                      >
                        {columns.map((column) => {
                          const align = alignClassName(column.align ?? 'left');
                          if (column.id === 'price_level') {
                            return (
                              <td
                                key={`${row.eventCode}-${detail.priceLevel}-${column.id}`}
                                className={`px-3 py-2 text-sm font-medium ${align} ${column.className ?? ''}`}
                              >
                                <span className="pl-4">+ {detail.priceLevel}</span>
                              </td>
                            );
                          }

                          if (['event_code', 'event_date', 'dow', 'event_time', 'opponent'].includes(column.id)) {
                            return (
                              <td
                                key={`${row.eventCode}-${detail.priceLevel}-${column.id}`}
                                className={`px-3 py-2 text-sm text-gray-500 ${align} ${column.className ?? ''}`}
                              >
                                {' '}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={`${row.eventCode}-${detail.priceLevel}-${column.id}`}
                              className={`px-3 py-2 text-sm font-medium ${align} ${column.className ?? ''}`}
                            >
                              {metricForChild(detail, column.id)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/55">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
          </div>
        )}
      </div>
    </div>
  );
}
