const usd = (options: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...options
  });

const exactUsd = usd({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wholeAwareUsd = (fractional: boolean) =>
  usd({
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: fractional ? 2 : 0
  });

/** Exact dollars and cents for reconciliation tables and SQL result details. */
export const formatExactUsd = (value: number) => exactUsd.format(value);

/** Whole dollars when exact, cents only when the source actually has them. */
export const formatReadableUsd = (value: number) =>
  wholeAwareUsd(!Number.isInteger(value)).format(value);

/** Compact decision-card value; detailed tables retain exact dollars and cents. */
export const formatCompactUsd = (value: number) =>
  usd({
    notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard',
    minimumFractionDigits:
      Math.abs(value) >= 1_000_000 ? 2 : Math.abs(value) >= 100_000 ? 1 : 0,
    maximumFractionDigits:
      Math.abs(value) >= 1_000_000 ? 2 : Math.abs(value) >= 100_000 ? 1 : 0
  }).format(value);

export const formatPercent = (fraction: number, digits = 1) =>
  `${(100 * fraction).toFixed(digits)}%`;

/** Genie may label either a 0–1 ratio or an already-scaled percentage as attainment. */
export const formatAnswerPercent = (value: number, digits = 1) =>
  Math.abs(value) > 1
    ? `${value.toFixed(digits)}%`
    : formatPercent(value, digits);
