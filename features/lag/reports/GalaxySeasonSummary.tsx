'use client';

import { useEffect, useState } from 'react';
import { DemoTerms } from '@/components/demo/DemoTerms';
import { GalaxyPacing } from './GalaxyPacing';
import type { GalaxySeasonReport } from '@/lib/types/galaxy-season';
import { DEMO_TODAY } from '@/lib/demo/viewer';
import { formatCompactUsd, formatPercent } from '@/lib/format/report-values';
import {
  AskReport,
  type AskQuestionGroup,
  reportJson
} from '@/features/shared/reports/AskReport';

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

// Public demo: the synthetic fixtures are frozen at DEMO_TODAY.
const pacificToday = () => DEMO_TODAY;

export function GalaxySeasonSummary({
  overview = false,
  initialData
}: {
  overview?: boolean;
  initialData?: GalaxySeasonReport;
}) {
  const [data, setData] = useState<GalaxySeasonReport | null>(
    initialData ?? null
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!initialData);
  const [refresh, setRefresh] = useState(0);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (refresh === 0 && initialData) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    if (refresh === 0) setData(null);
    void reportJson<GalaxySeasonReport>(
      `/api/galaxy/season-summary?season=26REG${refresh > 0 ? '&refresh=true' : ''}`,
      controller.signal
    )
      .then((value) => {
        setData(value);
        setStale(false);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : 'The source is unavailable.'
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh, initialData]);
  useEffect(() => {
    if (!data) return;
    const expiresAt = Date.parse(data.expiresAt);
    const expire = () => {
      if (Date.now() >= expiresAt) setStale(true);
    };
    document.addEventListener('visibilitychange', expire);
    const timer = setTimeout(
      expire,
      Math.max(0, Date.parse(data.expiresAt) - Date.now())
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', expire);
    };
  }, [data]);
  const events = data?.events ?? [];
  const revenue = events.reduce((sum, e) => sum + e.revenue, 0),
    goal = events.reduce((sum, e) => sum + e.goal, 0);
  const attention = [...events]
    .sort((a, b) => a.attainment - b.attainment)
    .slice(0, 5);
  const upcoming = events
    .filter((event) => event.eventDate >= pacificToday())
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 3);
  const netTickets = events.reduce((sum, event) => sum + event.tickets, 0);
  const askQuestionGroups: AskQuestionGroup[] = [
    {
      label: 'Season',
      questions: [
        {
          label: 'Season revenue vs goal',
          question:
            'What is total Galaxy 2026 regular-season net revenue and revenue goal?'
        },
        {
          label: 'Revenue by product',
          question: 'Break down Galaxy 2026 net revenue by product category.'
        }
      ]
    },
    {
      label: 'Games',
      questions: [
        {
          label: '5 games furthest below goal',
          question:
            'Which five Galaxy 2026 games have the lowest revenue goal attainment?'
        },
        {
          label: 'Next 3 home games',
          question:
            'Show the next three Galaxy 2026 home games with event date, net revenue, net ticket count, and revenue goal attainment.'
        },
        {
          label: 'Fewest paid tickets',
          question:
            'Which remaining Galaxy home matches have sold the fewest paid tickets?'
        }
      ]
    },
    {
      label: 'Trend',
      questions: [
        {
          label: 'Dana’s pacing',
          question: 'Show Dana’s fake demo season pacing and forecast gap.'
        },
        {
          label: 'Last 8 completed weeks',
          question:
            'How did net ticket revenue change over the last eight completed weeks?'
        }
      ]
    }
  ];
  return (
    <main className="mx-auto max-w-5xl space-y-3 px-3 py-4 text-[#102a50] sm:px-6 sm:py-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="mt-0.5 text-2xl font-semibold sm:text-3xl">
            {overview ? 'Galaxy Overview' : 'Season Summary'}
          </h1>
        </div>
        <p className="text-xs text-slate-600">
          2026 regular season · Oct 1 demo snapshot
        </p>
      </header>
      <AskReport
        enabled={Boolean(data && !stale && data.events.length)}
        loading={loading && !data}
        description=""
        chips={askQuestionGroups.flatMap((group) =>
          group.questions.map((question) =>
            typeof question === 'string' ? question : question.question
          )
        )}
        questionGroups={askQuestionGroups}
        title="Ask Genie"
        autoFocus={overview}
        prominent
      />
      <DemoTerms terms={['netRevenue', 'netTickets', 'attainment', 'plans', 'shield', 'periods']} />
      {loading && !data && (
        <section
          role="status"
          aria-label="Loading Galaxy report"
          aria-live="polite"
          className="space-y-4"
        >
          <span className="sr-only">Loading Galaxy report</span>
          <div aria-hidden="true" className="animate-pulse space-y-4">
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-40 rounded-2xl bg-slate-100" />
          </div>
        </section>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 className="font-semibold">Season Summary unavailable</h2>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}
      {data && (
        <>
          {stale ? (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-5 text-amber-800"
            >
              <p>This report has expired. Refresh before using its values.</p>
              <button
                onClick={() => setRefresh((value) => value + 1)}
                disabled={loading}
                className="rounded-lg border border-amber-400 px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          ) : !events.length ? (
            <p className="rounded-xl border p-6">
              No accepted events matched this report.
            </p>
          ) : (
            <>
              <section
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
                aria-label="Revenue against goal"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Net ticket revenue
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {formatCompactUsd(revenue)}
                  </p>
                  <p className="text-sm text-slate-500">
                    of {formatCompactUsd(goal)}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPercent(revenue / goal)} to goal
                  </p>
                  <p className="ml-auto text-sm text-slate-500">
                    {formatCompactUsd(goal - revenue)} gap
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded bg-slate-100">
                  <div
                    className="h-1.5 bg-[#102a50]"
                    style={{
                      width: `${Math.max(0, Math.min(100, (100 * revenue) / goal))}%`
                    }}
                  />
                </div>
              </section>
              <section className="py-2">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    ['Net tickets', netTickets.toLocaleString('en-US')],
                    ['Home games', events.length.toLocaleString('en-US')],
                    [
                      'Upcoming games',
                      events
                        .filter((event) => event.eventDate >= pacificToday())
                        .length.toLocaleString('en-US')
                    ]
                  ].map(([label, value]) => (
                    <article
                      key={label}
                      className="rounded-xl bg-slate-100 p-2.5 sm:p-4"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums sm:text-2xl">
                        {value}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
              <GalaxyPacing events={events} />
              <section className="grid gap-6 py-2 lg:grid-cols-2">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-base font-semibold sm:text-lg">
                      Next home games
                    </h2>
                    <span className="text-xs text-slate-500">
                      as of {shortDate(pacificToday())}
                    </span>
                  </div>
                  <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
                    {upcoming.map((event) => (
                      <div
                        key={event.eventCode}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-3 text-sm"
                      >
                        <span>
                          <strong>{shortDate(event.eventDate)}</strong>{' '}
                          <span className="text-slate-600">
                            {event.opponent}
                          </span>
                        </span>
                        <span className="whitespace-nowrap tabular-nums text-slate-500">
                          {formatPercent(event.attainment)} ·{' '}
                          {event.tickets.toLocaleString('en-US')} net tickets
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-base font-semibold sm:text-lg">
                      Lowest goal attainment
                    </h2>
                    <span className="text-xs text-slate-500">
                      all 2026 home games
                    </span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {attention.map((event) => (
                      <div
                        key={event.eventCode}
                        className="grid grid-cols-[minmax(125px,1fr)_1.25fr_auto] items-center gap-2 text-sm"
                      >
                        <span className="truncate">
                          {event.opponent}{' '}
                          <span className="text-xs text-slate-600">
                            · {shortDate(event.eventDate)}
                          </span>
                        </span>
                        <div className="h-1.5 rounded bg-slate-100">
                          <div
                            className="h-1.5 rounded bg-[#102a50]"
                            style={{
                              width: `${Math.max(0, Math.min(100, event.attainment * 100))}%`
                            }}
                          />
                        </div>
                        <strong className="font-semibold tabular-nums">
                          {formatPercent(event.attainment)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
