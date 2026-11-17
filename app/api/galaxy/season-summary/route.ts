import { NextResponse } from 'next/server';
import { authorizeGalaxySeason } from '@/lib/auth/galaxy-season-access';
import { loadGalaxySeason } from '@/lib/reports/galaxy-season';
import { ReportUnavailable } from '@/lib/server/databricks';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const access = authorizeGalaxySeason(request);
  if (!access.ok) return access.response;
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some((key) => !['season', 'refresh'].includes(key)))
    return NextResponse.json(
      { error: 'This aggregate report accepts a season and refresh only.' },
      { status: 400, headers }
    );
  try {
    return NextResponse.json(await loadGalaxySeason(params.get('season') ?? '26REG'), { headers });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Season Summary is unavailable. No substitute data is shown.',
        releaseState: 'HOLD',
        reason: error instanceof ReportUnavailable ? error.reason : 'source_request_failed'
      },
      { status: 503, headers }
    );
  }
}
