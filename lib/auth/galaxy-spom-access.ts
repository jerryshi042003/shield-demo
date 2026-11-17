import 'server-only';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';

export type SpomActor = {
  audience: 'manager' | 'rep';
};

/**
 * Demo: every Galaxy visitor sees the manager view over fictional
 * representatives. Production scoped SPOM by signed-in role and identity.
 */
export function authorizeGalaxySpom(headers: Headers): SpomActor | null {
  const franchise = resolveFranchiseFromHeaders(headers);
  if (!franchise.ok || franchise.franchise !== 'LAG') return null;
  return { audience: 'manager' };
}
