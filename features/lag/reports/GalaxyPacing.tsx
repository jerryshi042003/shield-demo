'use client';

import { DemoTerms } from '@/components/demo/DemoTerms';
import { useState } from 'react';
import Image from 'next/image';
import type { GalaxySeasonReport } from '@/lib/types/galaxy-season';
import { formatCompactUsd } from '@/lib/format/report-values';
import { DEMO_TODAY } from '@/lib/demo/viewer';

type Event = GalaxySeasonReport['events'][number];
const money = formatCompactUsd;

/** Illustrative curves only: invented pacing, anchored to the same synthetic report. */
export function GalaxyPacing({ events }: { events: Event[] }) {
  const upcoming = events.filter((event) => event.eventDate >= DEMO_TODAY);
  const [selection, setSelection] = useState('season');
  const game = upcoming.find((event) => event.eventCode === selection);
  const actual =
    game?.revenue ?? events.reduce((sum, event) => sum + event.revenue, 0);
  const goal = game?.goal ?? events.reduce((sum, event) => sum + event.goal, 0);
  const forecast = game ? goal * 0.94 : goal * 0.96;
  const labels = game
    ? ['60d', '45d', '30d', '21d', '14d', '7d', 'Kickoff']
    : ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const current = game ? 4 : 6;
  const actualCurve = game
    ? [0.2, 0.33, 0.48, 0.73, 1]
    : [0.21, 0.32, 0.44, 0.57, 0.71, 0.88, 1];
  const points = labels.map((label, index) => ({
    label,
    actual: index <= current ? actual * actualCurve[index] : null,
    target:
      goal *
      (game
        ? [0.18, 0.3, 0.44, 0.56, 0.68, 0.83, 1][index]
        : [0.18, 0.29, 0.42, 0.54, 0.68, 0.8, 0.9, 1][index])
  }));
  const width = 680,
    height = 225,
    left = 66,
    right = 18,
    top = 20,
    bottom = 32;
  const x = (index: number) =>
    left + (index * (width - left - right)) / (labels.length - 1);
  const y = (value: number) =>
    height - bottom - (value / goal) * (height - top - bottom);
  const path = (values: { index: number; value: number }[]) =>
    values
      .map(
        (point, index) =>
          `${index ? 'L' : 'M'}${x(point.index)},${y(point.value)}`
      )
      .join(' ');
  const actualPath = path(
    points.flatMap((point, index) =>
      point.actual === null ? [] : [{ index, value: point.actual }]
    )
  );
  const targetPath = path(
    points.map((point, index) => ({ index, value: point.target }))
  );
  const forecastPath = path([
    { index: current, value: actual },
    { index: labels.length - 1, value: forecast }
  ]);
  return (
    <section
      aria-labelledby="pacing-heading"
      className="min-w-0 border-t border-slate-200 py-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Image
            src="/lag-logo.png"
            alt="LA Galaxy"
            width={32}
            height={40}
            className="h-10 w-8 object-contain"
          />
          <h2 id="pacing-heading" className="text-lg font-semibold">
            Dana’s pacing
          </h2>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
          Fake demo data
        </span>
      </div>
      <DemoTerms terms={['pacing', 'forecast']} />
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Pacing scope"
      >
        {[
          { id: 'season', label: 'Season' },
          ...upcoming.map((event) => ({
            id: event.eventCode,
            label: event.opponent
          }))
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selection === option.id}
            onClick={() => setSelection(option.id)}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium transition-colors ${selection === option.id ? 'bg-[#102a50] text-white' : 'bg-slate-100 text-[#102a50] hover:bg-slate-200'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        {[
          ['Booked', actual],
          ['Demo forecast', forecast],
          ['Goal', goal]
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-xs text-slate-600">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums sm:text-2xl">
              {money(Number(value))}
            </dd>
          </div>
        ))}
      </dl>
      <div
        className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-700"
        aria-label="Chart legend"
      >
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-[#102a50]" />
          Booked
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-[#102a50]" />
          Demo forecast
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-[#a16b00]" />
          Goal pace
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 hidden w-full overflow-visible sm:block"
        role="img"
        aria-label={`Synthetic ${game ? game.opponent : 'season'} revenue pacing. Booked ${money(actual)}, demo forecast ${money(forecast)}, goal ${money(goal)}.`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <g key={fraction}>
            <line
              x1={left}
              x2={width - right}
              y1={y(goal * fraction)}
              y2={y(goal * fraction)}
              stroke="#e2e8f0"
            />
            <text
              x={left - 10}
              y={y(goal * fraction) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#475569"
            >
              {fraction === 0 ? '$0' : money(goal * fraction)}
            </text>
          </g>
        ))}
        <path d={targetPath} fill="none" stroke="#a16b00" strokeWidth="2" />
        <path
          d={forecastPath}
          fill="none"
          stroke="#102a50"
          strokeWidth="2.5"
          strokeDasharray="5 5"
        />
        <path
          d={actualPath}
          fill="none"
          stroke="#102a50"
          strokeWidth="3"
          className="pacing-line"
        />
        <circle cx={x(current)} cy={y(actual)} r="4" fill="#102a50" />
        {points.map((point, index) => (
          <text
            key={point.label}
            x={x(index)}
            y={height - 9}
            textAnchor="middle"
            fontSize="11"
            fill="#475569"
          >
            {point.label}
          </text>
        ))}
      </svg>
      <div className="mt-4 sm:hidden">
        <table className="w-full text-left text-xs tabular-nums">
          <caption className="sr-only">
            Synthetic revenue pacing by period
          </caption>
          <thead className="border-b border-slate-200 text-slate-600">
            <tr>
              <th className="py-2 font-medium">
                {game ? 'Days out' : 'Month'}
              </th>
              <th className="py-2 text-right font-medium">Booked</th>
              <th className="py-2 text-right font-medium">Goal pace</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr
                key={point.label}
                className={
                  index === current ? 'bg-slate-100 font-semibold' : ''
                }
              >
                <td className="py-2">{point.label}</td>
                <td className="py-2 text-right">
                  {point.actual === null ? '—' : money(point.actual)}
                </td>
                <td className="py-2 text-right">{money(point.target)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-600">
        <span>
          {game
            ? `${game.eventDate} · illustrative days-out curve`
            : '2026 · cumulative synthetic revenue'}
        </span>
        <span className="font-semibold text-[#102a50]">
          Forecast gap {money(goal - forecast)}
        </span>
      </div>
    </section>
  );
}
