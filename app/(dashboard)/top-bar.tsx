'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { User } from './user';
import { SearchInput } from './search';
import { useLeague } from './league-context';
import { useSection } from './section-context';
import { useFranchise } from './franchise-context';
import { safeNavigate } from '@/utils/navigation';
import { SectionTabs } from '@/components/navigation/SectionTabs';
import { AppLogo } from '@/components/ui/AppLogo';
import type { AuthUser } from '@/lib/types/auth-user';
import { getDefaultPathForFranchise, getDefaultSectionForFranchise, getVisibleSectionsForFranchise } from '@/lib/franchise-navigation';
import { getSalesReportNavigation } from '@/lib/report-navigation';
import { emitReportNav } from '@/lib/telemetry/emit';
import { cn } from '@/lib/utils';

function MobileNav() {
  const router = useRouter();
  const { setLeague } = useLeague();
  const { section, setSection } = useSection();
  const { franchise } = useFranchise();
  const [open, setOpen] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(section === 'sales');
  const visibleSections = getVisibleSectionsForFranchise(franchise);
  const defaultSection = getDefaultSectionForFranchise(franchise);
  const salesReports = getSalesReportNavigation(franchise);

  const navigateToSection = (sectionName: (typeof visibleSections)[number]) => {
    setOpen(false);
    setSection(sectionName);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <SheetHeader>
          <SheetTitle className="sr-only">Main Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate between Shield sections and reports.
          </SheetDescription>
        </SheetHeader>
        <button
          onClick={() => {
            setLeague('NHL');
            setOpen(false);
            setSection(defaultSection);
          }}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        >
          <AppLogo width={60} height={60} />
        </button>
        <nav className="grid gap-4 text-lg font-medium">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Sections
          </div>
          {visibleSections.map((sectionName) => {
            if (sectionName === 'sales') {
              return (
                <div key={sectionName}>
                  <button
                    type="button"
                    aria-expanded={salesExpanded}
                    aria-controls="mobile-sales-reports"
                    onClick={() => setSalesExpanded((expanded) => !expanded)}
                    className={`flex w-full items-center gap-4 rounded-lg px-2.5 py-2 text-left capitalize transition-colors ${
                      section === sectionName
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    Sales
                  </button>
                  {salesExpanded && (
                    <div
                      id="mobile-sales-reports"
                      aria-label={`${franchise} sales reports`}
                      className="ml-4 mt-2 grid gap-1 border-l border-gray-200 pl-3"
                    >
                      {salesReports.map((report) => (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => {
                            emitReportNav('sales', report.id);
                            setOpen(false);
                            router.push(report.href, { scroll: false });
                          }}
                          className="rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
                key={sectionName}
                onClick={() => navigateToSection(sectionName)}
                className={`flex items-center gap-4 px-2.5 py-2 rounded-lg transition-colors text-left capitalize ${
                  section === sectionName
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {sectionName}
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function TopBar({ user }: { user: AuthUser }) {
  const { setLeague } = useLeague();
  const { section } = useSection();
  const { franchise } = useFranchise();
  const isGalaxy = franchise === 'LAG';
  
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-4 border-b bg-background px-4 md:px-6',
        isGalaxy ? 'h-16' : 'h-20'
      )}
    >
      {/* Logo */}
      <button
        onClick={() => {
          setLeague('NHL');
          safeNavigate(getDefaultPathForFranchise(franchise));
        }}
        className="flex items-center gap-2 text-sm font-bold hover:opacity-80 transition-opacity"
      >
        <AppLogo width={isGalaxy ? 34 : 60} height={isGalaxy ? 34 : 60} />
        {isGalaxy ? <span className="hidden sm:inline">Shield</span> : null}
      </button>

      {/* Desktop Navigation - League Filter + Section Tabs */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium">

        
        <SectionTabs />
      </nav>

      {/* Right side items */}
      <div className="ml-auto flex items-center gap-4">
        {isGalaxy ? null : <SearchInput />}
        <User
          firstName={user.firstName}
          fullName={user.fullName}
          email={user.email}
          isSuperAdmin={user.isSuperAdmin}
          allowedFranchises={user.allowedFranchises}
          showGreeting={section === 'overview'}
          showInlineIdentity={isGalaxy}
        />
        <MobileNav />
      </div>
    </header>
  );
} 
