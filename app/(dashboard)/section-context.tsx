'use client';

import { createContext, useContext, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type Section } from '@/lib/constants';
import { useFranchise } from './franchise-context';
import {
  defaultSalesSeasonPath,
  marketingPath,
  overviewPath,
  sectionFromPathname
} from '@/lib/routes';
import { canAccessSection, getDefaultPathForFranchise } from '@/lib/franchise-navigation';

interface SectionContextType {
  section: Section;
  setSection: (section: Section) => void;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { franchise } = useFranchise();
  const section = sectionFromPathname(pathname);

  const value = useMemo<SectionContextType>(
    () => ({
      section,
      setSection: (nextSection: Section) => {
        if (nextSection === section) return;
        if (!canAccessSection(franchise, nextSection)) {
          router.push(getDefaultPathForFranchise(franchise), { scroll: false });
          return;
        }

        if (nextSection === 'overview') {
          router.push(overviewPath(), { scroll: false });
          return;
        }

        if (nextSection === 'sales') {
          router.push(defaultSalesSeasonPath(), { scroll: false });
          return;
        }

        if (nextSection === 'marketing') {
          router.push(marketingPath(), { scroll: false });
          return;
        }

        router.push(getDefaultPathForFranchise(franchise), { scroll: false });
      }
    }),
    [franchise, router, section]
  );

  return <SectionContext.Provider value={value}>{children}</SectionContext.Provider>;
}

export function useSection() {
  const context = useContext(SectionContext);
  if (!context) throw new Error('useSection must be used within SectionProvider');
  return context;
}
