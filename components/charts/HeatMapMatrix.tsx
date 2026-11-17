'use client';

import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export interface HeatMapCellValue {
  x: string;
  y: string;
  value: number;
  tickets?: number;
}

type HeatMapTooltipData =
  | {
      kind: 'cell';
      x: string;
      y: string;
      value: number;
      tickets: number;
    }
  | {
      kind: 'row';
      label: string;
      revenue: number;
      tickets: number;
    }
  | {
      kind: 'column';
      label: string;
      revenue: number;
      tickets: number;
    };

interface HeatMapMatrixProps {
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  xValues: string[];
  yValues: string[];
  cells: HeatMapCellValue[];
  valueLabel?: string;
  color?: string;
  minOpacity?: number;
  maxOpacity?: number;
  fillHeight?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '').trim();
  const safeHex = normalized.length === 3
    ? normalized.split('').map((c) => `${c}${c}`).join('')
    : normalized;
  const parsed = Number.parseInt(safeHex, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}

function buildColor(
  value: number,
  min: number,
  max: number,
  rgb: { r: number; g: number; b: number },
  minOpacity: number,
  maxOpacity: number
): string {
  if (max <= min) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${minOpacity})`;
  const normalized = (value - min) / (max - min);
  const alpha = minOpacity + normalized * (maxOpacity - minOpacity);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getTextColor(value: number, min: number, max: number): string {
  if (max <= min) return '#0f172a';
  const normalized = (value - min) / (max - min);
  return normalized > 0.58 ? '#ffffff' : '#0f172a';
}

export function HeatMapMatrix({
  title,
  subtitle,
  xLabel,
  yLabel,
  xValues,
  yValues,
  cells,
  valueLabel = 'Revenue',
  color = '#2563eb',
  minOpacity = 0.16,
  maxOpacity = 0.96,
  fillHeight = false
}: HeatMapMatrixProps) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<HeatMapTooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const cellMap = useMemo(() => {
    return new Map(cells.map((cell) => [`${cell.y}__${cell.x}`, cell]));
  }, [cells]);

  const [minValue, maxValue] = useMemo(() => {
    if (cells.length === 0) return [0, 0];
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const cell of cells) {
      if (cell.value < min) min = cell.value;
      if (cell.value > max) max = cell.value;
    }
    return [min, max];
  }, [cells]);

  const baseRgb = useMemo(() => hexToRgb(color), [color]);
  const rowTotals = useMemo(() => {
    const totals = new Map<string, { revenue: number; tickets: number }>();
    for (const yValue of yValues) {
      let revenue = 0;
      let tickets = 0;
      for (const xValue of xValues) {
        const cell = cellMap.get(`${yValue}__${xValue}`);
        if (!cell) continue;
        revenue += cell.value;
        tickets += cell.tickets ?? 0;
      }
      totals.set(yValue, { revenue, tickets });
    }
    return totals;
  }, [cellMap, xValues, yValues]);
  const columnTotals = useMemo(() => {
    const totals = new Map<string, { revenue: number; tickets: number }>();
    for (const xValue of xValues) {
      let revenue = 0;
      let tickets = 0;
      for (const yValue of yValues) {
        const cell = cellMap.get(`${yValue}__${xValue}`);
        if (!cell) continue;
        revenue += cell.value;
        tickets += cell.tickets ?? 0;
      }
      totals.set(xValue, { revenue, tickets });
    }
    return totals;
  }, [cellMap, xValues, yValues]);
  const containerClass = fillHeight
    ? 'rounded-lg border border-gray-200 bg-white p-3 h-full min-h-0 flex flex-col'
    : 'rounded-lg border border-gray-200 bg-white p-3';
  const matrixViewportClass = fillHeight
    ? 'relative min-h-0 flex-1 overflow-auto'
    : 'relative overflow-auto';

  const MatrixBody = (
    <div className={containerClass}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-gray-600">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-100"
          aria-label={expanded ? 'Collapse heat map' : 'Expand heat map'}
        >
          {expanded ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </button>
      </div>

      <div className={matrixViewportClass}>
        <div className="mb-2 flex justify-end pr-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {xLabel}
        </div>

        <div className="grid min-w-max gap-1" style={{ gridTemplateColumns: `150px repeat(${xValues.length}, minmax(98px, 1fr))` }}>
          <div className="flex items-end pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {yLabel}
          </div>
          {xValues.map((xValue) => (
            <div
              key={xValue}
              className="cursor-pointer px-1 pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600"
              onMouseEnter={(event) => {
                const totals = columnTotals.get(xValue) ?? { revenue: 0, tickets: 0 };
                setHoveredTooltip({
                  kind: 'column',
                  label: xValue,
                  revenue: totals.revenue,
                  tickets: totals.tickets
                });
                setTooltipPosition({ x: event.clientX + 14, y: event.clientY + 14 });
              }}
              onMouseMove={(event) => {
                setTooltipPosition({ x: event.clientX + 14, y: event.clientY + 14 });
              }}
              onMouseLeave={() => {
                setHoveredTooltip((prev) => (prev?.kind === 'column' && prev.label === xValue ? null : prev));
                setTooltipPosition(null);
              }}
            >
              {xValue}
            </div>
          ))}

          {yValues.map((yValue) => (
            <div key={yValue} className="contents">
              <div
                className="flex cursor-pointer items-center pr-2 text-sm font-medium text-gray-700"
                onMouseEnter={(event) => {
                  const totals = rowTotals.get(yValue) ?? { revenue: 0, tickets: 0 };
                  setHoveredTooltip({
                    kind: 'row',
                    label: yValue,
                    revenue: totals.revenue,
                    tickets: totals.tickets
                  });
                  setTooltipPosition({ x: event.clientX + 14, y: event.clientY + 14 });
                }}
                onMouseMove={(event) => {
                  setTooltipPosition({ x: event.clientX + 14, y: event.clientY + 14 });
                }}
                onMouseLeave={() => {
                  setHoveredTooltip((prev) => (prev?.kind === 'row' && prev.label === yValue ? null : prev));
                  setTooltipPosition(null);
                }}
              >
                {yValue}
              </div>
              {xValues.map((xValue) => {
                const cellKey = `${yValue}__${xValue}`;
                const cell = cellMap.get(cellKey) ?? { x: xValue, y: yValue, value: 0, tickets: 0 };
                const backgroundColor = buildColor(cell.value, minValue, maxValue, baseRgb, minOpacity, maxOpacity);
                const textColor = getTextColor(cell.value, minValue, maxValue);

                return (
                  <button
                    key={cellKey}
                    type="button"
                    className="h-14 rounded-md border border-white/40 px-1 text-xs font-semibold transition-colors duration-150 hover:brightness-105 focus:outline-none"
                    style={{ backgroundColor, color: textColor }}
                    onMouseEnter={(event) => {
                      setHoveredTooltip({
                        kind: 'cell',
                        x: cell.x,
                        y: cell.y,
                        value: cell.value,
                        tickets: cell.tickets ?? 0
                      });
                      setTooltipPosition({ x: event.clientX + 14, y: event.clientY + 14 });
                    }}
                    onMouseMove={(event) => {
                      setTooltipPosition({ x: event.clientX + 14, y: event.clientY + 14 });
                    }}
                    onMouseLeave={() => {
                      setHoveredTooltip((prev) => (prev?.kind === 'cell' && prev.x === xValue && prev.y === yValue ? null : prev));
                      setTooltipPosition(null);
                    }}
                    onFocus={() =>
                      setHoveredTooltip({
                        kind: 'cell',
                        x: cell.x,
                        y: cell.y,
                        value: cell.value,
                        tickets: cell.tickets ?? 0
                      })
                    }
                    onBlur={() => {
                      setHoveredTooltip((prev) => (prev?.kind === 'cell' && prev.x === xValue && prev.y === yValue ? null : prev));
                      setTooltipPosition(null);
                    }}
                    aria-label={`${yValue} x ${xValue}: ${formatCurrency(cell.value)} revenue`}
                  >
                    {formatCompactCurrency(cell.value)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-100" />
          Lower
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ml-2" />
          Higher
        </div>
        <div>
          {valueLabel} range: {formatCompactCurrency(minValue)} - {formatCompactCurrency(maxValue)}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {MatrixBody}

      {hoveredTooltip && tooltipPosition && (
        <div
          className="pointer-events-none fixed z-[100] max-w-xs rounded-md border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          {hoveredTooltip.kind === 'cell' ? (
            <>
              <div className="font-semibold text-slate-900">
                {hoveredTooltip.y} x {hoveredTooltip.x}
              </div>
              <div className="mt-1 text-slate-700">
                {valueLabel}: <span className="font-semibold text-slate-900">{formatCurrency(hoveredTooltip.value)}</span>
              </div>
              <div className="text-slate-700">
                Tickets: <span className="font-semibold text-slate-900">{hoveredTooltip.tickets.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-slate-900">
                {hoveredTooltip.kind === 'row' ? 'Product' : 'Price Level'}: {hoveredTooltip.label}
              </div>
              <div className="mt-1 text-slate-700">
                Total {valueLabel}: <span className="font-semibold text-slate-900">{formatCurrency(hoveredTooltip.revenue)}</span>
              </div>
              <div className="text-slate-700">
                Total Tickets: <span className="font-semibold text-slate-900">{hoveredTooltip.tickets.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}

      {expanded && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/55 p-4">
          <div className="max-h-[92vh] w-[96vw] max-w-[1400px] overflow-auto rounded-xl border border-slate-300 bg-slate-50 p-4 shadow-2xl sm:p-5">
            {MatrixBody}
          </div>
        </div>
      )}
    </>
  );
}
