'use client';

import { createContext, useContext } from 'react';
import type { Franchise } from '@/lib/franchise';

interface FranchiseContextValue {
  franchise: Franchise;
}

const FranchiseContext = createContext<FranchiseContextValue | undefined>(undefined);

export function FranchiseProvider({
  children,
  franchise
}: {
  children: React.ReactNode;
  franchise: Franchise;
}) {
  return <FranchiseContext.Provider value={{ franchise }}>{children}</FranchiseContext.Provider>;
}

export function useFranchise() {
  const context = useContext(FranchiseContext);
  if (!context) {
    throw new Error('useFranchise must be used within FranchiseProvider');
  }
  return context;
}
