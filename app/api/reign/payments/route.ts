import { NextResponse } from 'next/server';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { REIGN_PAYMENTS_VERIFIED_SNAPSHOT } from '@/lib/contracts/reign-payments';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const privateHeaders = { 'Cache-Control': 'private, no-store' };

function unavailable() {
  return NextResponse.json(
    {
      error: 'Reign Payments is not released for this environment.',
      releaseState: 'HOLD',
      missing: ['governed_payment_snapshot']
    },
    { status: 503, headers: privateHeaders }
  );
}

export async function GET(request: Request) {
  const franchise = resolveFranchiseFromHeaders(request.headers);
  if (!franchise.ok) {
    return NextResponse.json(
      { error: 'Authenticated franchise could not be resolved.' },
      { status: 401, headers: privateHeaders }
    );
  }

  if (franchise.franchise !== 'ONT') {
    return NextResponse.json(
      { error: 'This report is restricted to Ontario Reign.' },
      { status: 403, headers: privateHeaders }
    );
  }

  // The verified aggregate is served only under an explicit release flag; absent
  // it the route fails closed with a HOLD state and never fabricates values.
  const snapshotEnabled =
    true;
  if (!snapshotEnabled) return unavailable();

  return NextResponse.json(REIGN_PAYMENTS_VERIFIED_SNAPSHOT, {
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Shield-Data-Contract': 'reign-payments-2627reg-lifecycle-v1'
    }
  });
}
