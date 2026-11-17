/**
 * Persistent public-demo disclosure. Rendered from the root layout so it is on
 * every page, fixed to the bottom edge so it stays visible while scrolling.
 */
export function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Demo disclosure"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-semibold leading-5 text-amber-950 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] sm:text-sm"
    >
      Demo · synthetic data, no real people. Built by Jerry Shi.
    </div>
  );
}
