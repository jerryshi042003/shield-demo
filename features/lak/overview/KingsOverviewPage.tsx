'use client';

import { DemoTerms } from '@/components/demo/DemoTerms';
import { useEffect, useState } from 'react';
import { AskReport, reportJson } from '@/features/shared/reports/AskReport';
import { formatCompactUsd, formatPercent } from '@/lib/format/report-values';
import type { KingsPaymentsData } from '@/lib/types/kings-payments';
import type { KingsSalesReport } from '@/lib/types/kings-sales';

const shortDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

export default function KingsOverviewPage() {
  const [report, setReport] = useState<KingsSalesReport | null>(null);
  const [payments, setPayments] = useState<KingsPaymentsData | null>(null);
  const [paymentsError, setPaymentsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void reportJson<KingsSalesReport>(
      `/api/kings/sales${revision ? '?refresh=true' : ''}`,
      controller.signal
    )
      .then(setReport)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Kings Overview is unavailable.'
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    const controller = new AbortController();
    setPaymentsError(false);
    void reportJson<KingsPaymentsData>(
      `/api/kings/payments${revision ? '?refresh=true' : ''}`,
      controller.signal
    )
      .then(setPayments)
      .catch(() => {
        if (!controller.signal.aborted) setPaymentsError(true);
      });
    return () => controller.abort();
  }, [revision]);

  const topGameMax = Math.max(
    1,
    ...(report?.topGames.map((game) => game.netRevenue) ?? [])
  );

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-6 text-[#102a50] sm:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          LA Kings · 2026–27 preseason + regular season
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Overview</h1>
      </header>
      <DemoTerms terms={["netRevenue", "netTickets", "attainment", "fse", "atp", "payments", "periods", "shield"]} />

      {loading && !report && (
        <section
          aria-label="Loading Kings Overview"
          role="status"
          className="space-y-4 animate-pulse"
        >
          <span className="sr-only">Loading Kings Overview</span>
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-28 rounded-2xl bg-slate-100" />
            <div className="h-28 rounded-2xl bg-slate-100" />
          </div>
        </section>
      )}

      {error && !report && (
        <section
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
          <h2 className="font-semibold">Kings Overview unavailable</h2>
          <p className="mt-2 text-sm">{error}</p>
          <button
            className="mt-3 rounded-lg border border-amber-400 px-4 py-2 text-sm"
            onClick={() => setRevision((value) => value + 1)}
          >
            Refresh overview
          </button>
        </section>
      )}

      {report && (
        <>
          <section aria-labelledby="kings-season-pacing" className="space-y-3">
            <div className="flex items-center gap-4">
              <h2 id="kings-season-pacing" className="text-lg font-semibold">
                Season Pacing
              </h2>
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">
                demo snapshot · revenue to goal
              </span>
            </div>
            <div className="rounded-2xl bg-slate-100 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold tabular-nums">
                    {formatCompactUsd(report.netRevenue)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    of {formatCompactUsd(report.revenueGoal)} ·{' '}
                    {formatPercent(report.attainment)} achieved
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {formatCompactUsd(report.revenueGap)} remaining
                </p>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.min(100, report.attainment * 100)}%`
                  }}
                />
              </div>
            </div>
          </section>

          <section
            aria-label="Kings sales health"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              [
                'Net tickets',
                report.netTickets.toLocaleString('en-US'),
                `${report.paidTickets.toLocaleString('en-US')} paid`
              ],
              [
                'Comp tickets',
                report.compTickets.toLocaleString('en-US'),
                'included in net tickets'
              ],
              [
                'Average paid price',
                `$${report.averagePaidPrice.toFixed(2)}`,
                'per paid ticket'
              ],
              [
                'Payment declines',
                payments
                  ? payments.needsActionOrders.toLocaleString('en-US')
                  : '—',
                payments
                  ? `${formatCompactUsd(payments.declinedAmount)} outstanding`
                  : paymentsError
                    ? 'payment data unavailable'
                    : 'loading current status'
              ]
            ].map(([label, value, context]) => (
              <article key={label} className="rounded-2xl bg-slate-100 p-5">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{context}</p>
              </article>
            ))}
          </section>

          <section aria-labelledby="kings-last-week" className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 id="kings-last-week" className="text-lg font-semibold">
                Last Week
              </h2>
              <span className="h-px min-w-10 flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">
                {shortDate(report.lastWeek.start)}–
                {shortDate(report.lastWeek.end)}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 rounded-2xl bg-slate-100 p-5">
              <p className="text-3xl font-semibold tabular-nums">
                {formatCompactUsd(report.lastWeek.netRevenue)}
              </p>
              <p className="text-sm text-slate-600">
                {report.lastWeek.purchases.toLocaleString()} purchases ·{' '}
                {report.lastWeek.cancellations.toLocaleString()} cancellations
              </p>
            </div>
          </section>

          <section
            aria-labelledby="kings-category-pacing"
            className="space-y-3"
          >
            <div className="flex items-center gap-4">
              <h2 id="kings-category-pacing" className="text-lg font-semibold">
                Sales by Product
              </h2>
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">revenue to goal</span>
            </div>
            <div className="space-y-4 rounded-2xl bg-slate-100 p-5">
              {[...report.categories]
                .sort((a, b) => b.revenue - a.revenue)
                .map((category) => (
                  <div key={category.name}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {category.name === 'Individual'
                          ? 'Singles'
                          : category.name === 'FSE' ? 'Ticket plans (FSE)' : category.name}
                      </span>
                      <span className="tabular-nums text-slate-600">
                        {formatCompactUsd(category.revenue)} ·{' '}
                        {formatPercent(category.attainment)}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(100, category.attainment * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section aria-labelledby="kings-top-games" className="space-y-3">
            <div className="flex items-center gap-4">
              <h2 id="kings-top-games" className="text-lg font-semibold">
                Top Games by Net Revenue
              </h2>
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">this season</span>
            </div>
            <div className="space-y-3 rounded-2xl bg-slate-100 p-5">
              {report.topGames.map((game) => (
                <div
                  key={`${game.name}-${game.date}`}
                  className="grid gap-2 text-sm sm:grid-cols-[minmax(170px,1fr)_2fr_auto] sm:items-center sm:gap-4"
                >
                  <span className="min-w-0 truncate">
                    {game.name}{' '}
                    <span className="text-slate-500">
                      · {shortDate(game.date)}
                    </span>
                  </span>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${(100 * game.netRevenue) / topGameMax}%`
                      }}
                    />
                  </div>
                  <strong className="tabular-nums">
                    {formatCompactUsd(game.netRevenue)}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <AskReport
        enabled={Boolean(report)}
        loading={loading && !report}
        api="/api/kings/sales/ask"
        title="Ask Kings Sales"
        description="Aggregate Kings ticket sales only. Customer identities and unsupported domains stay out of scope."
        questionLabel="Your Kings sales question"
        placeholder="Ask about Kings sales, games, products, or tickets…"
        questionGroups={[
          {
            label: 'Sales',
            questions: [
              'What did we sell last completed week, by product?',
              'How are groups and singles building week by week?'
            ]
          },
          {
            label: 'Games',
            questions: [
              'Which games sold best last completed week?',
              'What are the top five games by net ticket revenue this season?'
            ]
          },
          {
            label: 'Tickets',
            questions: ['How many paid and comp net tickets do we have?']
          },
          {
            label: 'Pacing',
            questions: ['Which product is furthest below its season goal?']
          }
        ]}
        prominent
      />
    </main>
  );
}
