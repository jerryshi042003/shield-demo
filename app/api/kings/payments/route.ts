import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import {
  KINGS_PAYMENTS_CONTRACT,
  kingsPaymentsConfiguration,
  loadKingsPayments
} from '@/lib/reports/kings-payments';
import { ReportUnavailable } from '@/lib/server/databricks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const privateHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const access = authorizeApiRequest(request, ['LAK']);
  if (!access.ok) return access.response;
  const params = new URL(request.url).searchParams;
  try {
    if (params.get('status') === 'true' && params.size === 1) {
      kingsPaymentsConfiguration();
      return NextResponse.json(
        { configured: true },
        { headers: privateHeaders }
      );
    }
    if ([...params.keys()].some((key) => key !== 'refresh'))
      return NextResponse.json(
        { error: 'Invalid report parameters.' },
        { status: 400, headers: privateHeaders }
      );
    return NextResponse.json(
      await loadKingsPayments(params.get('refresh') === 'true'),
      {
        headers: {
          ...privateHeaders,
          'X-Shield-Data-Contract': KINGS_PAYMENTS_CONTRACT
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Kings Payments is unavailable.',
        reason:
          error instanceof ReportUnavailable
            ? error.reason
            : 'source_request_failed'
      },
      { status: 503, headers: privateHeaders }
    );
  }
}
