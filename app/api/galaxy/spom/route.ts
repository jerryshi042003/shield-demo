import { NextResponse } from 'next/server';
import { authorizeGalaxySpom } from '@/lib/auth/galaxy-spom-access';
import { loadGalaxySpom } from '@/lib/reports/galaxy-spom';
import { ReportUnavailable } from '@/lib/server/databricks';
import { SPOM_DEFAULT_MONTH } from '@/lib/demo/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const privateHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const actor = authorizeGalaxySpom(request.headers);
  if (!actor)
    return NextResponse.json(
      { error: 'SPOM is available in the Galaxy demo view.' },
      { status: 403, headers: privateHeaders }
    );
  const query = new URL(request.url).searchParams;
  if ([...query.keys()].some((k) => k !== 'month') || query.getAll('month').length > 1)
    return NextResponse.json(
      { error: 'Only the payment month can be selected.' },
      { status: 400, headers: privateHeaders }
    );
  try {
    return NextResponse.json(
      await loadGalaxySpom(actor, query.get('month') ?? SPOM_DEFAULT_MONTH),
      { headers: privateHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'SPOM is unavailable for this month.',
        reason: error instanceof ReportUnavailable ? error.reason : 'report_unavailable'
      },
      { status: 503, headers: privateHeaders }
    );
  }
}
