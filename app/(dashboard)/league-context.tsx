'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export type League = 'NHL' | 'AHL';

interface LeagueContextType {
  league: League;
  setLeague: (league: League) => void;
  toggleLeague: () => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [league, setLeagueState] = useState<League>('NHL');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize league - always NHL now (AHL removed)
  useEffect(() => {
    setLeagueState('NHL');
    setIsInitialized(true);

    // Remove any existing lg parameter from URL
    const urlLeague = searchParams.get('lg');
    if (urlLeague) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('lg');
      const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchParams]);

  const setLeague = (newLeague: League) => {
    setLeagueState(newLeague);
  };

  const toggleLeague = () => {
    // AHL removed - always stay on NHL
    setLeagueState('NHL');
  };

  // Provide fallback context values during initialization to avoid blocking render
  if (!isInitialized) {
    return (
      <LeagueContext.Provider value={{ league: 'NHL', setLeague: () => {}, toggleLeague: () => {} }}>
        {children}
      </LeagueContext.Provider>
    );
  }

  return (
    <LeagueContext.Provider value={{ league, setLeague, toggleLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
} 