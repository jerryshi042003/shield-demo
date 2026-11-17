import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { status: 'healthy', demo: true, data: 'synthetic fixtures', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-cache' } }
  );
}
