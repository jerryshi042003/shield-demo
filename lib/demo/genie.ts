import 'server-only';
import { DEMO_TERMS, findDemoTerm, type DemoTerm } from '@/lib/demo/terms';
/**
 * Scripted stand-in for Databricks Genie in the public demo.
 *
 * Production Shield sent each question to a governed Genie space and returned
 * the generated SQL plus its result. Here a small set of example questions is
 * matched to canned SQL, and the answer rows are computed from the synthetic
 * fixtures at request time. Nothing is sent to a model or a warehouse.
 */
import {
  DEMO_SOURCE_LABEL,
  SPOM_MONTHS,
  demoGalaxyByProduct,
  demoGalaxyEvents,
  demoGalaxyWeekly,
  demoKingsGames,
  demoKingsSales,
  demoKingsWeekly,
  demoSpomRows
} from '@/lib/demo/data';
import { DEMO_TODAY } from '@/lib/demo/viewer';
import { SPOM_CATEGORIES } from '@/lib/types/galaxy-spom';
import { ReportUnavailable } from '@/lib/server/databricks';

export type DemoGenieReport = 'kings-sales' | 'galaxy-season' | 'galaxy-spom';
type Cell = string | number | null;
type QueryResult = {
  sql: string;
  description: string;
  columns: string[];
  rows: Cell[][];
  rowCount: number;
  truncated: boolean;
};
type Scripted = { answer: string; results: QueryResult[] };
type Match = { id: string; params?: Record<string, string> };

export const DEMO_GENIE_LABEL = 'Demo: scripted answers';

const SCOPES: Record<DemoGenieReport, string> = {
  'kings-sales': 'LA Kings · 2026–27 preseason + regular season (demo)',
  'galaxy-season': 'LA Galaxy · 2026 regular season (demo)',
  'galaxy-spom': 'LA Galaxy · SPOM manager view (demo)'
};

const usd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1_000_000 ? 2 : Math.abs(value) >= 100_000 ? 1 : 0
  }).format(value);
const pct = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;
const count = (value: number) => value.toLocaleString('en-US');
const round2 = (value: number) => Math.round(value * 100) / 100;
const round1 = (value: number) => Math.round(value * 10) / 10;
const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
const monthName = (month: string) =>
  new Date(`${month.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });

function result(sql: string, description: string, columns: string[], rows: Cell[][]): QueryResult {
  return { sql: sql.trim(), description, columns, rows, rowCount: rows.length, truncated: false };
}

/* ------------------------------------------------------------------ */
/* Kings Ticket Sales                                                  */
/* ------------------------------------------------------------------ */

const KINGS_SRC = 'demo.shield.kings_ticket_sales';

function matchKings(q: string): Match | null {
  const weekly = /week by week|weekly|building|trend|over the last/.test(q);
  const lastWeek = /last (completed )?week|this week|past week/.test(q);
  if (weekly && !/games?/.test(q)) return { id: 'kings_weekly' };
  if (/games?/.test(q) && lastWeek) return { id: 'kings_games_last_week' };
  if (/games?|events?/.test(q) && /top|most|best|highest|rank/.test(q)) return { id: 'kings_top_games' };
  if (lastWeek && /product|category|categories/.test(q)) return { id: 'kings_last_week_product' };
  if (lastWeek || /what changed/.test(q)) return { id: 'kings_last_week' };
  if (/\b(paid|comp|tickets?)\b/.test(q)) return { id: 'kings_tickets' };
  if (/behind|below|furthest|lagging|worst|attainment/.test(q)) return { id: 'kings_behind_goal' };
  if (/total|season|goal|revenue|pacing/.test(q)) return { id: 'kings_season_total' };
  return null;
}

function answerKings(match: Match): Scripted {
  const sales = demoKingsSales();
  const weekly = demoKingsWeekly();
  const games = demoKingsGames();
  const last = weekly[weekly.length - 1];
  const prior = weekly[weekly.length - 2];
  switch (match.id) {
    case 'kings_last_week': {
      const change = last.active_paid_ticket_net_revenue - prior.active_paid_ticket_net_revenue;
      return {
        answer: `In the last completed week (${shortDate(sales.lastWeek.start)}–${shortDate(sales.lastWeek.end)}) the Kings booked ${usd(last.active_paid_ticket_net_revenue)} in net ticket revenue from ${count(last.purchases)} purchases and ${count(last.cancellations)} cancellations. That is ${change >= 0 ? 'up' : 'down'} ${usd(Math.abs(change))} versus the prior week (${usd(prior.active_paid_ticket_net_revenue)}).`,
        results: [
          result(
            `SELECT week_start, active_paid_ticket_net_revenue AS net_revenue,
       LAG(active_paid_ticket_net_revenue) OVER (ORDER BY week_start) AS prior_week_net_revenue,
       purchases AS purchase_count, cancellations AS cancellation_count
FROM ${KINGS_SRC}_weekly_v
QUALIFY week_start = MAX(week_start) OVER ()`,
            'Last completed Monday–Sunday sales week versus the week before.',
            ['net_revenue', 'prior_week_net_revenue', 'purchase_count', 'cancellation_count'],
            [[last.active_paid_ticket_net_revenue, prior.active_paid_ticket_net_revenue, last.purchases, last.cancellations]]
          )
        ]
      };
    }
    case 'kings_last_week_product': {
      const rows: Cell[][] = [
        ['FSE', last.fse_net_revenue],
        ['Singles', last.singles_net_revenue],
        ['Group', last.group_net_revenue]
      ];
      return {
        answer: `Last completed week by product: FSE ${usd(last.fse_net_revenue)}, singles ${usd(last.singles_net_revenue)}, and groups ${usd(last.group_net_revenue)} — ${usd(last.active_paid_ticket_net_revenue)} in total.`,
        results: [
          result(
            `SELECT product_category, ROUND(SUM(net_revenue), 2) AS net_revenue
FROM ${KINGS_SRC}_weekly_product_v
WHERE week_start = (SELECT MAX(week_start) FROM ${KINGS_SRC}_weekly_v)
GROUP BY product_category
ORDER BY net_revenue DESC`,
            'Net ticket revenue by product for the last completed week.',
            ['product_category', 'net_revenue'],
            rows
          )
        ]
      };
    }
    case 'kings_weekly': {
      const recent = weekly.slice(-8);
      const rows: Cell[][] = recent.map((w) => [w.week_start, w.group_net_revenue, w.singles_net_revenue]);
      const first = recent[0];
      return {
        answer: `Over the last eight completed weeks, group revenue moved from ${usd(first.group_net_revenue)} to ${usd(last.group_net_revenue)} per week and singles from ${usd(first.singles_net_revenue)} to ${usd(last.singles_net_revenue)}. Both are building into the home opener.`,
        results: [
          result(
            `SELECT week_start,
       SUM(CASE WHEN product_category = 'Group' THEN net_revenue END) AS group_net_revenue,
       SUM(CASE WHEN product_category = 'Individual' THEN net_revenue END) AS singles_net_revenue
FROM ${KINGS_SRC}_weekly_product_v
WHERE week_start >= DATE_SUB(DATE_TRUNC('WEEK', CURRENT_DATE()), 56)
  AND week_start < DATE_TRUNC('WEEK', CURRENT_DATE())
GROUP BY week_start
ORDER BY week_start`,
            'Weekly group and singles net revenue, last eight completed weeks.',
            ['week_start', 'group_net_revenue', 'singles_net_revenue'],
            rows
          )
        ]
      };
    }
    case 'kings_games_last_week': {
      const top = [...games].sort((a, b) => b.last_week_net_revenue - a.last_week_net_revenue).slice(0, 5);
      return {
        answer: `${top[0].event_name} (${shortDate(top[0].event_date)}) sold the most last completed week at ${usd(top[0].last_week_net_revenue)}, followed by ${top[1].event_name} at ${usd(top[1].last_week_net_revenue)}.`,
        results: [
          result(
            `SELECT event_name, event_date, ROUND(SUM(net_revenue), 2) AS net_revenue
FROM ${KINGS_SRC}_game_weekly_v
WHERE week_start = (SELECT MAX(week_start) FROM ${KINGS_SRC}_weekly_v)
GROUP BY event_name, event_date
ORDER BY net_revenue DESC
LIMIT 5`,
            'Games ranked by net ticket revenue booked in the last completed week.',
            ['event_name', 'event_date', 'net_revenue'],
            top.map((g) => [g.event_name, g.event_date, g.last_week_net_revenue])
          )
        ]
      };
    }
    case 'kings_top_games': {
      const top = [...games].sort((a, b) => b.net_revenue - a.net_revenue).slice(0, 5);
      return {
        answer: `The top game by net ticket revenue this season is ${top[0].event_name} on ${shortDate(top[0].event_date)} with ${usd(top[0].net_revenue)} and ${count(top[0].net_tickets)} net tickets.`,
        results: [
          result(
            `SELECT event_name, event_date, net_revenue, net_tickets
FROM ${KINGS_SRC}_game_v
ORDER BY net_revenue DESC, event_date
LIMIT 5`,
            'Top five games by net ticket revenue, 2026–27 season to date.',
            ['event_name', 'event_date', 'net_revenue', 'net_tickets'],
            top.map((g) => [g.event_name, g.event_date, g.net_revenue, g.net_tickets])
          )
        ]
      };
    }
    case 'kings_tickets':
      return {
        answer: `The Kings have ${count(sales.netTickets)} net tickets: ${count(sales.paidTickets)} paid and ${count(sales.compTickets)} comp.`,
        results: [
          result(
            `SELECT SUM(CASE WHEN product_category <> 'Comp' THEN net_tickets ELSE 0 END) AS paid_tickets,
       SUM(CASE WHEN product_category = 'Comp' THEN net_tickets ELSE 0 END) AS comp_tickets,
       SUM(net_tickets) AS net_tickets
FROM ${KINGS_SRC}_summary_v`,
            'Paid, comp and total net tickets, season to date.',
            ['paid_tickets', 'comp_tickets', 'net_tickets'],
            [[sales.paidTickets, sales.compTickets, sales.netTickets]]
          )
        ]
      };
    case 'kings_behind_goal': {
      const rows = [...sales.categories].sort((a, b) => a.attainment - b.attainment);
      const worst = rows[0];
      const label = (name: string) => (name === 'Individual' ? 'Singles' : name);
      return {
        answer: `${label(worst.name)} is furthest below its season goal at ${pct(worst.attainment)} (${usd(worst.revenue)} of ${usd(worst.goal)}, ${usd(worst.goal - worst.revenue)} remaining).`,
        results: [
          result(
            `SELECT product_category, ROUND(SUM(net_revenue), 2) AS net_revenue,
       ROUND(SUM(revenue_goal), 2) AS revenue_goal,
       ROUND(100 * SUM(net_revenue) / SUM(revenue_goal), 1) AS goal_attainment_pct
FROM ${KINGS_SRC}_summary_v
WHERE product_category IN ('FSE', 'Group', 'Individual')
GROUP BY product_category
ORDER BY goal_attainment_pct`,
            'Season revenue to goal by product, lowest attainment first.',
            ['product_category', 'net_revenue', 'revenue_goal', 'goal_attainment_pct'],
            rows.map((c) => [label(c.name), c.revenue, c.goal, round1(c.attainment * 100)])
          )
        ]
      };
    }
    default:
      return {
        answer: `Season to date the Kings have ${usd(sales.netRevenue)} of a ${usd(sales.revenueGoal)} revenue goal (${pct(sales.attainment)}), with ${usd(sales.revenueGap)} remaining.`,
        results: [
          result(
            `SELECT ROUND(SUM(net_revenue), 2) AS total_net_revenue,
       ROUND(SUM(revenue_goal), 2) AS total_revenue_goal
FROM ${KINGS_SRC}_summary_v`,
            'Season net revenue against goal.',
            ['total_net_revenue', 'total_revenue_goal'],
            [[sales.netRevenue, sales.revenueGoal]]
          )
        ]
      };
  }
}

/* ------------------------------------------------------------------ */
/* Galaxy Season Summary                                               */
/* ------------------------------------------------------------------ */

const GALAXY_SRC = 'demo.shield.galaxy_season_metrics';

function matchGalaxy(q: string): Match | null {
  if (/dana|pacing|forecast|pace/.test(q)) return { id: 'galaxy_pacing' };
  if (/week/.test(q)) return { id: 'galaxy_weekly' };
  if (/product|category|categories|break ?down/.test(q)) return { id: 'galaxy_by_product' };
  if (/next|upcoming/.test(q)) return { id: 'galaxy_next' };
  if (/paid tickets?|fewest|least/.test(q)) return { id: 'galaxy_fewest_paid' };
  if (/lowest|furthest|below|behind|worst|attainment/.test(q)) return { id: 'galaxy_lowest' };
  if (/total|season|goal|revenue/.test(q)) return { id: 'galaxy_total' };
  return null;
}

function answerGalaxy(match: Match): Scripted {
  const events = demoGalaxyEvents();
  switch (match.id) {
    case 'galaxy_pacing': {
      const booked = round2(events.reduce((sum, event) => sum + event.revenue, 0));
      const goal = round2(events.reduce((sum, event) => sum + event.goal, 0));
      const forecast = round2(goal * 0.96);
      return {
        answer: `Dana’s pacing uses FAKE demo data: ${usd(booked)} booked, an illustrative ${usd(forecast)} season forecast against a ${usd(goal)} goal (${usd(goal - forecast)} forecast gap). This is a scripted scenario, not a live forecast.`,
        results: [result(
          `SELECT SUM(revenue) AS net_revenue, SUM(goal) * 0.96 AS demo_forecast, SUM(goal) AS revenue_goal FROM demo.shield.galaxy_season_metrics WHERE season = '26REG'`,
          'Synthetic season pacing. Forecast is an illustrative 96% of the fake season goal.',
          ['net_revenue', 'demo_forecast', 'revenue_goal'], [[booked, forecast, goal]]
        )]
      };
    }
    case 'galaxy_total': {
      const revenue = round2(events.reduce((s, e) => s + e.revenue, 0));
      const goal = round2(events.reduce((s, e) => s + e.goal, 0));
      return {
        answer: `Galaxy 2026 regular-season net revenue is ${usd(revenue)} against a ${usd(goal)} goal — ${pct(revenue / goal)} achieved across ${events.length} home matches.`,
        results: [
          result(
            `SELECT ROUND(MEASURE(net_revenue), 2) AS total_season_net_revenue,
       MEASURE(revenue_goal) AS total_season_revenue_goal
FROM ${GALAXY_SRC}
WHERE season = '26REG'`,
            'Season net revenue and revenue goal.',
            ['total_season_net_revenue', 'total_season_revenue_goal'],
            [[revenue, goal]]
          )
        ]
      };
    }
    case 'galaxy_by_product': {
      const rows = [...demoGalaxyByProduct()].sort((a, b) => b.net_revenue - a.net_revenue);
      return {
        answer: `${rows[0].product_category} leads Galaxy 2026 net revenue at ${usd(rows[0].net_revenue)}, followed by ${rows[1].product_category} (${usd(rows[1].net_revenue)}) and ${rows[2].product_category} (${usd(rows[2].net_revenue)}).`,
        results: [
          result(
            `SELECT product_category, ROUND(MEASURE(net_revenue), 2) AS net_revenue
FROM ${GALAXY_SRC}
WHERE season = '26REG'
GROUP BY product_category
ORDER BY net_revenue DESC`,
            'Season net revenue by product category.',
            ['product_category', 'net_revenue'],
            rows.map((r) => [r.product_category, r.net_revenue])
          )
        ]
      };
    }
    case 'galaxy_lowest': {
      const rows = [...events].sort((a, b) => a.attainment - b.attainment).slice(0, 5);
      return {
        answer: `The five 2026 home matches furthest below goal start with ${rows[0].opponent} (${shortDate(rows[0].eventDate)}) at ${pct(rows[0].attainment)} of goal. Upcoming matches are still selling, so their attainment is expected to rise.`,
        results: [
          result(
            `SELECT opponent, event_date, ROUND(MEASURE(net_revenue), 2) AS net_revenue,
       MEASURE(revenue_goal) AS revenue_goal,
       ROUND(100 * MEASURE(net_revenue) / MEASURE(revenue_goal), 1) AS goal_attainment_pct
FROM ${GALAXY_SRC}
WHERE season = '26REG'
GROUP BY ALL
ORDER BY goal_attainment_pct
LIMIT 5`,
            'Five matches with the lowest revenue goal attainment.',
            ['opponent', 'event_date', 'net_revenue', 'revenue_goal', 'goal_attainment_pct'],
            rows.map((e) => [e.opponent, e.eventDate, e.revenue, e.goal, round1(e.attainment * 100)])
          )
        ]
      };
    }
    case 'galaxy_next': {
      const rows = events.filter((e) => e.eventDate >= DEMO_TODAY).slice(0, 3);
      return {
        answer: rows.length
          ? `The next ${rows.length === 1 ? 'home match is' : `${rows.length} home matches are`} ${rows.map((e) => `${e.opponent} on ${shortDate(e.eventDate)} (${usd(e.revenue)}, ${count(e.tickets)} net tickets, ${pct(e.attainment)} of goal)`).join('; ')}.`
          : 'There are no remaining home matches in the 2026 regular season.',
        results: [
          result(
            `SELECT opponent, event_date, ROUND(MEASURE(net_revenue), 2) AS net_revenue,
       MEASURE(ticket_count) AS ticket_count,
       ROUND(100 * MEASURE(net_revenue) / MEASURE(revenue_goal), 1) AS goal_attainment_pct
FROM ${GALAXY_SRC}
WHERE season = '26REG' AND event_date >= CURRENT_DATE()
GROUP BY ALL
ORDER BY event_date
LIMIT 3`,
            'Next home matches with revenue, tickets and goal attainment.',
            ['opponent', 'event_date', 'net_revenue', 'ticket_count', 'goal_attainment_pct'],
            rows.map((e) => [e.opponent, e.eventDate, e.revenue, e.tickets, round1(e.attainment * 100)])
          )
        ]
      };
    }
    case 'galaxy_fewest_paid': {
      const rows = events
        .filter((e) => e.eventDate >= DEMO_TODAY)
        .sort((a, b) => a.paidTickets - b.paidTickets);
      return {
        answer: rows.length
          ? `Of the remaining home matches, ${rows[0].opponent} (${shortDate(rows[0].eventDate)}) has the fewest paid tickets so far: ${count(rows[0].paidTickets)}. Paid tickets here means active non-comp ticket items, not fully collected payments.`
          : 'There are no remaining home matches in the 2026 regular season.',
        results: [
          result(
            `SELECT opponent, event_date, SUM(paid_ticket_items) AS paid_ticket_items
FROM demo.shield.galaxy_event_tickets_v
WHERE season = '26REG' AND event_date >= CURRENT_DATE()
GROUP BY opponent, event_date
ORDER BY paid_ticket_items`,
            'Remaining home matches by paid (non-comp) ticket items.',
            ['opponent', 'event_date', 'paid_ticket_items'],
            rows.map((e) => [e.opponent, e.eventDate, e.paidTickets])
          )
        ]
      };
    }
    default: {
      const weeks = demoGalaxyWeekly();
      const first = weeks[0];
      const last = weeks[weeks.length - 1];
      const change = last.active_paid_ticket_net_revenue - first.active_paid_ticket_net_revenue;
      return {
        answer: `Weekly net ticket revenue went from ${usd(first.active_paid_ticket_net_revenue)} in the week of ${shortDate(first.week_start)} to ${usd(last.active_paid_ticket_net_revenue)} in the week of ${shortDate(last.week_start)} (${change >= 0 ? '+' : '−'}${usd(Math.abs(change))}).`,
        results: [
          result(
            `SELECT DATE_TRUNC('WEEK', sale_date) AS week_start,
       ROUND(SUM(net_revenue), 2) AS active_paid_ticket_net_revenue
FROM demo.shield.galaxy_ticket_sales_daily_v
WHERE is_comp = false
  AND sale_date >= DATE_SUB(DATE_TRUNC('WEEK', CURRENT_DATE()), 56)
  AND sale_date < DATE_TRUNC('WEEK', CURRENT_DATE())
GROUP BY 1
ORDER BY 1`,
            'Net ticket revenue for the last eight completed Monday–Sunday weeks.',
            ['week_start', 'active_paid_ticket_net_revenue'],
            weeks.map((w) => [w.week_start, w.active_paid_ticket_net_revenue])
          )
        ]
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Galaxy SPOM                                                         */
/* ------------------------------------------------------------------ */

const SPOM_SRC = 'demo.shield.galaxy_spom_monthly_serving';

function matchSpom(q: string, month: string): Match | null {
  const rows = demoSpomRows(month) ?? [];
  const rep = rows.find((row) => q.includes(row.repName.toLowerCase()));
  const params: Record<string, string> = rep ? { repTag: rep.repTag } : {};
  if (/change|vs\.?|versus|compare|from july/.test(q)) return { id: rep ? 'spom_rep_change' : 'spom_team_change', params };
  if (/categor|mix|amounts/.test(q)) return { id: rep ? 'spom_rep_mix' : 'spom_team_mix', params };
  if (/rank|top|leader|best/.test(q)) return { id: 'spom_rank', params };
  if (/score|orders?|total|spom/.test(q)) return { id: rep ? 'spom_rep_score' : 'spom_team_score', params };
  return null;
}

function answerSpom(match: Match, month: string): Scripted {
  const rows = demoSpomRows(month);
  if (!rows) throw new ReportUnavailable('month_unavailable');
  const label = monthName(month);
  const rep = rows.find((row) => row.repTag === match.params?.repTag);
  const categorySql = SPOM_CATEGORIES.join(', ');
  switch (match.id) {
    case 'spom_team_score': {
      const score = rows.reduce((s, r) => s + r.score, 0);
      const orders = rows.reduce((s, r) => s + r.orders, 0);
      return {
        answer: `Your demo team's ${label} SPOM score is ${usd(score)} across ${count(orders)} orders from ${rows.length} representatives.`,
        results: [
          result(
            `SELECT SUM(spom_score) AS spom_score, SUM(order_count) AS order_count
FROM ${SPOM_SRC}
WHERE payment_month = '${month}'`,
            'Team SPOM score and order count for the payment month.',
            ['spom_score', 'order_count'],
            [[score, orders]]
          )
        ]
      };
    }
    case 'spom_rank':
      return {
        answer: `${rows[0].repName} leads ${label} with a SPOM score of ${usd(rows[0].score)}, ahead of ${rows[1].repName} (${usd(rows[1].score)}) and ${rows[2].repName} (${usd(rows[2].score)}).`,
        results: [
          result(
            `SELECT rep_name, spom_score, order_count
FROM ${SPOM_SRC}
WHERE payment_month = '${month}'
ORDER BY spom_score DESC, rep_name`,
            'Representatives ranked by SPOM score.',
            ['rep_name', 'spom_score', 'order_count'],
            rows.map((r) => [r.repName, r.score, r.orders])
          )
        ]
      };
    case 'spom_team_mix':
      return {
        answer: `Here are the eight SPOM category amounts for each demo representative in ${label}. Full season and group sales drive most scores.`,
        results: [
          result(
            `SELECT rep_name, ${categorySql}
FROM ${SPOM_SRC}
WHERE payment_month = '${month}'
ORDER BY spom_score DESC, rep_name`,
            'SPOM category amounts by representative.',
            ['rep_name', ...SPOM_CATEGORIES],
            rows.map((r) => [r.repName, ...SPOM_CATEGORIES.map((c) => r.categories[c])])
          )
        ]
      };
    case 'spom_team_change':
    case 'spom_rep_change': {
      const july = demoSpomRows(SPOM_MONTHS[0]) ?? [];
      const august = demoSpomRows(SPOM_MONTHS[1]) ?? [];
      const scoped = rep ? [rep] : august;
      const changes = scoped
        .map((row) => {
          const before = july.find((r) => r.repTag === row.repTag);
          const after = august.find((r) => r.repTag === row.repTag);
          return before && after
            ? { repName: row.repName, before: before.score, after: after.score, change: after.score - before.score }
            : null;
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .sort((a, b) => b.change - a.change);
      const lead = changes[0];
      return {
        answer: rep && lead
          ? `${lead.repName}'s SPOM score moved from ${usd(lead.before)} in July to ${usd(lead.after)} in August 2026 (${lead.change >= 0 ? '+' : '−'}${usd(Math.abs(lead.change))}).`
          : lead
            ? `All ${changes.length} demo representatives have both months. ${lead.repName} gained the most from July to August 2026 (${lead.change >= 0 ? '+' : '−'}${usd(Math.abs(lead.change))}).`
            : 'No representative has records in both months.',
        results: [
          result(
            `SELECT rep_name,
       MAX(CASE WHEN payment_month = '2026-07-01' THEN spom_score END) AS july_spom_score,
       MAX(CASE WHEN payment_month = '2026-08-01' THEN spom_score END) AS august_spom_score,
       august_spom_score - july_spom_score AS score_change
FROM ${SPOM_SRC}
WHERE payment_month IN ('2026-07-01', '2026-08-01')${rep ? `\n  AND rep_tag = '${rep.repTag}'` : ''}
GROUP BY rep_name
HAVING COUNT(DISTINCT payment_month) = 2
ORDER BY score_change DESC`,
            'July to August 2026 SPOM score change for representatives present in both months.',
            ['rep_name', 'july_spom_score', 'august_spom_score', 'score_change'],
            changes.map((c) => [c.repName, c.before, c.after, c.change])
          )
        ]
      };
    }
    case 'spom_rep_mix': {
      const target = rep ?? rows[0];
      return {
        answer: `${target.repName}'s ${label} SPOM categories total ${usd(target.score)}: ${SPOM_CATEGORIES.filter((c) => target.categories[c] !== 0)
          .map((c) => `${c.replaceAll('_', ' ')} ${usd(target.categories[c])}`)
          .join(', ')}.`,
        results: [
          result(
            `SELECT rep_name, ${categorySql}
FROM ${SPOM_SRC}
WHERE payment_month = '${month}' AND rep_tag = '${target.repTag}'`,
            'SPOM category amounts for one representative.',
            ['rep_name', ...SPOM_CATEGORIES],
            [[target.repName, ...SPOM_CATEGORIES.map((c) => target.categories[c])]]
          )
        ]
      };
    }
    default: {
      const target = rep ?? rows[0];
      return {
        answer: `${target.repName}'s ${label} SPOM score is ${usd(target.score)} across ${count(target.orders)} orders.`,
        results: [
          result(
            `SELECT spom_score, order_count
FROM ${SPOM_SRC}
WHERE payment_month = '${month}' AND rep_tag = '${target.repTag}'`,
            'SPOM score and order count for one representative.',
            ['spom_score', 'order_count'],
            [[target.score, target.orders]]
          )
        ]
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Conversation protocol (same shape as the production Ask routes)     */
/* ------------------------------------------------------------------ */

type Ticket = { r: DemoGenieReport; id: string; p?: Record<string, string>; m?: string; t: number };

const OUT_OF_SCRIPT =
  'Demo: scripted answers only. This public demo answers a fixed set of example questions from synthetic data — pick one of the suggested questions above.';

function match(report: DemoGenieReport, question: string, month: string): Match | null {
  const q = question.toLowerCase();
  if (/\b(customer|email|phone|address|account|crm|password|ssn)\b/.test(q)) return null;
  const term = findDemoTerm(question);
  if (term) return { id: 'demo_term', params: { term } };
  if (report === 'kings-sales') return matchKings(q);
  if (report === 'galaxy-season') return matchGalaxy(q);
  return matchSpom(q, month);
}

const metadata = (report: DemoGenieReport) => ({
  scope: SCOPES[report],
  source: DEMO_SOURCE_LABEL,
  sources: [DEMO_SOURCE_LABEL],
  demoLabel: DEMO_GENIE_LABEL
});

export function demoGenieStatus() {
  return { configured: true, demo: true, label: DEMO_GENIE_LABEL };
}

export function startDemoQuestion(report: DemoGenieReport, question: string, month = '') {
  const requestId = `demo-${Date.now().toString(36)}`;
  const found = match(report, question, month);
  if (!found) {
    return {
      ...metadata(report),
      requestId,
      done: true,
      status: 'BOUNDED',
      answer: OUT_OF_SCRIPT,
      results: [],
      queriedAt: new Date().toISOString()
    };
  }
  const ticket: Ticket = { r: report, id: found.id, p: found.params, m: month, t: Date.now() };
  return {
    requestId,
    ...readDemoQuestion(report, Buffer.from(JSON.stringify(ticket)).toString('base64url'), month)
  };
}

export function readDemoQuestion(report: DemoGenieReport, value: string, month = '') {
  let ticket: Ticket;
  try {
    ticket = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Ticket;
  } catch {
    throw new ReportUnavailable('conversation_not_owned');
  }
  if (!ticket || ticket.r !== report || typeof ticket.id !== 'string')
    throw new ReportUnavailable('conversation_not_owned');
  const term = ticket.id === 'demo_term' && ticket.p?.term;
  if (ticket.id === 'demo_term' && (!term || !Object.hasOwn(DEMO_TERMS, term)))
    throw new ReportUnavailable('conversation_not_owned');
  const scripted: Scripted = term
    ? { answer: `${DEMO_TERMS[term as DemoTerm].label}. ${DEMO_TERMS[term as DemoTerm].definition}`, results: [] }
    : report === 'kings-sales'
      ? answerKings({ id: ticket.id })
      : report === 'galaxy-season'
        ? answerGalaxy({ id: ticket.id })
        : answerSpom({ id: ticket.id, params: ticket.p }, ticket.m || month);
  return {
    ...metadata(report),
    done: true,
    status: 'COMPLETED',
    answer: scripted.answer,
    results: scripted.results,
    queriedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString()
  };
}
