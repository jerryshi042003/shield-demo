import { DemoTerms } from '@/components/demo/DemoTerms';
import { formatCompactUsd } from '@/lib/format/report-values';

// Invented campaign economics for the public portfolio; no external data source.
const campaigns = [
  {
    name: 'Next home match',
    channel: 'Paid social',
    spend: 12400,
    visits: 18200,
    orders: 418,
    revenue: 66880
  },
  {
    name: 'Season ticket renewals',
    channel: 'Email',
    spend: 1800,
    visits: 9400,
    orders: 156,
    revenue: 249600
  },
  {
    name: 'Family matchday',
    channel: 'Search',
    spend: 6800,
    visits: 7900,
    orders: 243,
    revenue: 38880
  }
];
export default function LagMarketingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-3 py-4 text-[#102a50] sm:px-6 sm:py-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Galaxy Marketing</h1>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
          Fake demo data · September 2026
        </span>
      </header>
      <DemoTerms terms={["attribution", "visits"]} />
      <dl className="grid grid-cols-2 gap-x-5 gap-y-6 border-y border-slate-200 py-5 sm:grid-cols-4">
        {[
          [
            'Attributed revenue',
            formatCompactUsd(campaigns.reduce((sum, c) => sum + c.revenue, 0))
          ],
          [
            'Campaign spend',
            formatCompactUsd(campaigns.reduce((sum, c) => sum + c.spend, 0))
          ],
          [
            'Orders',
            campaigns
              .reduce((sum, c) => sum + c.orders, 0)
              .toLocaleString('en-US')
          ],
          [
            'Visits',
            campaigns
              .reduce((sum, c) => sum + c.visits, 0)
              .toLocaleString('en-US')
          ]
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-slate-600">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="campaigns-heading">
        <h2 id="campaigns-heading" className="text-lg font-semibold">
          Campaigns
        </h2>
        <div className="mt-3 divide-y divide-slate-200">
          {campaigns.map((c) => (
            <article
              key={c.name}
              className="grid gap-4 py-5 sm:grid-cols-[1.2fr_2fr]"
            >
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{c.channel}</p>
              </div>
              <dl className="grid grid-cols-3 gap-3 text-sm tabular-nums">
                {[
                  ['Revenue', formatCompactUsd(c.revenue)],
                  ['Spend', formatCompactUsd(c.spend)],
                  ['Orders', c.orders.toLocaleString('en-US')]
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-600">{label}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
