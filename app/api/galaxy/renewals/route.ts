import { holdReportResponse } from '@/lib/reports/hold-response';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET(request: Request) {
  return holdReportResponse(
    request,
    'LAG',
    'Galaxy Renewals is not released for this environment.',
    [
      'governed_gold_renewal_contract',
      'renewal_principal_scope',
      'powerbi_parity_acceptance'
    ]
  );
}
