import { NextResponse } from 'next/server';
import type { Franchise } from '@/lib/franchise';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';

const privateHeaders = { 'Cache-Control': 'private, no-store' };

/**
 * Fail-closed response for a report whose governed source or access contract is
 * not yet accepted. It authorizes the trusted franchise (401 unauthenticated,
 * 403 wrong franchise) and then returns a 503 HOLD naming the exact missing
 * facts. It never returns data — there is nothing accepted to return.
 */
export function holdReportResponse(
  request: Request,
  franchise: Franchise,
  error: string,
  missing: string[]
) {
  const resolved = resolveFranchiseFromHeaders(request.headers);
  if (!resolved.ok) {
    return NextResponse.json(
      { error: 'Authenticated franchise could not be resolved.' },
      { status: 401, headers: privateHeaders }
    );
  }
  if (resolved.franchise !== franchise) {
    return NextResponse.json(
      { error: 'This report is not available for your franchise.' },
      { status: 403, headers: privateHeaders }
    );
  }
  return NextResponse.json(
    { error, releaseState: 'HOLD', missing },
    { status: 503, headers: privateHeaders }
  );
}
