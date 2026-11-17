import { normalizeFranchise, type Franchise } from '@/lib/franchise';
import { DEMO_FRANCHISES } from '@/lib/demo/viewer';

/**
 * Public demo: there is no sign-in or allowlist. Every visitor may switch
 * between Galaxy and Kings; the chosen franchise lives in this cookie.
 */
export const SUPERADMIN_FRANCHISE_COOKIE = 'shield_superadmin_franchise';
export const SUPERADMIN_ALLOWED_FRANCHISES: Franchise[] = DEMO_FRANCHISES;

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex <= 0) return acc;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (!key) return acc;

      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {});
}

export function getAllowedFranchisesForViewer(): Franchise[] {
  return SUPERADMIN_ALLOWED_FRANCHISES;
}

export function getSuperAdminSelectedFranchiseFromHeaders(
  headers: Headers
): Franchise | null {
  const rawCookie = headers.get('cookie') ?? '';
  const parsedCookies = parseCookieHeader(rawCookie);
  return normalizeFranchise(parsedCookies[SUPERADMIN_FRANCHISE_COOKIE]);
}
