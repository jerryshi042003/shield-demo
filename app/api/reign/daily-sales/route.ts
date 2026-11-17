import { NextResponse } from 'next/server';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { REIGN_DAILY_SALES_VERIFIED_SNAPSHOT } from '@/lib/contracts/reign-daily-sales';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const privateHeaders = { 'Cache-Control': 'private, no-store' };

function unavailable() {
  return NextResponse.json(
    {
      error: 'Reign Daily Sales is not released for this environment.',
      releaseState: 'HOLD',
      missing: ['governed_sales_snapshot']
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

  const snapshotEnabled =
    true;
  if (!snapshotEnabled) return unavailable();

  return NextResponse.json(REIGN_DAILY_SALES_VERIFIED_SNAPSHOT, {
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Shield-Data-Contract': 'reign-daily-sales-2627reg-byproduct-v1'
    }
  });
}
