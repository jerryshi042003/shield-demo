import { authorizeGalaxySeason } from '@/lib/auth/galaxy-season-access';
import { askGet, askPost } from '@/lib/demo/ask-route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const access = authorizeGalaxySeason(request);
  if (!access.ok) return access.response;
  return askPost(request, 'galaxy-season');
}

export async function GET(request: Request) {
  const access = authorizeGalaxySeason(request);
  if (!access.ok) return access.response;
  return askGet(request, 'galaxy-season');
}
