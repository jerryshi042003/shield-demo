'use client';

import { DemoTerms } from '@/components/demo/DemoTerms';
import { useEffect, useState } from 'react';
import { AskReport } from '@/features/shared/reports/AskReport';
import type { KingsSalesReport } from '@/lib/types/kings-sales';
import { formatCompactUsd } from '@/lib/format/report-values';

const percent = (value: number) =>
  `${(value * 100).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
const date = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

export default function KingsTicketSales() {
  const [report, setReport] = useState<KingsSalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch(`/api/kings/sales${revision ? '?refresh=true' : ''}`, {
      cache: 'no-store',
      signal: controller.signal
    })
      .then(async (response) => {
        const value = (await response.json()) as KingsSalesReport & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(value.error ?? 'Kings sales is unavailable.');
        setReport(value);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Kings sales is unavailable.'
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 text-[#102a50] sm:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          LA Kings · 2026–27 preseason + regular season
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Ticket Sales
        </h1>
      </header>
      <DemoTerms terms={["netRevenue", "fse", "attainment", "netTickets", "atp", "periods"]} />

      {loading && !report && (
        <section
          aria-label="Loading Kings Ticket Sales"
          role="status"
          className="space-y-4 animate-pulse"
        >
          <span className="sr-only">Loading Kings Ticket Sales</span>
          <div className="h-28 rounded-2xl bg-slate-100" />
          <div className="h-44 rounded-2xl bg-slate-100" />
        </section>
      )}
      {error && (
        <section
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
          <h2 className="font-semibold">Ticket Sales unavailable</h2>
          <p className="mt-2 text-sm">{error}</p>
          <button
            className="mt-3 rounded-lg border border-amber-400 px-4 py-2 text-sm"
            onClick={() => setRevision((value) => value + 1)}
          >
            Refresh report
          </button>
        </section>
      )}
      {report && (
        <>
          <section
            aria-label="Current Kings sales pacing"
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Revenue to season goal
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="text-4xl font-semibold tracking-tight">
                {formatCompactUsd(report.netRevenue)}
              </p>
              <p className="text-sm text-slate-500">
                of {formatCompactUsd(report.revenueGoal)}
              </p>
              <p className="text-sm font-semibold">
                {percent(report.attainment)}
              </p>
              <p className="ml-auto text-sm text-slate-500">
                ${report.averagePaidPrice.toFixed(2)} avg paid price
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {formatCompactUsd(report.revenueGap)} remaining ·{' '}
              {report.netTickets.toLocaleString()} net tickets
            </p>
          </section>

          <section aria-label="Kings pacing by sales category" className="py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                Season goal progress by product
              </h2>
              <span className="text-xs text-slate-500">
                lowest attainment first
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[...report.categories]
                .sort((a, b) => a.attainment - b.attainment)
                .map((category) => (
                  <div
                    key={category.name}
                    className="grid grid-cols-[minmax(88px,0.7fr)_2fr_auto] items-center gap-3 text-sm"
                  >
                    <span>{category.name === 'FSE' ? 'Ticket plans (FSE)' : category.name}</span>
                    <span
                      className="h-2 rounded bg-slate-100"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-2 rounded bg-[#102a50]"
                        style={{
                          width: `${Math.min(100, 100 * category.attainment)}%`
                        }}
                      />
                    </span>
                    <strong className="tabular-nums">
                      {percent(category.attainment)}
                    </strong>
                  </div>
                ))}
            </div>
          </section>

          <section
            aria-label="Last completed sales week"
            className="rounded-2xl bg-[#102a50] p-5 text-white"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Last completed week · {date(report.lastWeek.start)}–
              {date(report.lastWeek.end)}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="text-3xl font-semibold">
                {formatCompactUsd(report.lastWeek.netRevenue)}
              </p>
              <p className="text-sm text-white/70">
                {report.lastWeek.purchases.toLocaleString()} purchases ·{' '}
                {report.lastWeek.cancellations.toLocaleString()} cancellations
              </p>
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
        chips={[
          'What changed last completed week?',
          'Which category is furthest behind goal?',
          'Which games have the most net ticket revenue?'
        ]}
        prominent
      />
    </main>
  );
}
