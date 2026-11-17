import { authorizeApiRequest } from '@/lib/auth/authorize-api';

/** Demo: the Galaxy aggregate report is open to the Galaxy franchise view. */
export function authorizeGalaxySeason(request: Request) {
  return authorizeApiRequest(request, ['LAG']);
}
