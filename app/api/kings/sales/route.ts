import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { kingsSalesConfiguration, loadKingsSales } from '@/lib/reports/kings-sales';
import { ReportUnavailable } from '@/lib/server/databricks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const access = authorizeApiRequest(request, ['LAK']);
  if (!access.ok) return access.response;
  const params = new URL(request.url).searchParams;
  try {
    if (params.get('status') === 'true' && params.size === 1) {
      kingsSalesConfiguration();
      return NextResponse.json({ configured: true }, { headers });
    }
    if ([...params.keys()].some((key) => key !== 'refresh'))
      return NextResponse.json({ error: 'Invalid report parameters.' }, { status: 400, headers });
    return NextResponse.json(await loadKingsSales(params.get('refresh') === 'true'), { headers });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Kings Ticket Sales is unavailable.',
        reason: error instanceof ReportUnavailable ? error.reason : 'source_request_failed'
      },
      { status: 503, headers }
    );
  }
}
