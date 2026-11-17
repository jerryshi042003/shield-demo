import { useEffect, useRef, useState } from 'react';
import { useSection } from '../../app/(dashboard)/section-context';
import { useFranchise } from '../../app/(dashboard)/franchise-context';
import type { Section } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { marketingPath, overviewPath } from '@/lib/routes';
import {
  canAccessSection,
  getDefaultPathForFranchise,
  getVisibleSectionsForFranchise
} from '@/lib/franchise-navigation';
import { getSalesReportNavigation } from '@/lib/report-navigation';
import { emitReportNav } from '@/lib/telemetry/emit';

export function SectionTabs() {
  const { section } = useSection();
  const { franchise } = useFranchise();
  const router = useRouter();
  const [salesMenuOpen, setSalesMenuOpen] = useState(false);
  const salesMenuRef = useRef<HTMLDivElement | null>(null);

  const sections = getVisibleSectionsForFranchise(franchise).map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1)
  }));

  const salesReports = getSalesReportNavigation(franchise);

  const navigateToSection = (targetSection: Section) => {
    if (!canAccessSection(franchise, targetSection)) {
      router.push(getDefaultPathForFranchise(franchise), { scroll: false });
      return;
    }

    let path = overviewPath();
    if (targetSection === 'marketing') {
      path = marketingPath();
    } else if (targetSection === 'sales') {
      path = salesReports[0]?.href ?? getDefaultPathForFranchise(franchise);
    }

    router.push(path, { scroll: false });
  };

  useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      if (
        salesMenuRef.current &&
        !salesMenuRef.current.contains(event.target as Node)
      ) {
        setSalesMenuOpen(false);
      }
    };
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSalesMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeFromOutside);
    document.addEventListener('keydown', closeFromEscape);
    return () => {
      document.removeEventListener('pointerdown', closeFromOutside);
      document.removeEventListener('keydown', closeFromEscape);
    };
  }, []);

  return (
    <div role="tablist">
      <div className="flex items-center gap-6">
        {sections.map((sectionItem) => {
          const isActive = section === sectionItem.id;

          if (sectionItem.id === 'sales') {
            return (
              <div key={sectionItem.id} className="relative" ref={salesMenuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={salesMenuOpen}
                  onClick={() => setSalesMenuOpen((open) => !open)}
                  className={cn(
                    'capitalize border-b-2 rounded-none pb-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
                  )}
                >
                  Sales
                </button>

                {salesMenuOpen && (
                  <div
                    role="menu"
                    aria-label={`${franchise} sales reports`}
                    className="absolute left-0 top-full z-50 mt-1 min-w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg"
                  >
                    {salesReports.map((report) => (
                      <button
                        key={report.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          emitReportNav('sales', report.id);
                          router.push(report.href, { scroll: false });
                          setSalesMenuOpen(false);
                        }}
                        className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {report.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={sectionItem.id}
              type="button"
              onClick={() => navigateToSection(sectionItem.id as Section)}
              className={cn(
                'capitalize border-b-2 rounded-none pb-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
              )}
            >
              {sectionItem.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
