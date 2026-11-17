#!/usr/bin/env node
/**
 * Shield public demo: synthetic fixture generator.
 *
 * Every number, name and order written by this script is invented. Nothing is
 * read from a warehouse, API, file export or real report. The output is
 * deterministic for a given SEED so the checked-in fixtures can be regenerated
 * and reviewed:
 *
 *   node scripts/generate-demo-fixtures.mjs
 *
 * Team identities (LA Kings, LA Galaxy, Ontario Reign) and public opponent team
 * names are kept for the portfolio demo. People are obviously fictional.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = 20261001;
/** The demo's frozen "today". All fixtures are as of this Pacific date. */
const AS_OF = '2026-10-01';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'demo', 'fixtures');

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const between = (low, high) => low + (high - low) * rand();
const int = (low, high) => Math.floor(between(low, high + 1));
const pick = (items) => items[Math.floor(rand() * items.length)];
const money = (value) => Math.round(value * 100) / 100;
const whole = (value) => Math.round(value);

const DAY = 86_400_000;
const asOfMs = Date.parse(`${AS_OF}T00:00:00Z`);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const addDays = (date, days) => iso(Date.parse(`${date}T00:00:00Z`) + days * DAY);
const daysBetween = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dow = (date) => DOW[new Date(`${date}T00:00:00Z`).getUTCDay()];
const isWeekend = (date) => ['FRI', 'SAT', 'SUN'].includes(dow(date));

/** Last completed Monday–Sunday sales week before AS_OF, and the seven before it. */
const currentMonday = asOfMs - ((new Date(asOfMs).getUTCDay() + 6) % 7) * DAY;
const completedWeeks = Array.from({ length: 12 }, (_, index) =>
  iso(currentMonday - (12 - index) * 7 * DAY)
);
const lastWeekStart = completedWeeks[completedWeeks.length - 1];
const lastWeekEnd = addDays(lastWeekStart, 6);

function write(name, value) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, name), `${JSON.stringify(value)}\n`);
}

/* ------------------------------------------------------------------ */
/* Schedules                                                          */
/* ------------------------------------------------------------------ */

const NHL = [
  'Anaheim Ducks', 'Boston Bruins', 'Buffalo Sabres', 'Calgary Flames',
  'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche',
  'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings',
  'Edmonton Oilers', 'Florida Panthers', 'Minnesota Wild',
  'Montreal Canadiens', 'Nashville Predators', 'New Jersey Devils',
  'New York Islanders', 'New York Rangers', 'Ottawa Senators',
  'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks',
  'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning',
  'Toronto Maple Leafs', 'Utah Hockey Club', 'Vancouver Canucks',
  'Vegas Golden Knights', 'Washington Capitals', 'Winnipeg Jets'
];
const RIVALS = new Set(['Anaheim Ducks', 'Vegas Golden Knights', 'Edmonton Oilers', 'San Jose Sharks']);
const DRAWS = new Set(['Toronto Maple Leafs', 'Boston Bruins', 'New York Rangers', 'Montreal Canadiens', 'Edmonton Oilers']);
const AHL = [
  'San Diego Gulls', 'Coachella Valley Firebirds', 'Bakersfield Condors',
  'Tucson Roadrunners', 'Henderson Silver Knights', 'San Jose Barracuda',
  'Colorado Eagles', 'Calgary Wranglers', 'Abbotsford Canucks'
];
const MLS = [
  'Seattle Sounders FC', 'Portland Timbers', 'Los Angeles FC',
  'San Jose Earthquakes', 'Vancouver Whitecaps FC', 'Real Salt Lake',
  'Colorado Rapids', 'Austin FC', 'FC Dallas', 'Houston Dynamo FC',
  'Sporting Kansas City', 'Minnesota United FC', 'St. Louis City SC',
  'San Diego FC', 'Inter Miami CF', 'New England Revolution',
  'Atlanta United FC'
];
const THEMES = [
  null, null, null, 'Opening Night', 'Hockey Fights Cancer', 'Military Appreciation',
  'Pride Night', 'Lunar New Year', 'Fan Appreciation', 'Bobblehead Night',
  'Throwback Night', 'Kids Day', null, null
];

/** Spread `count` home dates between start and end, favoring weekends. */
function scheduleDates(start, end, count) {
  const span = daysBetween(start, end);
  const dates = new Set();
  let guard = 0;
  while (dates.size < count && guard < 10_000) {
    guard += 1;
    const offset = Math.floor((span * (dates.size + rand() * 0.9)) / count);
    let date = addDays(start, Math.min(span, offset));
    if (!isWeekend(date) && rand() < 0.45) date = addDays(date, (5 - new Date(`${date}T00:00:00Z`).getUTCDay() + 7) % 7);
    if (daysBetween(date, end) < 0) date = end;
    dates.add(date);
  }
  return [...dates].sort();
}

function buildSchedule({ franchise, codePrefix, opponents, seasons }) {
  return seasons.map(({ season, seasonType, start, end, count }) => {
    const dates = scheduleDates(start, end, count);
    const pool = [...opponents];
    const games = dates.map((date, index) => {
      if (!pool.length) pool.push(...opponents);
      const opponent = pool.splice(Math.floor(rand() * pool.length), 1)[0];
      const theme = index === 0 && seasonType === 'REG' ? 'Opening Night' : pick(THEMES);
      return {
        event_code: `${codePrefix}${season}${seasonType[0]}${String(index + 1).padStart(2, '0')}`,
        event_date: date,
        start_time_local: isWeekend(date) && rand() < 0.4 ? '13:00' : '19:30',
        opponent,
        theme_night: theme,
        days_out: daysBetween(AS_OF, date)
      };
    });
    return {
      franchise,
      season,
      season_type: seasonType,
      season_key: `${season}${seasonType}`,
      label: '',
      games
    };
  });
}

/* ------------------------------------------------------------------ */
/* Legacy command-center data (Kings + Reign)                          */
/* ------------------------------------------------------------------ */

const PRICE_LEVELS = {
  LAK: ['Lower Bowl', 'Club', 'Upper Bowl', 'Suites', 'Standing Room'],
  ONT: ['Glass', 'Lower Bowl', 'Upper Bowl', 'Party Deck']
};
const CHANNEL_PRODUCTS = ['Full Season', 'Partial Plan', 'Group', 'Single Game', 'Comp'];
const TREND_PRODUCTS = [
  { product_id: 'fse', label: 'Full Season', display_order: 1 },
  { product_id: 'group', label: 'Group', display_order: 2 },
  { product_id: 'individual', label: 'Single Game', display_order: 3 }
];
const DAYS_OUT_POINTS = [150, 120, 90, 75, 60, 45, 30, 21, 14, 10, 7, 5, 3, 2, 1, 0];

function gameEconomics(franchise, game, seasonType) {
  const capacity = franchise === 'LAK' ? 18_000 : 9_800;
  const basePrice = franchise === 'LAK' ? 96 : 34;
  let demand = seasonType === 'PRE' ? between(0.52, 0.68) : between(0.78, 0.93);
  if (RIVALS.has(game.opponent) || DRAWS.has(game.opponent)) demand += 0.05;
  if (isWeekend(game.event_date)) demand += 0.03;
  if (game.theme_night) demand += 0.02;
  demand = Math.min(0.995, demand);
  const priceFactor = (seasonType === 'PRE' ? 0.62 : 1) * between(0.92, 1.12) *
    (RIVALS.has(game.opponent) ? 1.08 : 1);
  const daysOut = game.days_out;
  // Sales curve: share of final sales booked at a given days-out point, with a walk-up bump.
  const sold = (d) => (d <= 0 ? 1 : Math.max(0.05, 0.9 - 0.55 * Math.pow(Math.min(d, 180) / 180, 0.6)));
  const finalTickets = whole(capacity * demand);
  const toDateFraction = daysOut <= 0 ? 1 : sold(daysOut);
  const ticketsToDate = whole(finalTickets * toDateFraction);
  const atp = basePrice * priceFactor;
  const revenueToDate = money(ticketsToDate * atp);
  return { capacity, finalTickets, ticketsToDate, atp, revenueToDate, sold, daysOut };
}

function splitShares(keys, weights) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(keys.map((key, index) => [key, weights[index] / total]));
}

function buildGameCenter(franchise, seasonEntry, game) {
  const econ = gameEconomics(franchise, game, seasonEntry.season_type);
  const comp = whole(econ.ticketsToDate * between(0.04, 0.08));
  const paid = econ.ticketsToDate - comp;
  const priceLevels = PRICE_LEVELS[franchise];
  const levelShare = splitShares(priceLevels, priceLevels.map((_, i) => (i === 0 ? 4 : i === 2 ? 5 : 1.5) * between(0.8, 1.2)));
  const multipliers = priceLevels.map((_, i) => [1.25, 2.1, 0.62, 3.6, 0.45][i] ?? 1);
  // Ticket-weighted average multiplier is 1, so total revenue ≈ paid tickets × ATP.
  const weighted = priceLevels.reduce((sum, level, i) => sum + levelShare[level] * multipliers[i], 0);
  const levelPrice = Object.fromEntries(priceLevels.map((level, i) => [level, multipliers[i] / weighted]));
  const paidShare = paid / Math.max(1, econ.ticketsToDate);
  const price_level_inventory = priceLevels.map((level) => {
    const sold_tickets = whole(econ.ticketsToDate * levelShare[level]);
    return { price_level: level, sold_tickets, revenue: money(sold_tickets * paidShare * econ.atp * levelPrice[level]) };
  });
  const productShare = splitShares(CHANNEL_PRODUCTS, [5.2, 1.3, 1.1, 2.1, 0.5].map((v) => v * between(0.85, 1.15)));
  const nonCompShare = 1 - productShare.Comp;
  const cells = [];
  for (const level of priceLevels) {
    for (const product of CHANNEL_PRODUCTS) {
      const tickets = whole(econ.ticketsToDate * levelShare[level] * productShare[product]);
      cells.push({
        x: level,
        y: product,
        tickets,
        revenue: product === 'Comp' ? 0 : money((tickets / nonCompShare) * paidShare * econ.atp * levelPrice[level])
      });
    }
  }
  const points = DAYS_OUT_POINTS.filter((d) => d >= Math.max(0, econ.daysOut));
  const game_revenue_trend = points.map((d) => ({
    days_out: d,
    tickets_sold: whole(econ.finalTickets * econ.sold(d)),
    actual_revenue: money(econ.finalTickets * econ.sold(d) * econ.atp)
  }));
  const productWeights = [0.58, 0.14, 0.28];
  const product_revenue_trend = {
    products: TREND_PRODUCTS,
    series: TREND_PRODUCTS.map((product, index) => ({
      product_id: product.product_id,
      points: game_revenue_trend.map((point) => ({
        days_out: point.days_out,
        tickets_sold: whole(point.tickets_sold * productWeights[index]),
        actual_revenue: money(point.actual_revenue * productWeights[index] * (index === 2 ? 1.25 : index === 1 ? 0.8 : 0.94))
      }))
    }))
  };
  const revenue = money(price_level_inventory.reduce((sum, row) => sum + row.revenue, 0));
  return {
    franchise,
    season: seasonEntry.season,
    season_type: seasonEntry.season_type,
    event_code: game.event_code,
    event_date: game.event_date,
    opponent: game.opponent,
    last_updated: `${AS_OF}T13:05:00Z`,
    kpis: {
      tickets_sold: econ.ticketsToDate,
      paid_tickets: paid,
      revenue,
      // Percent units (76.4 = 76.4%), matching the command-center display.
      sell_through: Math.round(Math.min(100, (100 * econ.ticketsToDate) / econ.capacity) * 10) / 10,
      atp: paid > 0 ? money(revenue / paid) : 0,
      parking_tickets: whole(econ.ticketsToDate * between(0.11, 0.16)),
      experience_vouchers: int(10, 140),
      passes: int(20, 260),
      item_giveaway: game.theme_night ? whole(econ.ticketsToDate * 0.6) : 0
    },
    game_revenue_trend,
    product_revenue_trend,
    price_level_inventory,
    heatmap: { x_axis_values: priceLevels, y_axis_values: CHANNEL_PRODUCTS, cells },
    _goal: money(revenue / (econ.daysOut > 0 ? between(0.55, 0.9) : between(0.86, 1.08)) * (econ.daysOut > 0 ? 1 : 1)),
    _scans: econ.daysOut > 0 ? 0 : whole(econ.ticketsToDate * between(0.84, 0.93))
  };
}

function buildSeasonCenter(franchise, seasonEntry, gameCenters) {
  const games = gameCenters;
  const sum = (fn) => games.reduce((total, game) => total + fn(game), 0);
  const revenue = money(sum((g) => g.kpis.revenue));
  const goal = money(sum((g) => g._goal));
  const tickets = sum((g) => g.kpis.tickets_sold);
  const paid = sum((g) => g.kpis.paid_tickets);
  const firstDate = games[0]?.event_date ?? AS_OF;
  const cycleStart = addDays(firstDate, -200);
  const elapsed = Math.max(1, Math.min(daysBetween(cycleStart, AS_OF), daysBetween(cycleStart, games.at(-1)?.event_date ?? AS_OF)));
  const trendDays = Array.from({ length: 21 }, (_, i) => Math.round((elapsed * i) / 20));
  const season_revenue_trend = trendDays.map((day) => {
    const share = Math.pow(day / elapsed, 0.8);
    return { day_of_sales_cycle: day, actual_revenue: money(revenue * share), tickets_sold: whole(tickets * share) };
  });
  const productWeights = [0.6, 0.13, 0.27];
  const levels = PRICE_LEVELS[franchise];
  const priceRows = levels.map((level) => ({
    price_level: level,
    sold_tickets: sum((g) => g.price_level_inventory.find((r) => r.price_level === level)?.sold_tickets ?? 0),
    revenue: money(sum((g) => g.price_level_inventory.find((r) => r.price_level === level)?.revenue ?? 0))
  }));
  const cells = [];
  for (const level of levels) for (const product of CHANNEL_PRODUCTS) {
    cells.push({
      x: level,
      y: product,
      tickets: sum((g) => g.heatmap.cells.find((c) => c.x === level && c.y === product)?.tickets ?? 0),
      revenue: money(sum((g) => g.heatmap.cells.find((c) => c.x === level && c.y === product)?.revenue ?? 0))
    });
  }
  const upcoming = games.filter((g) => daysBetween(AS_OF, g.event_date) >= 0);
  const next = upcoming[0];
  const schedule = seasonEntry.games;
  return {
    franchise,
    season: seasonEntry.season,
    season_type: seasonEntry.season_type,
    season_key: seasonEntry.season_key,
    last_updated: `${AS_OF}T13:05:00Z`,
    kpis: {
      tickets_sold: tickets,
      paid_tickets: paid,
      revenue,
      new_fse: seasonEntry.season_type === 'REG' ? int(franchise === 'LAK' ? 900 : 180, franchise === 'LAK' ? 1600 : 420) : 0,
      atp: paid ? money(revenue / paid) : 0
    },
    goals: {
      revenue_goal: goal,
      revenue_percent_to_goal: goal ? Math.round((1000 * revenue) / goal) / 10 : 0,
      revenue_variance: money(revenue - goal)
    },
    season_revenue_trend,
    product_revenue_trend: {
      products: TREND_PRODUCTS,
      series: TREND_PRODUCTS.map((product, index) => ({
        product_id: product.product_id,
        points: season_revenue_trend.map((p) => ({
          day_of_sales_cycle: p.day_of_sales_cycle,
          actual_revenue: money(p.actual_revenue * productWeights[index]),
          tickets_sold: whole(p.tickets_sold * productWeights[index])
        }))
      }))
    },
    upcoming_games: upcoming.slice(0, 6).map((g) => {
      const ref = schedule.find((s) => s.event_code === g.event_code);
      return {
        event_code: g.event_code,
        event_date: g.event_date,
        opponent: g.opponent,
        theme_night: ref?.theme_night ?? null,
        days_out: daysBetween(AS_OF, g.event_date),
        revenue: g.kpis.revenue,
        tickets_sold: g.kpis.tickets_sold,
        game_goal_amount: g._goal,
        percent_to_goal: g._goal ? Math.round((1000 * g.kpis.revenue) / g._goal) / 10 : 0
      };
    }),
    next_game: next
      ? {
          event_code: next.event_code,
          event_date: next.event_date,
          start_time_local: schedule.find((s) => s.event_code === next.event_code)?.start_time_local ?? '19:30',
          opponent: next.opponent,
          theme_night: schedule.find((s) => s.event_code === next.event_code)?.theme_night ?? null,
          days_out: daysBetween(AS_OF, next.event_date)
        }
      : null,
    price_level_inventory: priceRows,
    heatmap: { x_axis_values: levels, y_axis_values: CHANNEL_PRODUCTS, cells },
    ancillary_products: {
      parking_tickets: sum((g) => g.kpis.parking_tickets),
      experience_vouchers: sum((g) => g.kpis.experience_vouchers),
      passes: sum((g) => g.kpis.passes),
      item_giveaway: sum((g) => g.kpis.item_giveaway)
    }
  };
}

function summaryMetrics(center, share = 1) {
  const k = center.kpis;
  const groupShare = 0.14;
  const individual = whole(k.paid_tickets * 0.3 * share);
  const group = whole(k.paid_tickets * groupShare * share);
  const comp = whole((k.tickets_sold - k.paid_tickets) * share);
  const individualRevenue = money(k.revenue * 0.36 * share);
  const groupRevenue = money(k.revenue * 0.11 * share);
  return {
    individual_tickets: individual,
    group_tickets: group,
    comp_tickets: comp,
    parking_tickets: whole(k.parking_tickets * share),
    experience_vouchers: whole(k.experience_vouchers * share),
    passes: whole(k.passes * share),
    item_giveaway: whole(k.item_giveaway * share),
    paid_tickets: whole(k.paid_tickets * share),
    distributed_tickets: whole(k.tickets_sold * share),
    individual_revenue: individualRevenue,
    group_revenue: groupRevenue,
    total_revenue: money(k.revenue * share),
    atp: k.atp,
    scans: whole(center._scans * share),
    attendees: whole(center._scans * 0.97 * share)
  };
}

function buildLegacy(franchise, codePrefix, opponents, seasons) {
  const schedules = buildSchedule({ franchise, codePrefix, opponents, seasons });
  const gameCenters = {};
  const seasonCenters = {};
  const summaryRows = [];
  for (const seasonEntry of schedules) {
    const centers = seasonEntry.games.map((game) => buildGameCenter(franchise, seasonEntry, game));
    for (const center of centers) {
      const { _goal, _scans, ...publicCenter } = center;
      gameCenters[center.event_code] = publicCenter;
      const breakdown = center.price_level_inventory.map((row) => ({
        price_level: row.price_level,
        metrics: summaryMetrics(center, center.kpis.tickets_sold ? row.sold_tickets / center.kpis.tickets_sold : 0)
      }));
      summaryRows.push({
        event_id: `${center.event_code}-evt`,
        event_code: center.event_code,
        event_date: center.event_date,
        season: seasonEntry.season,
        season_type: seasonEntry.season_type,
        dow: dow(center.event_date),
        event_time: seasonEntry.games.find((g) => g.event_code === center.event_code)?.start_time_local ?? '19:30',
        opponent: center.opponent,
        price_level: 'ALL',
        metrics: summaryMetrics(center),
        price_level_breakdown: breakdown
      });
      void _goal;
      void _scans;
    }
    seasonCenters[seasonEntry.season_key] = buildSeasonCenter(franchise, seasonEntry, centers);
  }
  const upcoming = schedules
    .flatMap((s) => s.games.map((g) => ({ season_key: s.season_key, ...g })))
    .filter((g) => g.days_out >= 0)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  return {
    schedules: {
      franchise,
      version: 'demo-synthetic-v1',
      last_updated: `${AS_OF}T13:05:00Z`,
      seasons: schedules.map(({ franchise: _f, ...rest }) => rest),
      next_game: upcoming[0] ? { season_key: upcoming[0].season_key, event_code: upcoming[0].event_code } : undefined
    },
    seasonCenters,
    gameCenters,
    gameSummaryRows: summaryRows
  };
}

const kingsLegacy = buildLegacy('LAK', 'LAK', NHL, [
  { season: '2526', seasonType: 'PRE', start: '2025-09-21', end: '2025-10-03', count: 4 },
  { season: '2526', seasonType: 'REG', start: '2025-10-09', end: '2026-04-14', count: 41 },
  { season: '2627', seasonType: 'PRE', start: '2026-09-20', end: '2026-09-30', count: 4 },
  { season: '2627', seasonType: 'REG', start: '2026-10-08', end: '2027-04-13', count: 41 }
]);
const reignLegacy = buildLegacy('ONT', 'ONT', AHL, [
  { season: '2526', seasonType: 'REG', start: '2025-10-11', end: '2026-04-18', count: 34 },
  { season: '2627', seasonType: 'PRE', start: '2026-09-26', end: '2026-10-03', count: 2 },
  { season: '2627', seasonType: 'REG', start: '2026-10-10', end: '2027-04-17', count: 34 }
]);
write('legacy-lak.json', kingsLegacy);
write('legacy-ont.json', reignLegacy);

/* ------------------------------------------------------------------ */
/* Kings governed Ticket Sales + Payments                             */
/* ------------------------------------------------------------------ */

const kingsSeasonGames = kingsLegacy.schedules.seasons
  .filter((s) => s.season === '2627')
  .flatMap((s) => s.games.map((g) => ({ ...g, season_type: s.season_type })));
const kingsGameRows = kingsSeasonGames.map((g) => {
  const c = kingsLegacy.gameCenters[g.event_code];
  return {
    event_name: `vs ${g.opponent}`,
    event_date: g.event_date,
    season_type: g.season_type,
    net_revenue: c.kpis.revenue,
    net_tickets: c.kpis.tickets_sold,
    paid_tickets: c.kpis.paid_tickets,
    last_week_net_revenue: money(c.kpis.revenue * between(0.012, 0.05)),
    last_week_paid_tickets: whole(c.kpis.paid_tickets * between(0.01, 0.045))
  };
});
const kingsNetRevenueFromGames = kingsGameRows.reduce((s, g) => s + g.net_revenue, 0);
const kingsCategoryShares = { FSE: 0.71, Group: 0.09, Individual: 0.2 };
const kingsAttainment = { FSE: between(0.74, 0.8), Group: between(0.41, 0.5), Individual: between(0.36, 0.45) };
const kingsAvgPrice = { FSE: 74.5, Group: 51.25, Individual: 112.4 };
const kingsCategories = ['FSE', 'Group', 'Individual'].map((name) => {
  const revenue = money(kingsNetRevenueFromGames * kingsCategoryShares[name]);
  const goal = money(Math.round((revenue / kingsAttainment[name]) / 1000) * 1000);
  const netTickets = whole(revenue / kingsAvgPrice[name]);
  return { name, revenue, goal, netTickets, attainment: revenue / goal };
});
const kingsPaid = kingsCategories.reduce((s, c) => s + c.netTickets, 0);
const kingsComp = whole(kingsPaid * 0.047);
const kingsRevenue = money(kingsCategories.reduce((s, c) => s + c.revenue, 0));
const kingsGoal = money(kingsCategories.reduce((s, c) => s + c.goal, 0));
const kingsWeekly = completedWeeks.map((week, index) => {
  const ramp = 0.55 + index * 0.06 + between(-0.05, 0.05);
  const group = money(between(68_000, 96_000) * ramp);
  const singles = money(between(210_000, 280_000) * ramp);
  const fse = money(between(380_000, 520_000) * (1.2 - index * 0.03));
  return {
    week_start: week,
    fse_net_revenue: fse,
    group_net_revenue: group,
    singles_net_revenue: singles,
    active_paid_ticket_net_revenue: money(fse + group + singles),
    paid_ticket_items: whole(fse / kingsAvgPrice.FSE + group / kingsAvgPrice.Group + singles / kingsAvgPrice.Individual),
    purchases: int(1_900, 3_400),
    cancellations: int(70, 190)
  };
});
const kingsLastWeek = kingsWeekly.at(-1);
const kingsSales = {
  franchise: 'LAK',
  season: '2026-27',
  scopeLabel: 'LA Kings · 2026–27 preseason + regular season',
  source: 'demo.shield.kings_ticket_sales_summary_v',
  revenueGoal: kingsGoal,
  attainment: kingsRevenue / kingsGoal,
  revenueGap: money(Math.max(0, kingsGoal - kingsRevenue)),
  netTickets: kingsPaid + kingsComp,
  paidTickets: kingsPaid,
  compTickets: kingsComp,
  netRevenue: kingsRevenue,
  averagePaidPrice: kingsRevenue / kingsPaid,
  categories: kingsCategories,
  lastWeek: {
    start: lastWeekStart,
    end: lastWeekEnd,
    purchases: kingsLastWeek.purchases,
    cancellations: kingsLastWeek.cancellations,
    netRevenue: kingsLastWeek.active_paid_ticket_net_revenue
  },
  topGames: [...kingsGameRows]
    .sort((a, b) => b.net_revenue - a.net_revenue)
    .slice(0, 5)
    .map((g) => ({ name: g.event_name, date: g.event_date, netRevenue: g.net_revenue, netTickets: g.net_tickets }))
};

function paymentLifecycle(totalOrders) {
  const declined = int(Math.round(totalOrders * 0.02), Math.round(totalOrders * 0.035));
  const recovered = int(Math.round(totalOrders * 0.02), Math.round(totalOrders * 0.04));
  const noActivity = int(Math.round(totalOrders * 0.05), Math.round(totalOrders * 0.08));
  const scheduled = int(Math.round(totalOrders * 0.28), Math.round(totalOrders * 0.36));
  const paid = totalOrders - declined - recovered - noActivity - scheduled - int(20, 60);
  return { declined, recovered, noActivity, scheduled, paid };
}
const kingsOrders = int(14_000, 16_500);
const kingsLife = paymentLifecycle(kingsOrders);
const kingsPayments = {
  franchise: 'LAK',
  season: '2627',
  seasonLabel: '2026–27 season',
  sourceStatus: 'live_warehouse_aggregate',
  needsActionOrders: kingsLife.declined,
  declinedAmount: money(kingsLife.declined * between(410, 640)),
  recoveredOrders: kingsLife.recovered,
  noActivityOrders: kingsLife.noActivity,
  paidOrders: kingsLife.paid,
  totalOrders: kingsOrders,
  lifecycle: [
    { status: 'Scheduled', label: 'Scheduled', orders: kingsLife.scheduled },
    { status: 'NoPaymentActivity', label: 'No payment activity', orders: kingsLife.noActivity },
    { status: 'RecoveredAfterDecline', label: 'Recovered after decline', orders: kingsLife.recovered },
    { status: 'Declined', label: 'Declined', orders: kingsLife.declined }
  ]
};
write('kings.json', {
  asOf: AS_OF,
  sales: kingsSales,
  payments: kingsPayments,
  weekly: kingsWeekly,
  games: kingsGameRows
});

/* ------------------------------------------------------------------ */
/* Galaxy Season Summary + SPOM                                       */
/* ------------------------------------------------------------------ */

const galaxyDates = scheduleDates('2026-02-28', '2026-10-31', 17);
const galaxyPool = [...MLS];
const galaxyEvents = galaxyDates.map((date, index) => {
  const opponent = galaxyPool.splice(Math.floor(rand() * galaxyPool.length), 1)[0];
  const played = daysBetween(date, AS_OF) > 0;
  const big = ['Los Angeles FC', 'Inter Miami CF', 'Seattle Sounders FC'].includes(opponent);
  const goal = money(Math.round(between(560_000, 880_000) * (big ? 1.35 : 1) / 100) * 100);
  const attainment = played ? between(0.71, 1.04) * (big ? 1.06 : 1) : between(0.42, 0.7);
  const revenue = money(goal * attainment);
  const tickets = whole(revenue / between(31, 44));
  return {
    eventCode: `GAL26R${String(index + 1).padStart(2, '0')}`,
    opponent,
    eventDate: date,
    revenue,
    goal,
    tickets,
    paidTickets: whole(tickets * between(0.9, 0.95)),
    attainment: revenue / goal,
    gap: money(goal - revenue)
  };
});
const galaxyProducts = [
  ['Full Season', 0.52], ['Partial Plan', 0.11], ['Group', 0.12],
  ['Single Match', 0.21], ['Premium', 0.04]
];
const galaxyRevenue = galaxyEvents.reduce((s, e) => s + e.revenue, 0);
const galaxyByProduct = galaxyProducts.map(([product_category, share]) => ({
  product_category,
  net_revenue: money(galaxyRevenue * share)
}));
galaxyByProduct[galaxyByProduct.length - 1].net_revenue = money(
  galaxyRevenue - galaxyByProduct.slice(0, -1).reduce((s, r) => s + r.net_revenue, 0)
);
const galaxyWeekly = completedWeeks.slice(-8).map((week, index) => ({
  week_start: week,
  active_paid_ticket_net_revenue: money(between(150_000, 260_000) * (1 + 0.04 * Math.sin(index))),
  paid_ticket_items: int(3_600, 6_400)
}));

const REPS = [
  ['casey_demo', 'Casey Demo'], ['jordan_sample', 'Jordan Sample'],
  ['riley_example', 'Riley Example'], ['morgan_placeholder', 'Morgan Placeholder'],
  ['taylor_fixture', 'Taylor Fixture'], ['avery_mock', 'Avery Mock'],
  ['quinn_synthetic', 'Quinn Synthetic'], ['drew_testcase', 'Drew Testcase']
];
const SPOM_CATEGORIES = ['full_season', 'partial_plan', 'mini_plan', 'individual', 'youth_soccer', 'grp', 'rentals', 'license'];
const repStrength = Object.fromEntries(REPS.map(([tag]) => [tag, between(0.55, 1.4)]));
const spomMonths = ['2026-07-01', '2026-08-01', '2026-09-01'].map((month, monthIndex) => {
  const rows = REPS.map(([repTag, repName], repIndex) => {
    const strength = repStrength[repTag] * (1 + 0.08 * monthIndex * (repIndex % 2 ? 1 : -0.5));
    const categories = Object.fromEntries(SPOM_CATEGORIES.map((category) => {
      const base = {
        full_season: 2_400, partial_plan: 900, mini_plan: 520, individual: 380,
        youth_soccer: 260, grp: 1_100, rentals: 300, license: 0
      }[category];
      const value = rand() < (category === 'license' ? 0.15 : 0.82) ? whole(base * strength * between(0.3, 1.6)) : 0;
      return [category, category === 'license' && value ? 1_500 * int(1, 2) : value];
    }));
    // An occasional cancellation reversal keeps the demo honest about negatives.
    if (rand() < 0.12) categories.individual = -int(80, 260);
    const score = Object.values(categories).reduce((s, v) => s + v, 0);
    return {
      repTag,
      repName,
      team: repIndex < 4 ? 'Season Ticket Sales (demo)' : 'Premium & Group Sales (demo)',
      score,
      orders: int(6, 31),
      categories
    };
  }).sort((a, b) => b.score - a.score || a.repName.localeCompare(b.repName));
  return { month, rows };
});
write('galaxy.json', {
  asOf: AS_OF,
  season: {
    season: '26REG',
    source: 'demo.shield.galaxy_season_metrics',
    definitionAsOf: '2026-09-01T00:00:00Z',
    events: galaxyEvents
  },
  byProduct: galaxyByProduct,
  weekly: galaxyWeekly,
  spom: {
    source: 'demo.shield.galaxy_spom_monthly_serving',
    definitionAsOf: '2026-09-01T00:00:00Z',
    defaultMonth: '2026-09-01',
    months: spomMonths
  }
});

/* ------------------------------------------------------------------ */
/* Reign snapshots                                                    */
/* ------------------------------------------------------------------ */

const reignProducts = [
  ['FSE', 0.86, 22.1], ['Group', 0.07, 19.5], ['Individual', 0.045, 38.6], ['Other', 0.002, 12], ['Comp', 0, 0]
];
const reignRevenueTarget = between(2_100_000, 2_600_000);
const reignByProduct = reignProducts.map(([category, share, price]) => {
  const netRevenue = money(reignRevenueTarget * share);
  const items = category === 'Comp' ? int(3_200, 5_400) : whole(netRevenue / price);
  return { category, items, netRevenue };
});
const reignOrders = int(1_600, 2_100);
const reignLife = paymentLifecycle(reignOrders);
write('reign.json', {
  asOf: AS_OF,
  dailySales: {
    franchise: 'ONT',
    season: '2627REG',
    seasonLabel: '2026–27 regular season · season to date',
    asOf: AS_OF,
    sourceStatus: 'verified_warehouse_snapshot',
    netRevenue: money(reignByProduct.reduce((s, r) => s + r.netRevenue, 0)),
    activeItems: reignByProduct.reduce((s, r) => s + r.items, 0),
    canceledItems: int(18_000, 31_000),
    byProduct: reignByProduct,
    disclosures: [
      'Demo: synthetic net item revenue by product category, generated by a seeded script.',
      'Season-to-date view; the single-week executive brief is out of scope for this demo.',
      'No order-level or rep-level detail exists in this demo.'
    ]
  },
  payments: {
    franchise: 'ONT',
    season: '2627REG',
    seasonLabel: '2026–27 regular season',
    asOf: AS_OF,
    sourceStatus: 'verified_warehouse_snapshot',
    needsActionOrders: reignLife.declined,
    declinedAmount: money(reignLife.declined * between(260, 420)),
    recoveredOrders: reignLife.recovered,
    noActivityOrders: reignLife.noActivity,
    paidOrders: reignLife.paid,
    totalOrders: reignOrders,
    lifecycle: [
      { status: 'NoPaymentActivity', label: 'No payment activity', orders: reignLife.noActivity },
      { status: 'RecoveredAfterDecline', label: 'Recovered after decline', orders: reignLife.recovered },
      { status: 'Declined', label: 'Declined', orders: reignLife.declined },
      { status: 'Scheduled', label: 'Scheduled', orders: reignLife.scheduled }
    ],
    disclosures: [
      'Demo: synthetic order counts by payment lifecycle status, generated by a seeded script.',
      'Paid and terminal Cancelled/Voided orders are excluded from the active lifecycle list; Paid is shown as its own figure.',
      'Order-level payment detail is not part of this demo.'
    ]
  }
});

/* ------------------------------------------------------------------ */
/* Kings Marketing daily KPI records                                  */
/* ------------------------------------------------------------------ */

const kpiDays = Array.from({ length: 21 }, (_, i) => iso(asOfMs - (20 - i) * DAY));
let appUsers = int(38_000, 46_000);
let impressions = int(170_000_000, 210_000_000);
let fanGrowth = int(52_000, 64_000);
let ticketRevenue = kingsRevenue * 0.93;
const kpiDaily = kpiDays.map((date) => {
  appUsers += int(60, 260);
  impressions += int(1_200_000, 3_800_000);
  fanGrowth += int(90, 340);
  ticketRevenue += between(90_000, 210_000);
  return {
    date,
    last_updated: `${date}T13:00:00Z`,
    TSR: money(ticketRevenue),
    TSR_Goal_Pacing: ticketRevenue / kingsGoal,
    ATP_avg_season: money(between(88, 94)),
    ATP_Goal_Pacing: between(0.97, 1.03),
    GAS_season_avg: whole(between(16_400, 17_600)),
    GAS_Goal_Pacing: between(0.94, 1.01),
    NFS_Season_To_Date: int(900, 1_500),
    NFS_Goal_Pacing: between(0.7, 0.9),
    TotalFantoDate: int(900_000, 960_000),
    UWU: int(120_000, 160_000),
    APPU: appUsers,
    APPU_Goal_Pacing: appUsers / 60_000,
    app_yoy_user: money(between(4, 14)),
    TSI_Impressions: impressions,
    TSI_Goal_Pacing: impressions / 290_000_000,
    TSI_yoy: money(between(3, 11)),
    FDG_Season_To_Date: fanGrowth,
    FDG_Goal_Pacing: fanGrowth / 90_000,
    fan_growth_yoy: money(between(2, 9)),
    FBI: int(9_000_000, 14_000_000),
    FBE: between(0.012, 0.024),
    IGI: int(38_000_000, 52_000_000),
    IGE: between(0.031, 0.052),
    TWI: int(6_000_000, 10_000_000),
    TWE: between(0.008, 0.016),
    TTI: int(44_000_000, 70_000_000),
    TTE: between(0.045, 0.071),
    YTI: int(3_000_000, 6_000_000),
    YTE: between(0.018, 0.03)
  };
});
write('kpi-daily.json', kpiDaily);

console.log(`Wrote synthetic fixtures to ${OUT} (seed ${SEED}, as of ${AS_OF}).`);
