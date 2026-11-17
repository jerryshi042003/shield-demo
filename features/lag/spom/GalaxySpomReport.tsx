'use client';

import { DemoTerms } from '@/components/demo/DemoTerms';
import { useEffect, useState } from 'react';
import {
  AskReport,
  type AskQuestionGroup
} from '@/features/shared/reports/AskReport';
import {
  SPOM_CATEGORIES,
  type GalaxySpomReport as Report,
  type SpomRow
} from '@/lib/types/galaxy-spom';
import { formatReadableUsd } from '@/lib/format/report-values';

const money = formatReadableUsd;
const labels = {
  full_season: 'Full season',
  partial_plan: 'Partial plan',
  mini_plan: 'Mini plan',
  individual: 'Individual',
  youth_soccer: 'Youth soccer',
  grp: 'Groups',
  rentals: 'Rentals',
  license: 'License'
};

export function GalaxySpomReport({
  audience,
  defaultMonth,
  initialData
}: {
  audience: 'manager' | 'rep';
  defaultMonth: string;
  initialData?: Report;
}) {
  const month = defaultMonth.slice(0, 7);
  const [report, setReport] = useState<Report | null>(initialData ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!initialData);
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<'manager' | 'rep'>(audience);
  const [selectedRepTag, setSelectedRepTag] = useState('');
  useEffect(() => {
    if (revision === 0 && initialData) return;
    const controller = new AbortController();
    setLoading(true);
    setReport(null);
    setError('');
    (async () => {
      try {
        const response = await fetch(
          `/api/galaxy/spom?month=${encodeURIComponent(month + '-01')}`,
          { cache: 'no-store', signal: controller.signal }
        );
        const data = (await response.json()) as Report & { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'SPOM is unavailable.');
        if (data.audience !== audience)
          throw new Error('Your report scope changed. Reload this page.');
        if (!controller.signal.aborted) {
          setReport(data);
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'SPOM is unavailable.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [month, audience, revision, initialData]);
  useEffect(() => {
    if (!report) return;
    const expire = () => {
      if (Date.now() >= Date.parse(report.expiresAt)) {
        setReport(null);
        setError(
          'This report expired. Refresh to verify the current scope and scores.'
        );
      }
    };
    const timer = setTimeout(
      expire,
      Math.max(0, Date.parse(report.expiresAt) - Date.now())
    );
    document.addEventListener('visibilitychange', expire);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', expire);
    };
  }, [report]);
  const manager = audience === 'manager';
  const reviewerRepView = manager && view === 'rep';
  const row = reviewerRepView
    ? (report?.rows.find((candidate) => candidate.repTag === selectedRepTag) ??
      report?.rows[0])
    : report?.rows[0];
  const top = report?.rows.slice(0, 10) ?? [];
  const monthLabel = report
    ? new Date(report.month + 'T00:00:00Z').toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
    : month;
  const positiveRanking = top.every((r) => r.score >= 0);
  const max = Math.max(1, ...top.map((r) => Math.abs(r.score)));
  const questionGroups: AskQuestionGroup[] =
    reviewerRepView && row
      ? [
          {
            label: 'Selected rep',
            questions: [
              {
                label: 'Score and orders',
                question: `What is ${row.repName}'s ${monthLabel} SPOM score and order count?`
              },
              {
                label: 'Category mix',
                question: `Show ${row.repName}'s eight SPOM category amounts for ${monthLabel}.`
              }
            ]
          },
          {
            label: 'Change',
            questions: [
              {
                label: 'July vs August',
                question: `How did ${row.repName}'s SPOM score change from July to August 2026?`
              }
            ]
          }
        ]
      : manager
        ? [
            {
              label: 'Team',
              questions: [
                {
                  label: 'Team score and orders',
                  question: `What is my team's ${monthLabel} SPOM score and order count?`
                },
                {
                  label: 'Rank my team',
                  question: `Rank my permitted representatives by ${monthLabel} SPOM score.`
                }
              ]
            },
            {
              label: 'Mix',
              questions: [
                {
                  label: 'Category mix by rep',
                  question: `Show each permitted representative and eight SPOM category amounts for ${monthLabel}.`
                }
              ]
            },
            {
              label: 'Change',
              questions: [
                {
                  label: 'July vs August',
                  question:
                    'For representatives with records in both July and August 2026, how did each SPOM score change?'
                }
              ]
            }
          ]
        : [
            {
              label: 'Score',
              questions: [
                {
                  label: 'My score and orders',
                  question: `What is my ${monthLabel} SPOM score and order count?`
                }
              ]
            },
            {
              label: 'Mix',
              questions: [
                {
                  label: 'My 8 categories',
                  question: `Show my eight SPOM category amounts for ${monthLabel}.`
                }
              ]
            },
            {
              label: 'Change',
              questions: [
                {
                  label: 'July vs August',
                  question:
                    'How did my SPOM score change from July to August 2026?'
                }
              ]
            }
          ];
  const askPanel = (
    <AskReport
      key={`${audience}:${view}:${row?.repTag ?? 'team'}:${month}`}
      enabled={Boolean(report?.rows.length)}
      loading={loading}
      api={`/api/galaxy/spom/genie/ask?month=${month}-01`}
      title="Ask about monthly sales"
      description=""
      questionLabel={
        reviewerRepView
          ? `Ask about ${row?.repName ?? 'the selected rep'}`
          : manager
            ? 'Your manager SPOM question'
            : 'Your SPOM question'
      }
      placeholder="Try: What is SPOM?"
      chips={questionGroups.flatMap((group) =>
        group.questions.map((question) =>
          typeof question === 'string' ? question : question.question
        )
      )}
      questionGroups={questionGroups}
      prominent
    />
  );
  return (
    <div
      className="mx-auto max-w-5xl space-y-3 py-4 sm:py-5"
      data-spom-audience={audience}
    >
      <header>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Galaxy / Sales
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            {manager ? 'Salesperson of the Month (SPOM)' : 'My Salesperson of the Month (SPOM)'}
          </h1>
          {manager && (
            <p className="mt-1 text-sm text-slate-600">
              Compare monthly sales credit across the fictional sales team.
            </p>
          )}
        </div>
      </header>
      <DemoTerms terms={['spom', 'score', 'paymentMonth', 'views', 'plans', 'spomOther']} />
      {loading && (
        <section
          role="status"
          aria-label="Loading SPOM"
          aria-live="polite"
          className="space-y-4"
        >
          <span className="sr-only">Loading SPOM</span>
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div
            aria-hidden="true"
            className={`grid animate-pulse gap-5 ${manager ? 'lg:grid-cols-2' : ''}`}
          >
            {manager && <div className="h-72 rounded-2xl bg-slate-100" />}
            <div className="h-72 rounded-2xl bg-slate-100" />
          </div>
        </section>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
          <p>{error}</p>
          <button
            onClick={() => setRevision((v) => v + 1)}
            className="mt-3 rounded-lg border border-amber-400 px-4 py-2 text-sm"
          >
            Refresh report
          </button>
        </div>
      )}
      {report && (
        <>
          {!report.rows.length ? (
            <p className="rounded-xl bg-slate-50 p-6">
              No accepted SPOM rows are available for your scope in this month.
              No other representative&apos;s data is substituted.
            </p>
          ) : (
            <>
              {manager && (
                <section
                  aria-label="SPOM view"
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                    {(['manager', 'rep'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setView(option)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          view === option
                            ? 'bg-white text-[#102a50] shadow-sm'
                            : 'text-slate-600 hover:text-[#102a50]'
                        }`}
                      >
                        {option === 'manager' ? 'Manager view' : 'Rep preview'}
                      </button>
                    ))}
                  </div>
                  {reviewerRepView && (
                    <label className="flex items-center gap-2 px-2 text-sm font-medium text-slate-700">
                      Representative
                      <select
                        value={row?.repTag ?? ''}
                        onChange={(event) =>
                          setSelectedRepTag(event.target.value)
                        }
                        className="min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2"
                      >
                        {report.rows.map((candidate) => (
                          <option
                            key={candidate.repTag}
                            value={candidate.repTag}
                          >
                            {candidate.repName}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </section>
              )}
              <section
                aria-label="SPOM summary"
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
              >
                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {money(
                    reviewerRepView && row ? row.score : report.totalScore
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {(reviewerRepView && row
                    ? row.orders
                    : report.totalOrders
                  ).toLocaleString()}{' '}
                  orders
                </p>
                {manager && !reviewerRepView ? (
                  <p className="text-sm text-slate-500">
                    {report.rows.length} representatives
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    {row?.repName} · {row?.team}
                  </p>
                )}
              </section>
              {askPanel}
              <div
                className={
                  manager && !reviewerRepView
                    ? 'grid gap-3 lg:grid-cols-2'
                    : 'grid gap-3'
                }
              >
                {manager && !reviewerRepView && (
                  <section
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4"
                    aria-label="Team scores"
                  >
                    <h2 className="text-lg font-semibold">Team ranking</h2>
                    <div className="mt-2 space-y-1">
                      {top.map((r) => (
                        <div
                          key={r.repTag}
                          className="block w-full px-2 py-1.5 text-left"
                        >
                          <span className="flex justify-between gap-3 text-sm">
                            <span>{r.repName}</span>
                            <strong>{money(r.score)}</strong>
                          </span>
                          {positiveRanking && (
                            <span className="mt-1.5 block h-1.5 rounded bg-slate-100">
                              <span
                                className={`block h-1.5 rounded ${r.score < 0 ? 'bg-amber-600' : 'bg-[#102a50]'}`}
                                style={{
                                  width: `${(Math.abs(r.score) / max) * 100}%`
                                }}
                              />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <section
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4"
                  aria-label="Category contribution"
                >
                  <h2 className="text-lg font-semibold">
                    {manager && !reviewerRepView
                      ? 'Top representative mix'
                      : 'Category mix'}
                  </h2>
                  {row && <Category row={row} />}
                </section>
              </div>
            </>
          )}
        </>
      )}
      {!report?.rows.length && askPanel}
    </div>
  );
}

function Category({ row }: { row: SpomRow }) {
  const contributing = SPOM_CATEGORIES.filter(
    (category) => Math.abs(row.categories[category]) > 0
  ).sort(
    (left, right) =>
      Math.abs(row.categories[right]) - Math.abs(row.categories[left])
  );
  const categories = contributing.length ? contributing : SPOM_CATEGORIES;
  const max = Math.max(
    1,
    ...categories.map((category) => Math.abs(row.categories[category]))
  );
  return (
    <div className="mt-3">
      <p className="text-sm font-medium">{row.repName}</p>
      <dl className="mt-2 space-y-1.5">
        {categories.map((c) => (
          <div
            key={c}
            className="grid grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-3 text-sm"
          >
            <dt className="text-slate-600">{labels[c]}</dt>
            <span className="h-1.5 rounded bg-slate-100" aria-hidden="true">
              <span
                className="block h-1.5 rounded bg-[#102a50]"
                style={{
                  width: `${(Math.abs(row.categories[c]) / max) * 100}%`
                }}
              />
            </span>
            <dd className="font-medium tabular-nums">
              {money(row.categories[c])}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex justify-between border-t border-slate-200 pt-2.5 font-semibold">
        <span>Total score</span>
        <span>{money(row.score)}</span>
      </div>
    </div>
  );
}
