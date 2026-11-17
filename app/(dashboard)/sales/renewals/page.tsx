import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { resolveFranchiseFromHeaders } from '@/lib/auth/resolve-franchise';
import { defaultSalesSeasonPath } from '@/lib/routes';
import { ReportHoldPage } from '@/features/shared/report-hold/ReportHoldPage';
import { GALAXY_POWER_BI_REPORTS } from '@/lib/reports/galaxy-powerbi';

export const dynamic = 'force-dynamic';

export default async function RenewalsPage() {
  const franchiseResult = resolveFranchiseFromHeaders(await headers());
  if (!franchiseResult.ok) {
    if (franchiseResult.reason === 'superadmin_selection_required') {
      redirect('/select-franchise');
    }
    notFound();
  }

  // Renewals appears in both the Galaxy and Kings canvas navigation. Galaxy's
  // released Power BI model now proves the metric definitions and raw Gold
  // inputs, but the query is still embedded in the PBIX and has no RLS. Keep
  // Shield fail-closed until that logic and its principal scope are maintained.
  const franchise = franchiseResult.franchise;
  if (franchise !== 'LAG' && franchise !== 'LAK') {
    redirect(defaultSalesSeasonPath());
  }

  if (franchise === 'LAG') {
    return (
      <div className="mx-auto max-w-6xl space-y-5 py-6 text-[#102a50]">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Galaxy / Sales
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Renewals
          </h1>
        </header>
        <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
          <p className="font-semibold">Renewal tracking remains in Power BI</p>
          <p className="mt-2 text-sm text-slate-600">
            The current definitions are verified. Shield is waiting for the
            embedded Power BI query to become a maintained Gold contract and
            for Account Manager access to be enforced by signed-in identity.
          </p>
          <a
            href={GALAXY_POWER_BI_REPORTS.renewals.url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-lg bg-[#102a50] px-4 py-2 text-sm font-semibold text-white"
          >
            Open {GALAXY_POWER_BI_REPORTS.renewals.name}
          </a>
        </section>
      </div>
    );
  }

  return (
    <ReportHoldPage
      title="Renewals"
      context="Kings renewal tracking · not yet available"
      summary="Renewal tracking stays in the current Power BI Renewal Tracker. There is no governed Gold renewal model in the warehouse yet, so Shield shows no renewal metrics rather than restating an ungoverned source."
      missing={[
        'A governed Gold renewal model (none exists in the warehouse today)',
        'Accepted eligibility, status, and goal definitions for renewal',
        'Reader and cadence acceptance from the renewal owners'
      ]}
    />
  );
}
