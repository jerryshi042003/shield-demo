import { holdReportResponse } from '@/lib/reports/hold-response';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET(request: Request) {
  return holdReportResponse(
    request,
    'LAG',
    'Galaxy Commissions is not released for this environment.',
    ['accepted_audience_and_decision', 'identity_mapping', 'server_row_policy']
  );
}
