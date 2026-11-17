import { LockKeyhole } from 'lucide-react';

type ReportHoldPageProps = {
  title: string;
  context: string;
  summary: string;
  missing: string[];
};

/**
 * Honest fail-closed surface for a report whose governed source or access
 * contract is not yet accepted. It shows no metrics — only the held state and
 * the exact facts that are missing before it can release.
 */
export function ReportHoldPage({
  title,
  context,
  summary,
  missing
}: ReportHoldPageProps) {
  return (
    <div className="space-y-7">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-gray-950">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{context}</p>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">This report is held</p>
          <p className="mt-1 max-w-2xl text-sm text-amber-900">{summary}</p>
        </div>
      </section>

      <section className="rounded-xl bg-[#ededed] p-5">
        <p className="text-sm font-semibold text-gray-950">
          Required before release
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
          {missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-500">
          No metrics are shown until these are accepted. Continue to use the
          current source of record in the meantime.
        </p>
      </section>
    </div>
  );
}
