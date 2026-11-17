import type { Franchise } from '@/lib/franchise';
import { getSuperAdminSelectedFranchiseFromHeaders } from '@/lib/auth/superadmin';
import { DEMO_FRANCHISES, DEMO_VIEWER } from '@/lib/demo/viewer';

type ResolveSuccess = {
  ok: true;
  franchise: Franchise;
  source: 'demo_selection';
  email: string;
};

type ResolveFailure = {
  ok: false;
  reason: 'superadmin_selection_required';
  email: string;
  domain: null;
};

export type ResolveFranchiseResult = ResolveSuccess | ResolveFailure;

/**
 * Public demo franchise resolution. Production Shield trusted only signed-in
 * identity headers; the demo has no sign-in, so the franchise is whatever the
 * visitor picked on the chooser (a cookie). No data is person-scoped.
 */
export function resolveFranchiseFromHeaders(
  headers: Headers
): ResolveFranchiseResult {
  const saved = getSuperAdminSelectedFranchiseFromHeaders(headers);
  const selected = saved && DEMO_FRANCHISES.includes(saved) ? saved : 'LAG';
  return {
    ok: true,
    franchise: selected,
    source: 'demo_selection',
    email: DEMO_VIEWER.email
  };
}
