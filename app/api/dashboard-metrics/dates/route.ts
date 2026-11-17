import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { kpiRecords } from '@/lib/demo/kpi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = authorizeApiRequest(request, ['LAK']);
  if (!access.ok) return access.response;
  const dates = kpiRecords().map((record) => record.date);
  return NextResponse.json(
    {
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      totalDates: dates.length,
      availableDates: dates
    },
    { headers: { 'Cache-Control': 'private, max-age=600' } }
  );
}
