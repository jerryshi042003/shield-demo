import type { Franchise } from '@/lib/franchise';
import type { AuthUser } from '@/lib/types/auth-user';

/**
 * Public demo identity. There is no sign-in: every visitor is this obviously
 * fictional viewer and may open Galaxy or Kings. Production Shield
 * resolved identity, franchise and report roles from company sign-in instead.
 */
export const DEMO_FRANCHISES: Franchise[] = ['LAG', 'LAK'];

export const DEMO_VIEWER: AuthUser = {
  firstName: 'Demo',
  fullName: 'Demo Viewer',
  email: 'viewer@shield-demo.invalid',
  isSuperAdmin: true,
  allowedFranchises: DEMO_FRANCHISES
};

/** Fixed "today" for the synthetic fixtures, so upcoming games stay upcoming. */
export const DEMO_TODAY = '2026-10-01';
