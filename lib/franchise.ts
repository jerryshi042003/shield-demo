export const FRANCHISES = ['LAK', 'LAG', 'ONT'] as const;

export type Franchise = (typeof FRANCHISES)[number];

export function isFranchise(value: string | null | undefined): value is Franchise {
  if (!value) return false;
  return (FRANCHISES as readonly string[]).includes(value.trim().toUpperCase());
}

export function normalizeFranchise(value: string | null | undefined): Franchise | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  return isFranchise(upper) ? upper : null;
}
