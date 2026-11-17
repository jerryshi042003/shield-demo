import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { kpiRecordFor } from '@/lib/demo/kpi';

export const dynamic = 'force-dynamic';

type ResponseType = 'dashboard' | 'overview' | 'sales' | 'marketing';

function parseResponseType(value: string | null): ResponseType {
  if (value === 'sales') return 'sales';
  if (value === 'marketing') return 'marketing';
  if (value === 'overview') return 'overview';
  return 'dashboard';
}

export async function GET(request: Request) {
  const access = authorizeApiRequest(request, ['LAK']);
  if (!access.ok) return access.response;
  const { searchParams } = new URL(request.url);
  const responseType = parseResponseType(searchParams.get('type'));
  const record = kpiRecordFor(searchParams.get('date'));
  return NextResponse.json(
    {
      ...record,
      _meta: {
        date: record.date,
        lastUpdated: record.last_updated,
        source: 'demo-synthetic-fixtures',
        responseType,
        missingEngagementFields: [],
        hasCompleteEngagementData: true
      }
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  );
}
