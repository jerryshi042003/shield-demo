import { NextResponse } from 'next/server';
import type { Franchise } from '@/lib/franchise';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';

type ApiAuthorization =
  | {
      ok: true;
      franchise: Franchise;
      email: string;
    }
  | { ok: false; response: NextResponse };

/**
 * Demo API guard: resolves the franchise the visitor selected and keeps each
 * report on its own franchise, exactly as the production route contract does.
 */
export function authorizeApiRequest(
  request: Request,
  allowedFranchises?: readonly Franchise[]
): ApiAuthorization {
  const resolved = resolveFranchiseFromHeaders(request.headers);
  if (!resolved.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Choose a franchise to open this demo report.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    };
  }

  if (allowedFranchises && !allowedFranchises.includes(resolved.franchise)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'This report is not available for your franchise.' },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    };
  }

  return { ok: true, franchise: resolved.franchise, email: resolved.email };
}
