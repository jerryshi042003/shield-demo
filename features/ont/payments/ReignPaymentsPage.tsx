'use client';

import { useEffect, useState } from 'react';
import { Loader2, LockKeyhole } from 'lucide-react';
import type { ReignPaymentsData } from '@/lib/types/reign-payments';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const count = new Intl.NumberFormat('en-US');

export default function ReignPaymentsPage() {
  const [data, setData] = useState<ReignPaymentsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/reign/payments', {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          | ReignPaymentsData
          | { error?: string };
        if (!response.ok) {
          throw new Error(
            'error' in payload && payload.error
              ? payload.error
              : 'Reign Payments is unavailable.'
          );
        }
        setData(payload as ReignPaymentsData);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(
          cause instanceof Error ? cause.message : 'Reign Payments is unavailable.'
        );
      });

    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <section className="rounded-xl border border-gray-200 bg-[#ededed] p-6">
        <p className="text-sm font-semibold text-gray-900">Payments</p>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <p className="mt-1 text-xs text-gray-500">
          No fabricated payment figures are shown.
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-72 items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading verified payment lifecycle…
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section aria-labelledby="payments-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="payments-heading"
              className="text-3xl font-bold tracking-tight text-gray-950"
            >
              Payments
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {data.seasonLabel} · order payment health
            </p>
          </div>
          <p className="text-right text-xs text-gray-500">
            Verified through {data.asOf}
          </p>
        </div>

        <div className="mt-5 rounded-xl bg-[#ededed] p-6">
          <p className="text-sm font-semibold text-gray-900">Needs action</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950">
            {count.format(data.needsActionOrders)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            orders in payment decline · {money.format(data.declinedAmount)} declined
          </p>
        </div>
      </section>

      <section
        aria-label="Payment status figures"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          ['Recovered after decline', data.recoveredOrders],
          ['No payment activity', data.noActivityOrders],
          ['Paid', data.paidOrders]
        ].map(([label, value]) => (
          <article key={label as string} className="rounded-xl bg-[#ededed] p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
              {count.format(value as number)}
            </p>
          </article>
        ))}
      </section>

      <section aria-labelledby="lifecycle-heading">
        <div className="flex items-center gap-4">
          <h3 id="lifecycle-heading" className="text-lg font-semibold">
            Payment lifecycle
          </h3>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="mt-4 rounded-xl bg-[#ededed] p-5">
          <ul className="divide-y divide-white/70">
            {data.lifecycle.map((row) => (
              <li
                key={row.status}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-sm first:pt-0 last:pb-0"
              >
                <span className="text-gray-700">{row.label}</span>
                <span className="font-semibold text-gray-950">
                  {count.format(row.orders)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Service queue is held</p>
          <p className="mt-1 text-sm text-amber-900">
            Order-level payment detail appears only after rep identity mapping and
            the server row policy pass their access tests.
          </p>
        </div>
      </section>

      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer font-semibold text-gray-600">
          Source and release status
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {data.disclosures.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
