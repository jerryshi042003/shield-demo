import { authorizeApiRequest } from '@/lib/auth/authorize-api';
import { askGet, askPost } from '@/lib/demo/ask-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const access = authorizeApiRequest(request, ['LAK']);
  if (!access.ok) return access.response;
  return askPost(request, 'kings-sales');
}

export async function GET(request: Request) {
  const access = authorizeApiRequest(request, ['LAK']);
  if (!access.ok) return access.response;
  return askGet(request, 'kings-sales');
}
