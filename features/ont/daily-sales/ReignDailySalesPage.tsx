'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ReignDailySalesData } from '@/lib/types/reign-daily-sales';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2
});

const count = new Intl.NumberFormat('en-US');

export default function ReignDailySalesPage() {
  const [data, setData] = useState<ReignDailySalesData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/reign/daily-sales', {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
      .then(async (response) => {
        const payload = (await response.json()) as
          | ReignDailySalesData
          | { error?: string };
        if (!response.ok) {
          throw new Error(
            'error' in payload && payload.error
              ? payload.error
              : 'Reign Daily Sales is unavailable.'
          );
        }
        setData(payload as ReignDailySalesData);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(
          cause instanceof Error
            ? cause.message
            : 'Reign Daily Sales is unavailable.'
        );
      });

    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <section className="rounded-xl border border-gray-200 bg-[#ededed] p-6">
        <p className="text-sm font-semibold text-gray-900">Daily Sales</p>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <p className="mt-1 text-xs text-gray-500">
          No fabricated sales figures are shown.
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-72 items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading verified sales…
      </div>
    );
  }

  const maxRevenue = Math.max(...data.byProduct.map((row) => row.netRevenue), 1);

  return (
    <div className="space-y-7">
      <section aria-labelledby="daily-sales-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="daily-sales-heading"
              className="text-3xl font-bold tracking-tight text-gray-950"
            >
              Daily Sales
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {data.seasonLabel} · net sales by product
            </p>
          </div>
          <p className="text-right text-xs text-gray-500">
            Verified through {data.asOf}
          </p>
        </div>

        <div className="mt-5 rounded-xl bg-[#ededed] p-6">
          <p className="text-4xl font-extrabold tracking-tight text-gray-950">
            {compactMoney.format(data.netRevenue)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            net item revenue · {count.format(data.activeItems)} active items ·{' '}
            {count.format(data.canceledItems)} cancellations
          </p>
        </div>
      </section>

      <section aria-labelledby="by-product-heading">
        <div className="flex items-center gap-4">
          <h3 id="by-product-heading" className="text-lg font-semibold">
            By product
          </h3>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div className="mt-4 rounded-xl bg-[#ededed] p-5">
          <div className="space-y-4">
            {data.byProduct.map((row) => (
              <div key={row.category}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold text-gray-900">
                    {row.category}
                  </span>
                  <span className="text-gray-600">
                    {money.format(row.netRevenue)} · {count.format(row.items)}{' '}
                    items
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#6366f1]"
                    style={{
                      width: `${Math.max((row.netRevenue / maxRevenue) * 100, row.netRevenue > 0 ? 2 : 0)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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
