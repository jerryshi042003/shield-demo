'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSection } from './section-context';
import { useLeague } from './league-context';
import { useFranchise } from './franchise-context';
import { useHeaderRegistry } from './header-registry';
import { getAllSearchableItems, groupSearchResults, SearchableItemConfig } from '@/config/searchable-items';
import {
  defaultSalesGamePath,
  defaultSalesSeasonPath,
  marketingPath,
  salesAnalysisPath
} from '@/lib/routes';
import { canAccessSection, getDefaultPathForFranchise } from '@/lib/franchise-navigation';

// Extended type that includes optional 'name' for backwards compat
type SearchableItem = SearchableItemConfig & { name?: string };
import { logSilentError } from '@/lib/utils/logger';

// Static search index as fallback when sections are unmounted
// This ensures search works immediately on page load and during transitions
// Now powered by centralized config to prevent sync issues
const STATIC_SEARCH_INDEX: SearchableItem[] = getAllSearchableItems().map(item => ({
  ...item,
  name: item.displayName
}));

export function SearchInput() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchableItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { section } = useSection();
  const { league } = useLeague();
  const { franchise } = useFranchise();
  const { getVisibleHeaders } = useHeaderRegistry();
  const router = useRouter();

  const getSalesViewForItem = (itemId: string): 'season' | 'game' | 'analysis' => {
    if (
      itemId === 'game-center-selector' ||
      itemId === 'game-center-kpis' ||
      itemId === 'game-center-pacing' ||
      itemId === 'game-center-price-levels' ||
      itemId === 'game-center-channel-mix' ||
      itemId === 'game-center-ancillary-products'
    ) {
      return 'game';
    }
    if (itemId === 'game-summary') return 'analysis';
    if (
      itemId === 'season-center-selector' ||
      itemId === 'season-center-kpis' ||
      itemId === 'season-center-pacing' ||
      itemId === 'season-center-price-levels' ||
      itemId === 'season-center-channel-mix' ||
      itemId === 'season-center-ancillary-products' ||
      itemId === 'recent-games' ||
      itemId === 'next-game'
    ) {
      return 'season';
    }
    return 'season';
  };

  const navigateToItemSection = (item: SearchableItem) => {
    if (!canAccessSection(franchise, item.section)) {
      router.push(getDefaultPathForFranchise(franchise), { scroll: false });
      return;
    }

    if (item.section === 'sales') {
      const salesView = getSalesViewForItem(item.id);
      if (salesView === 'analysis') {
        router.push(salesAnalysisPath(), { scroll: false });
        return;
      }
      if (salesView === 'game') {
        router.push(defaultSalesGamePath(), { scroll: false });
        return;
      }
      router.push(defaultSalesSeasonPath(), { scroll: false });
      return;
    }

    if (item.section === 'marketing') {
      router.push(marketingPath(), { scroll: false });
      return;
    }

    router.push(getDefaultPathForFranchise(franchise), { scroll: false });
  };

  // Merge static and dynamic search items for comprehensive coverage
  const allSearchableItems = useMemo(() => {
    const dynamicHeaders = getVisibleHeaders();

    // Convert dynamic headers to SearchableItem format
    const dynamicItems: SearchableItem[] = dynamicHeaders.map(header => ({
      id: header.id,
      name: header.displayName,
      displayName: header.displayName,
      section: header.section,
      type: header.type === 'section' ? 'card' : header.type as ('card' | 'graph'),
      keywords: [],
      priority: header.priority ?? 0
    }));

    // Merge static and dynamic items, prioritizing dynamic (for up-to-date data)
    const dynamicIds = new Set(dynamicItems.map(item => item.id));
    const staticItemsNotInDynamic = STATIC_SEARCH_INDEX.filter(
      item => !dynamicIds.has(item.id)
    );

    const merged = [...dynamicItems, ...staticItemsNotInDynamic].filter((item) =>
      canAccessSection(franchise, item.section)
    );

    // Sort by priority (higher priority first) for better search ranking
    return merged.sort((a, b) => {
      const aPriority = dynamicHeaders.find(h => h.id === a.id)?.priority ?? a.priority;
      const bPriority = dynamicHeaders.find(h => h.id === b.id)?.priority ?? b.priority;
      return bPriority - aPriority;
    });
  }, [franchise, getVisibleHeaders]);

  // Check if an element is in viewport
  const isInViewport = (elementId: string): boolean => {
    const element = document.getElementById(elementId);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth
    );
  };

  // Simplified scroll function with single smooth scroll
  const scrollToItem = (itemId: string) => {
    const element = document.getElementById(itemId);

    if (!element) {
      logSilentError(`Search target not found: ${itemId}`, undefined, { component: 'search.scrollToItem' });
      return;
    }

    // Calculate position with header offset
    const headerOffset = 100; // Fixed header (80px) + padding (20px)
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;

    // Single smooth scroll - no conflicting animations
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });

    // Find the header/title element within the section to highlight
    const header = element.querySelector('h1, h2, h3, .section-title, [class*="font-semibold"]') as HTMLElement | null;
    const targetElement = header ?? element;

    // Add highlight class after scroll animation completes (~500ms)
    setTimeout(() => {
      targetElement.classList.add('search-highlight');
      setTimeout(() => {
        targetElement.classList.remove('search-highlight');
      }, 1500);
    }, 500);
  };

  // Custom search function using dynamic items
  const searchDynamicItems = (searchQuery: string): SearchableItem[] => {
    if (!searchQuery.trim()) return [];

    const lowerQuery = searchQuery.toLowerCase();

    return allSearchableItems
      .filter(item =>
        item.displayName.toLowerCase().includes(lowerQuery) ||
        (item.name?.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.displayName.toLowerCase() === lowerQuery;
        const bExact = b.displayName.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then prioritize prefix matches
        const aPrefix = a.displayName.toLowerCase().startsWith(lowerQuery);
        const bPrefix = b.displayName.toLowerCase().startsWith(lowerQuery);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;

        // Then prioritize current section
        const aCurrent = a.section === section;
        const bCurrent = b.section === section;
        if (aCurrent && !bCurrent) return -1;
        if (!aCurrent && bCurrent) return 1;

        return 0;
      });
      // No limit - show all matching results
  };

  // Custom top suggestions using dynamic items
  const getDynamicTopSuggestions = (): SearchableItem[] => {
    // Show all items, prioritizing current section first
    const currentSectionItems = allSearchableItems.filter(item => item.section === section);
    const otherItems = allSearchableItems.filter(item => item.section !== section);

    // Return all items (current section first, then others)
    return [...currentSectionItems, ...otherItems];
  };

  useEffect(() => {
    if (query.trim()) {
      // Use dynamic search that includes both static and dynamic headers
      const results = searchDynamicItems(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, allSearchableItems, section]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFocus = () => {
    if (!query.trim()) {
      // Use dynamic top suggestions
      const topItems = getDynamicTopSuggestions();
      setSuggestions(topItems);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (item: SearchableItem) => {
    const targetElement = document.getElementById(item.id);
    const needsSalesSubviewNavigation = item.section === 'sales' && section === 'sales' && !targetElement;

    if (needsSalesSubviewNavigation) {
      navigateToItemSection(item);
      setQuery('');
      setTimeout(() => {
        scrollToItem(item.id);
      }, 600);
      setShowSuggestions(false);
      inputRef.current?.blur();
      return;
    }

    // Check if item is on current page and already visible
    const isCurrentPage = item.section === section;
    const isVisible = isCurrentPage && isInViewport(item.id);

    // Don't do anything if item is already visible
    if (isVisible) {
      setShowSuggestions(false);
      inputRef.current?.blur();
      return;
    }

    if (isCurrentPage) {
      // Same page - minimal delay for DOM updates
      setQuery('');
      setTimeout(() => {
        scrollToItem(item.id);
      }, 100);
    } else {
      // Different section - wait for section transition to complete
      // AnimatePresence timing: 250ms exit + 250ms enter + 100ms buffer = 600ms
      navigateToItemSection(item);
      setQuery('');

      setTimeout(() => {
        scrollToItem(item.id);
      }, 600);
    }

    // Clear suggestions and blur
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleInputBlur = () => {
    // Delay hiding to allow suggestion clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Render search results with improved UI and grouping
  const renderSearchResults = (items: SearchableItem[]) => {
    if (items.length <= 4) {
      // Simple list for small results
      return (
        <ul className="py-1">
          {items.map((item, index) => renderSearchItem(item, index))}
        </ul>
      );
    } else {
      // Always group results for better organization
      const groupedResults = groupSearchResults(items);
      
      return (
        <div className="py-1">
          {groupedResults.map((group, groupIndex) => (
            <div key={group.section}>
              {groupIndex > 0 && <div className="border-t my-1" />}
              <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/30">
                {group.section}
              </div>
              <ul>
                {group.items.map((item, itemIndex) => renderSearchItem(item, `${group.section}-${itemIndex}`))}
              </ul>
            </div>
          ))}

        </div>
      );
    }
  };

  // Render individual search item
  const renderSearchItem = (item: SearchableItem, key: string | number) => {
    const isCurrentSection = item.section === section;
    const isVisible = isCurrentSection && isInViewport(item.id);

    // Determine label
    let label = '';

    if (isVisible) {
      label = 'visible';
    } else if (isCurrentSection) {
      // Same section but not visible - show section name
      label = section.charAt(0).toUpperCase() + section.slice(1);
    }

    return (
      <li key={key}>
        {isVisible ? (
          // Items already visible in viewport - unclickable with grey background
          <div className="w-full px-3 py-2 text-sm bg-muted/50 border-l-2 border-muted text-muted-foreground cursor-not-allowed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">
                    {item.displayName}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground/60">
                {label}
              </span>
            </div>
          </div>
        ) : isCurrentSection ? (
          // Same section but not visible - clickable to scroll to it
          <button
            onClick={() => handleSuggestionClick(item)}
            className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span>{item.displayName}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                {label}
              </span>
            </div>
          </button>
        ) : (
          // Different section items - clickable for navigation
          <button
            onClick={() => handleSuggestionClick(item)}
            className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span>{item.displayName}</span>
                </div>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
            </div>
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="relative ml-auto flex-1 md:grow-0">
      <Search className="absolute left-2.5 top-[.75rem] h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleInputBlur}
        type="search"
        placeholder="Search..."
        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
      />
      
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50"
          >
            <div className="bg-popover border rounded-lg shadow-lg overflow-hidden">
              {suggestions.length > 0 ? (
                <>
                  {!query.trim() && (
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 border-b">
                      Currently: {league} {section.charAt(0).toUpperCase() + section.slice(1)}
                    </div>
                  )}
                  {renderSearchResults(suggestions)}
                </>
              ) : query.trim() && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No results found for your access level
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
