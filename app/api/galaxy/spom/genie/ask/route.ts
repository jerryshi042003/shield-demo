import { NextResponse } from 'next/server';
import { authorizeGalaxySpom } from '@/lib/auth/galaxy-spom-access';
import { askGet, askPost } from '@/lib/demo/ask-route';
import { SPOM_DEFAULT_MONTH } from '@/lib/demo/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };

function scope(request: Request) {
  const actor = authorizeGalaxySpom(request.headers);
  if (!actor)
    return {
      response: NextResponse.json(
        { error: 'SPOM is available in the Galaxy demo view.' },
        { status: 403, headers }
      )
    };
  const month = new URL(request.url).searchParams.get('month') ?? SPOM_DEFAULT_MONTH;
  return { month };
}

export async function POST(request: Request) {
  const resolved = scope(request);
  if ('response' in resolved) return resolved.response;
  return askPost(request, 'galaxy-spom', resolved.month);
}

export async function GET(request: Request) {
  const resolved = scope(request);
  if ('response' in resolved) return resolved.response;
  return askGet(request, 'galaxy-spom', resolved.month);
}
