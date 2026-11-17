'use client';

import { DEMO_TERMS } from '@/lib/demo/terms';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import {
  rankingMetric,
  weeklySalesSeries
} from '@/lib/reports/answer-presentation';
import {
  formatAnswerPercent,
  formatCompactUsd,
  formatPercent
} from '@/lib/format/report-values';

const metricLabel = (column: string) =>
  ({
    total_net_revenue: 'Net revenue',
    total_season_net_revenue: 'Season net revenue',
    net_revenue: 'Net revenue',
    total_revenue_goal: 'Revenue goal',
    total_season_revenue_goal: 'Season revenue goal',
    revenue_goal: 'Revenue goal',
    goal_attainment_pct: 'Goal attainment',
    active_paid_ticket_net_revenue: 'Active paid-ticket net revenue',
    paid_ticket_items: 'Paid tickets',
    spom_score: 'SPOM score',
    order_count: 'Orders'
  })[column] ?? column.replaceAll('_', ' ');
const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
const displayLabel = (value: string | number | null) =>
  String(value ?? 'Unknown')
    .replace(/^\d{2}\/\d{2}\/\d{4}\s*-\s*/, '')
    .replace(/^LA Galaxy\s+/i, '');
function answerValue(column: string, value: string | number | null) {
  if (value === null) return '—';
  if (value === '' || !Number.isFinite(Number(value))) return String(value);
  if (/percent|pct/i.test(column)) return `${Number(value).toFixed(1)}%`;
  if (/attainment/i.test(column)) return formatAnswerPercent(Number(value));
  if (
    /revenue|goal|gap|score|full_season|partial_plan|mini_plan|individual|youth_soccer|grp|rentals|license/i.test(
      column
    )
  )
    return formatCompactUsd(Number(value));
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 });
}
const seriesValue = (column: string, value: number) =>
  /revenue/i.test(column)
    ? value === 0
      ? '$0'
      : `$${(value / 1000).toFixed(1)}K`
    : answerValue(column, value);
type QueryResult = {
  sql: string;
  description: string;
  columns: string[];
  rows: (string | number | null)[][];
  rowCount: number;
  truncated: boolean;
};
export type AskReportAnswer = {
  done: boolean;
  status: string;
  ticket?: string;
  answer?: string;
  error?: string;
  results?: QueryResult[];
  scope?: string;
  definitionAsOf?: string;
  queriedAt?: string;
  sourceRefreshedAt?: string;
  expiresAt?: string;
  source?: string;
  sources?: string[];
  period?: string;
};

export type AskQuestionSuggestion =
  | string
  | {
      label: string;
      question: string;
    };

export type AskQuestionGroup = {
  label: string;
  questions: AskQuestionSuggestion[];
};

function AnswerFigure({
  result,
  question
}: {
  result: QueryResult;
  question: string;
}) {
  if (result.columns.includes('demo_forecast')) {
    const values = result.rows[0];
    if (!values) return null;
    return (
      <figure aria-label="Synthetic pacing answer" className="my-4">
        <dl className="grid grid-cols-3 gap-3">
          {result.columns.map((column, index) => (
            <div key={column}>
              <dt className="text-xs text-slate-600">
                {column === 'demo_forecast'
                  ? 'Demo forecast'
                  : column === 'revenue_goal'
                    ? 'Goal'
                    : 'Booked'}
              </dt>
              <dd className="mt-1 text-base font-semibold tabular-nums sm:text-2xl">
                {formatCompactUsd(Number(values[index]))}
              </dd>
            </div>
          ))}
        </dl>
      </figure>
    );
  }
  const series = weeklySalesSeries(
    result.columns,
    result.rows,
    question,
    result.truncated
  );
  if (series) {
    const low = Math.min(0, ...series.points.map((p) => p.value));
    const high = Math.max(0, ...series.points.map((p) => p.value));
    const span = high - low || 1;
    const x = (index: number) =>
      110 + (index * 660) / (series.points.length - 1);
    const y = (value: number) => 190 - ((value - low) * 160) / span;
    const title = metricLabel(series.metric);
    const peak = series.points.reduce((best, point) =>
      point.value > best.value ? point : best
    );
    return (
      <figure aria-label="Weekly sales chart" className="my-5 min-w-0">
        <figcaption className="text-lg font-semibold text-[#102a50]">
          {title} peaked at {seriesValue(series.metric, peak.value)} in the week
          of {shortDate(peak.date)}
        </figcaption>
        <p className="mt-1 text-xs text-slate-600">
          Monday–Sunday sales weeks · currently active non-comp ticket items.
          Not cash collections or premium-allocated Season Summary revenue.
        </p>
        <div
          className="mt-3 max-w-full overflow-x-auto"
          tabIndex={0}
          aria-label="Scrollable weekly chart"
        >
          <svg
            viewBox="0 0 800 230"
            role="img"
            aria-label={`${title}, ${series.points.length} completed weeks`}
            className="w-full min-w-[800px]"
          >
            <title>{title} by week</title>
            <desc>
              Values and dates are listed in the table below. No missing weeks
              are connected.
            </desc>
            {[low, high].map((v, i) => (
              <g key={i}>
                <line x1="110" x2="770" y1={y(v)} y2={y(v)} stroke="#cbd5e1" />
                <text
                  x="100"
                  y={y(v) + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#475569"
                >
                  {seriesValue(series.metric, v)}
                </text>
              </g>
            ))}
            <polyline
              fill="none"
              stroke="#102a50"
              strokeWidth="3"
              points={series.points
                .map((p, i) => `${x(i)},${y(p.value)}`)
                .join(' ')}
            />
            {series.points.map((p, i) => (
              <circle
                key={p.date}
                cx={x(i)}
                cy={y(p.value)}
                r="4"
                fill="#102a50"
              >
                <title>
                  {p.date}: {seriesValue(series.metric, p.value)}
                </title>
              </circle>
            ))}
            {[
              0,
              Math.floor((series.points.length - 1) / 2),
              series.points.length - 1
            ].map((i) => (
              <text
                key={i}
                x={x(i)}
                y="218"
                textAnchor={i === series.points.length - 1 ? 'end' : 'middle'}
                fontSize="12"
                fill="#475569"
              >
                {series.points[i].date}
              </text>
            ))}
          </svg>
        </div>
      </figure>
    );
  }
  const labelIndex = result.columns.findIndex((c) =>
    /^(opponent|event_name|product_category|category|rep_name)$/i.test(c)
  );
  const metricIndex = rankingMetric(result.columns, question);
  if (result.rows.length === 1) {
    const metrics = result.columns
      .map((column, index) => ({ column, index }))
      .filter(
        ({ column, index }) =>
          /revenue|goal|attainment|tickets?|count|gap|score/i.test(column) &&
          result.rows[0][index] !== null &&
          Number.isFinite(Number(result.rows[0][index]))
      );
    const revenue = metrics.find(({ column }) =>
      /^(total_)?(season_)?(?:net_)?revenue$/i.test(column)
    );
    const goal = metrics.find(({ column }) =>
      /^(total_)?(season_)?(?:revenue_)?goal$/i.test(column)
    );
    const revenueValue = revenue ? Number(result.rows[0][revenue.index]) : null;
    const goalValue = goal ? Number(result.rows[0][goal.index]) : null;
    const attainment =
      revenueValue !== null && goalValue !== null && goalValue > 0
        ? revenueValue / goalValue
        : null;
    const displayMetrics =
      attainment === null
        ? metrics
        : metrics.filter(({ column }) =>
            /^(total_)?(season_)?(?:net_revenue|revenue|revenue_goal|goal)$/i.test(
              column
            )
          );
    return (
      <section aria-label="Answer values" className="my-5">
        <h3 className="text-lg font-semibold text-[#102a50]">
          {attainment === null
            ? `${metricLabel(metrics[0]?.column ?? 'Result')}: ${answerValue(
                metrics[0]?.column ?? '',
                metrics[0] ? result.rows[0][metrics[0].index] : null
              )}`
            : `Season net revenue is ${formatPercent(attainment)} of goal`}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {displayMetrics.map(({ column, index }, metricIndex) => (
            <article
              key={column}
              className={
                metricIndex === 0
                  ? 'rounded-2xl bg-[#102a50] p-5 text-white'
                  : 'rounded-2xl border border-slate-200 bg-white p-5'
              }
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  metricIndex === 0 ? 'text-white/70' : 'text-slate-500'
                }`}
              >
                {metricLabel(column)}
              </p>
              <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">
                {answerValue(column, result.rows[0][index])}
              </p>
            </article>
          ))}
        </div>
        {attainment !== null && revenueValue !== null && goalValue !== null && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm font-medium">
              <span>{formatPercent(attainment)} achieved</span>
              <span>
                {formatCompactUsd(goalValue - revenueValue)} remaining
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#d7b65c]"
                style={{
                  width: `${Math.max(0, Math.min(100, attainment * 100))}%`
                }}
              />
            </div>
          </div>
        )}
      </section>
    );
  }
  if (
    labelIndex < 0 ||
    metricIndex < 0 ||
    result.rows.length < 2 ||
    result.rows.length > 10 ||
    result.rows.some(
      (row) =>
        row[metricIndex] === null ||
        row[metricIndex] === '' ||
        !Number.isFinite(Number(row[metricIndex])) ||
        Number(row[metricIndex]) < 0
    )
  )
    return null;
  const values = result.rows.map((row) => Number(row[metricIndex]));
  const max =
    Math.max(
      ...values,
      /percent|pct/i.test(result.columns[metricIndex])
        ? 100
        : /attainment/i.test(result.columns[metricIndex])
          ? 1
          : 0
    ) || 1;
  const lead = displayLabel(result.rows[0][labelIndex]);
  const rankingTitle =
    /lowest|fewest|smallest|furthest below|furthest behind/i.test(question)
      ? `${lead} has the lowest ${metricLabel(result.columns[metricIndex]).toLowerCase()}`
      : `${lead} leads ${metricLabel(result.columns[metricIndex]).toLowerCase()}`;
  return (
    <figure aria-label="Answer chart" className="my-5 space-y-3">
      <figcaption className="mb-4 text-lg font-semibold text-[#102a50]">
        {rankingTitle}
      </figcaption>
      {result.rows.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(80px,1fr)_2fr_auto] items-center gap-3 text-xs"
        >
          <span>{displayLabel(row[labelIndex])}</span>
          <div className="h-3 rounded bg-slate-100">
            <div
              className="h-3 rounded bg-[#102a50]"
              style={{ width: `${(100 * values[index]) / max}%` }}
            />
          </div>
          <span>
            {answerValue(result.columns[metricIndex], row[metricIndex])}
          </span>
        </div>
      ))}
    </figure>
  );
}

/** Demo: the scripted answer's canned SQL and the fixture rows it returned. */
function DemoQueryDetails({ result }: { result: QueryResult }) {
  if (!result.sql) return null;
  return (
    <details className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
      <summary className="cursor-pointer font-medium">
        Show the example database query and answer rows
      </summary>
      <p className="mt-2">{DEMO_TERMS.sql.label}: {DEMO_TERMS.sql.definition}</p>
      {result.description && <p className="mt-2">{result.description}</p>}
      <pre className="mt-2 max-w-full overflow-auto whitespace-pre-wrap break-words rounded bg-white p-2 font-mono text-[11px] leading-5">
        {result.sql}
      </pre>
      {result.rows.length > 0 && (
        <div className="mt-2 max-w-full overflow-x-auto">
          <table className="w-full text-left tabular-nums">
            <thead>
              <tr>
                {result.columns.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border-b border-slate-200 p-1.5 font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, 12).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap border-b border-slate-100 p-1.5"
                    >
                      {answerValue(result.columns[cellIndex] ?? '', cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

export async function reportJson<T>(
  url: string,
  signal: AbortSignal,
  body?: object
): Promise<T> {
  const response = await fetch(url, {
    signal,
    cache: 'no-store',
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      : {})
  });
  const data = (await response.json()) as T & {
    error?: string;
    reason?: string;
  };
  if (!response.ok)
    throw new Error(
      [data.error, data.reason && `(${data.reason})`]
        .filter(Boolean)
        .join(' ') || 'The source is unavailable.'
    );
  return data as T;
}

export function AskReport({
  enabled,
  loading = false,
  api = '/api/galaxy/season-summary/ask',
  title = 'Ask Galaxy Season',
  description = 'Aggregate season and event questions. Customer, order and rep detail are outside this report.',
  chips = [
    'Which five Galaxy 2026 events have the lowest revenue goal attainment?',
    'What is total Galaxy 2026 season net revenue against goal?',
    'Which remaining Galaxy home matches have sold the fewest paid tickets?',
    'How did net ticket revenue change over the last eight completed weeks?'
  ],
  questionGroups,
  questionLabel = 'Your season question',
  placeholder = 'Ask about the season…',
  prominent = false,
  autoFocus = false
}: {
  enabled: boolean;
  loading?: boolean;
  api?: string;
  title?: string;
  description?: string;
  chips?: string[];
  questionGroups?: AskQuestionGroup[];
  questionLabel?: string;
  placeholder?: string;
  prominent?: boolean;
  autoFocus?: boolean;
}) {
  const queryUrl = (params: string) =>
    `${api}${api.includes('?') ? '&' : '?'}${params}`;
  const [question, setQuestion] = useState('');
  const [answeredQuestion, setAnsweredQuestion] = useState('');
  const [answer, setAnswer] = useState<AskReportAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(true);
  const [stale, setStale] = useState(false);
  const active = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (autoFocus && enabled && !focused.current) {
      inputRef.current?.focus({ preventScroll: true });
      focused.current = true;
    }
  }, [autoFocus, enabled]);
  useEffect(() => {
    const controller = new AbortController();
    // Synthetic demo agents are ready immediately; verify status in the background.
    void reportJson<{ configured: boolean }>(
      `${api}${api.includes('?') ? '&' : '?'}status=true`,
      controller.signal
    )
      .then((value) => setConfigured(value.configured))
      .catch(() => {
        if (!controller.signal.aborted) setConfigured(false);
      });
    return () => controller.abort();
  }, [api]);
  useEffect(() => {
    if (enabled) return;
    active.current?.abort();
    setBusy(false);
    setAnswer(null);
  }, [enabled]);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    setStale(false);
    if (!answer?.expiresAt) return;
    const expiresAt = Date.parse(answer.expiresAt);
    const expire = () => {
      if (Date.now() >= expiresAt) setStale(true);
    };
    document.addEventListener('visibilitychange', expire);
    const timer = setTimeout(
      expire,
      Math.max(0, Date.parse(answer.expiresAt) - Date.now())
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', expire);
    };
  }, [answer]);
  async function ask(value: string) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setQuestion(value);
    setBusy(true);
    setError('');
    setAnswer(null);
    try {
      let result = await reportJson<AskReportAnswer>(api, controller.signal, {
        question: value
      });
      const ticket = result.ticket;
      const deadline = Date.now() + 240_000;
      while (!result.done && Date.now() < deadline) {
        if (!ticket) throw new Error('The conversation could not be opened.');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (controller.signal.aborted) return;
        result = await reportJson<AskReportAnswer>(
          queryUrl(`ticket=${encodeURIComponent(ticket)}`),
          controller.signal
        );
      }
      if (!result.done)
        throw new Error('The question took too long. Try a narrower question.');
      if (result.error) throw new Error(result.error);
      if (!controller.signal.aborted) {
        setAnswer(result);
        setAnsweredQuestion(value);
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : 'The answer is unavailable.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const ready = enabled && configured === true;
  const checking = loading || configured === null;
  const visibleGroups = questionGroups?.length
    ? questionGroups
    : [{ label: '', questions: chips }];
  return (
    <section
      className="border-t border-slate-200 pt-4 sm:pt-5"
      aria-label={title}
    >
      {description && <p className="sr-only">{description}</p>}
      {prominent && (
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#102a50] text-white">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold text-[#102a50] sm:text-lg">
            {title}
          </h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            Demo: scripted answers
          </span>
        </div>
      )}
      {!prominent && (
        <p className="text-[11px] font-semibold text-amber-900">
          Demo: scripted answers
        </p>
      )}
      <p className="mt-2 max-w-[75ch] text-sm leading-relaxed text-slate-600">
        {DEMO_TERMS.genie.definition}
      </p>
      {checking && (
        <p
          role="status"
          className={`${prominent ? 'mt-3' : ''} text-sm text-slate-600`}
        >
          Preparing this report&apos;s agent…
        </p>
      )}
      {!checking && configured === false && (
        <p className={`${prominent ? 'mt-3' : ''} text-sm text-amber-800`}>
          Ask is unavailable right now.
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && question.trim()) void ask(question.trim());
        }}
        className={prominent ? 'mt-3 flex items-stretch gap-2' : 'space-y-2'}
      >
        <label className="sr-only" htmlFor="galaxy-season-question">
          {questionLabel}
        </label>
        <input
          id="galaxy-season-question"
          ref={inputRef}
          value={question}
          maxLength={800}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (ready && question.trim()) void ask(question.trim());
          }}
          disabled={(prominent ? !enabled : !ready) || busy}
          placeholder={placeholder || chips[0]}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-[#102a50] focus:ring-2 focus:ring-[#102a50]/20"
        />
        {prominent ? (
          <button
            type="submit"
            aria-label="Ask"
            disabled={!ready || busy || !question.trim()}
            className="inline-flex w-12 shrink-0 items-center justify-center rounded-lg bg-[#102a50] text-white transition hover:bg-[#183d70] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <ArrowUp aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            {busy ? 'Checking governed sources…' : 'Press Enter to ask.'}
          </p>
        )}
      </form>
      {prominent && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Suggested questions"
        >
          {visibleGroups
            .flatMap((group) => group.questions)
            .map((suggestion) => {
              const prompt =
                typeof suggestion === 'string'
                  ? suggestion
                  : suggestion.question;
              const label =
                typeof suggestion === 'string' ? suggestion : suggestion.label;
              return (
                <button
                  key={prompt}
                  type="button"
                  disabled={busy || !enabled}
                  onClick={() => {
                    setQuestion(prompt);
                    if (ready) void ask(prompt);
                  }}
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  {label}
                </button>
              );
            })}
        </div>
      )}
      {prominent && busy && (
        <p role="status" className="mt-2 text-xs text-slate-500">
          Checking governed sources…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {answer && (
        <div aria-live="polite" className="mt-5 border-t border-slate-200 pt-5">
          {stale ? (
            <p role="status" className="mt-3 text-amber-800">
              This answer has expired. Ask again for a current result.
            </p>
          ) : (
            <>
              {answer.answer && (
                <p className="text-sm leading-6">
                  {answer.answer.replaceAll('**', '')}
                </p>
              )}
              {answer.results?.map((result, index) => (
                <div key={index} className="mt-5">
                  <AnswerFigure result={result} question={answeredQuestion} />
                  {!result.rows.length && (
                    <p className="text-sm text-slate-600">
                      No rows matched this question.
                    </p>
                  )}
                  <DemoQueryDetails result={result} />
                  {result.truncated && (
                    <p className="mt-2 text-xs text-slate-600">
                      Showing {result.rows.length} of {result.rowCount} rows.
                      Narrow the question to see a complete result.
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
