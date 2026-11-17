"use client";

import { Suspense } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LeagueProvider } from './league-context';
import { SectionProvider } from './section-context';
import { HeaderRegistryProvider } from './header-registry';
import { ReferenceSchedulesProvider } from './reference-schedules-context';
import { FranchiseProvider } from './franchise-context';
import type { Franchise } from '@/lib/franchise';

export default function Providers({
  children,
  franchise
}: {
  children: React.ReactNode;
  franchise: Franchise;
}) {
  return (
    <TooltipProvider>
      <Suspense fallback={null}>
        <FranchiseProvider franchise={franchise}>
          <SectionProvider>
            <LeagueProvider>
              <ReferenceSchedulesProvider>
                <HeaderRegistryProvider>
                  {children}
                </HeaderRegistryProvider>
              </ReferenceSchedulesProvider>
            </LeagueProvider>
          </SectionProvider>
        </FranchiseProvider>
      </Suspense>
    </TooltipProvider>
  );
}
