import { NextResponse } from 'next/server';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { demoLegacy } from '@/lib/demo/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = authorizeApiRequest(request);
  if (!access.ok) return access.response;
  const legacy = demoLegacy(access.franchise);
  return NextResponse.json(
    legacy?.schedules ?? { franchise: access.franchise, seasons: [] },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
