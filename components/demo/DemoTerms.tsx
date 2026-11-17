import { DEMO_TERMS, type DemoTerm } from '@/lib/demo/terms';

/** Essential definitions are visible; less common terms use native disclosure. */
export function DemoTerms({
  terms,
  visible = 3
}: {
  terms: DemoTerm[];
  visible?: number;
}) {
  const definitions = (keys: DemoTerm[]) => (
    <dl className="max-w-[75ch] space-y-2 text-sm leading-relaxed text-slate-600">
      {keys.map((key) => (
        <div key={key}>
          <dt className="inline font-semibold text-[#102a50]">
            {DEMO_TERMS[key].label}.{' '}
          </dt>
          <dd className="inline">{DEMO_TERMS[key].definition}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <section aria-label="Report terms explained" className="min-w-0 py-2">
      {definitions(terms.slice(0, visible))}
      {terms.length > visible && (
        <details className="mt-3 text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-[#102a50]">
            More report terms explained
          </summary>
          <div className="mt-3">{definitions(terms.slice(visible))}</div>
        </details>
      )}
    </section>
  );
}
