/** Choose the requested measure, never whichever numeric column happens to arrive first. */
export function rankingMetric(columns: string[], question: string): number {
  const intent = /attainment|percentage|percent|\bpct\b|below.*goal/i.test(
    question
  )
    ? /attainment|percent|pct/i
    : /\bgap\b|remaining.*goal/i.test(question)
      ? /gap|remaining/i
      : /revenue/i.test(question)
        ? /^(net_revenue|total_net_revenue|revenue|active_paid_ticket_net_revenue)$/i
        : /\btickets?\b/i.test(question)
          ? /^(paid_ticket_items|ticket_count|tickets)$/i
          : /\bspom\b|\bscore\b/i.test(question)
            ? /^(spom_score|score)$/i
            : null;
  if (!intent) return -1;
  const matches = columns
    .map((name, index) => ({ name, index }))
    .filter((c) => intent.test(c.name));
  return matches.length === 1 ? matches[0].index : -1;
}

/** Resolve known ambiguous product wording before an AI query. This is not a data-access policy. */
export function seasonClarification(question: string): string | null {
  if (
    /\b(best|strongest|performance|pace)\b/i.test(question) &&
    !/\b(revenue|attainment|ticket count|tickets sold|goal gap)\b/i.test(
      question
    )
  ) {
    return 'Which measure do you mean: net revenue, revenue goal attainment, ticket count, or gap to goal? Goal attainment does not measure temporal pace.';
  }
  return null;
}

/** Known missing semantics, not a security boundary or a substitute for source curation. */
export function seasonUnavailableMeasure(
  question: string,
  paidSalesSupported = false
): string | null {
  if (
    /\bpaid\b.*\b(tickets?|seats?)\b|\b(tickets?|seats?)\b.*\bpaid\b/i.test(
      question
    )
  ) {
    if (
      paidSalesSupported &&
      /\b(fully|collected|collection|payment)\b/i.test(question)
    )
      return 'Paid-ticket items in this report means active non-comp tickets, not payments fully collected. Collection status is unavailable here; I will not substitute non-comp ticket counts for fully paid tickets.';
    if (!paidSalesSupported)
      return 'Paid-ticket counts are not yet defined for this report. Net tickets, non-comp tickets, and tickets with positive revenue give different results; none will be substituted for paid tickets. The accepted report currently supports net ticket counts, net revenue, and revenue goals.';
  }
  if (
    /\b(revenue|sales|tickets?|trend)\b/i.test(question) &&
    /\b(weekly|daily)\b|\b(?:by|per|over|across)\s+(?:the\s+)?(?:weeks?|days?)\b|\b(?:last|past|previous)\s+(?:(?:\d+|eight|six)\s+)?(?:completed\s+)?(?:weeks?|days?)\b|\b(?:week|day)[ -]over[ -](?:week|day)\b/i.test(
      question
    )
  ) {
    if (paidSalesSupported && !/\b(daily|days?|day.over.day)\b/i.test(question))
      return null;
    if (paidSalesSupported)
      return 'Daily sales trends are not enabled in this report. The accepted time-series measure covers completed Monday–Sunday weeks of currently active non-comp ticket-item net revenue.';
    return 'Sales-date daily or weekly revenue and ticket trends are not available in the accepted report sources. I cannot produce the last eight completed weeks or substitute match dates, monthly totals, or a pacing forecast. Event-level net revenue and goal attainment are available.';
  }
  return null;
}

/** Only a complete, contiguous Monday-start series from the declared sales measure. */
export function lastEightCompletedWeeks(now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(now));
  const part = (name: string) =>
    Number(parts.find((p) => p.type === name)?.value);
  const today = new Date(
    Date.UTC(part('year'), part('month') - 1, part('day'))
  );
  const monday = today.getTime() - ((today.getUTCDay() + 6) % 7) * 86400000;
  return {
    start: new Date(monday - 56 * 86400000).toISOString().slice(0, 10),
    end: new Date(monday).toISOString().slice(0, 10)
  };
}

export function weeklySalesSeries(
  columns: string[],
  rows: (string | number | null)[][],
  question: string,
  truncated: boolean,
  now = Date.now()
): { metric: string; points: { date: string; value: number }[] } | null {
  const dateIndex = columns.indexOf('week_start');
  const metricIndex = rankingMetric(columns, question);
  if (
    truncated ||
    rows.length < 6 ||
    rows.length > 25 ||
    dateIndex < 0 ||
    columns.filter((column) => column === 'week_start').length !== 1 ||
    metricIndex < 0 ||
    !['active_paid_ticket_net_revenue', 'paid_ticket_items'].includes(
      columns[metricIndex]
    )
  )
    return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(now));
  const part = (name: string) =>
    Number(parts.find((p) => p.type === name)?.value);
  const today = Date.UTC(part('year'), part('month') - 1, part('day'));
  const points: { date: string; value: number }[] = [];
  for (const row of rows) {
    const date = row[dateIndex];
    const value = row[metricIndex];
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      value === null ||
      value === '' ||
      !Number.isFinite(Number(value))
    )
      return null;
    const parsed = new Date(date + 'T00:00:00Z');
    if (
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date ||
      parsed.getUTCDay() !== 1
    )
      return null;
    if (parsed.getTime() + 7 * 86400000 > today) return null;
    points.push({ date, value: Number(value) });
  }
  points.sort((a, b) => a.date.localeCompare(b.date));
  if (
    points.some(
      (p, i) =>
        i > 0 &&
        Date.parse(p.date) - Date.parse(points[i - 1].date) !== 7 * 86400000
    )
  )
    return null;
  return { metric: columns[metricIndex], points };
}
