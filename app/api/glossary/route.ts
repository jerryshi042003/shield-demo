import { NextResponse } from 'next/server';
import overview from '@/data/glossary-templates/overview.json';
import sales from '@/data/glossary-templates/sales.json';
import marketing from '@/data/glossary-templates/marketing.json';
import { authorizeApiRequest } from '@/lib/auth/authorize-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const access = authorizeApiRequest(request);
  if (!access.ok) return access.response;
  return NextResponse.json(
    { overview, sales, marketing, social: [] },
    { headers: { 'Cache-Control': 'private, max-age=600' } }
  );
}
