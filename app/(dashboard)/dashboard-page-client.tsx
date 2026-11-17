'use client';

import { DemoTerms } from '@/components/demo/DemoTerms';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSection } from './section-context';
import { useLeague } from './league-context';
import { useFranchise } from './franchise-context';
import { formatOverviewMetrics } from '@/lib/utils/formatMetrics';
import { formatNumber } from '@/lib/utils/format';
import { safeNumber, safeGoalPercentage, safeGoalTarget, safeDelta } from '@/lib/utils/safeNumber';
import { useOverviewKPIData } from '@/lib/hooks/useOverviewKPIData';
import { useMarketingKPIData, type MarketingKPIData } from '@/lib/hooks/useMarketingKPIData';
import { useSocialMediaData } from '@/lib/hooks/useSocialMediaData';
import { useGlossary, type GlossaryTerm, type GlossarySection, type SectionData } from '@/lib/hooks/useGlossary';
import { useDateRange } from '@/lib/hooks/useDateRange';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import { KPICard } from '@/components/ui/kpi-card';
import { InlineDropdown } from '@/components/ui/inline-dropdown';
import { KPICardSkeletonGrid } from '@/components/ui/KPICardSkeleton';
import { MinimalDateSelector } from '@/components/ui/MinimalDateSelector';
import { SalesPacingChart } from '@/components/charts/SalesPacingChart';
import { useSearchableHeader } from './header-registry';
import { SEARCHABLE_ITEMS } from '@/config/searchable-items';
import { salesViewFromPathname, type SalesView } from '@/lib/routes';

import { SalesSection } from '@/components/sections/SalesSection';


function OverviewContent({ league, selectedDate, franchise }: { detailedView: boolean, league: 'NHL' | 'AHL', selectedDate?: string, dateRange?: { startDate: string; endDate: string } | null, franchise: string }) {
  const { data: overviewData, loading } = useOverviewKPIData(selectedDate, franchise);

  // Register searchable headers for this section
  useSearchableHeader(SEARCHABLE_ITEMS.overview.seasonSummary);
  useSearchableHeader(SEARCHABLE_ITEMS.overview.salesPacingChart);

  // Card navigation intentionally removed: cards are read-only

  // Master loading gate - only check this component's data (parent handles dateRange)
  const masterLoading = loading || !overviewData;

  if (masterLoading) {
    return <KPICardSkeletonGrid />;
  }

  // Build the 3 core overview metrics from the KPI records
  const formattedMetrics = formatOverviewMetrics(overviewData);

  return (
    <div className="space-y-6">
      {/* Sales Health Check Header */}
      <div id="season-summary" className="space-y-3">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-text-primary">Sales Health Check</h2>
          <div className="flex-1 h-px bg-gray-200 ml-4"></div>
        </div>

        {/* 3 Core KPI Cards */}
        {formattedMetrics.coreMetrics.length > 0 && (
          <KPICard
            metrics={formattedMetrics.coreMetrics}
            section="overview"
            league={league}
            selectedDate={selectedDate}
          />
        )}
      </div>

      {/* Sales Pacing Chart */}
      <div id="sales-pacing-chart" className="space-y-3">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-text-primary">Sales Pacing</h2>
          <div className="flex-1 h-px bg-gray-200 ml-4"></div>
        </div>
        <SalesPacingChart />
      </div>
    </div>
  );
}



function SalesContent({ selectedDate, view }: { selectedDate?: string; view: SalesView }) {
  return <SalesSection selectedDate={selectedDate} view={view} />;
}

// Format marketing metrics using overview data source
const formatMarketingMetricsFromOverview = (data: MarketingKPIData | null) => {
  if (!data) return { coreMetrics: [] };

  // Marketing-focused 3 metrics using available data
  const coreMetrics = [
    // 1. App Power Users (engagement metric)
    {
      label: "App Power\nUsers",
      value: safeNumber(data.APPU) !== '---' ? formatNumber(safeNumber(data.APPU) as number) : '---',
      goal: safeNumber(data.APPU) !== '---' ? (
        typeof safeNumber(data.APPU_Goal_Pacing) === 'number' && (safeNumber(data.APPU_Goal_Pacing) as number) > 0 ? {
          target: safeGoalTarget(data.APPU, data.APPU_Goal_Pacing),
          current: safeNumber(data.APPU) as number,
          percentage: safeGoalPercentage(data.APPU_Goal_Pacing)
        } : {
          target: "TBD",
          current: safeNumber(data.APPU) as number,
          percentage: 0
        }
      ) : undefined,
      delta: safeDelta(data.app_yoy_user),
      baselineLabel: "vs last year",
      trendField: 'APPU'
    },
    // 2. Total Social Impressions (marketing reach metric)
    {
      label: "Total Social\nImpressions",
      value: safeNumber(data.TSI_Impressions) !== '---' ? formatNumber(safeNumber(data.TSI_Impressions) as number) : '---',
      goal: safeNumber(data.TSI_Impressions) !== '---' ? (
        typeof safeNumber(data.TSI_Goal_Pacing) === 'number' && (safeNumber(data.TSI_Goal_Pacing) as number) > 0 ? {
          target: safeGoalTarget(data.TSI_Impressions, data.TSI_Goal_Pacing),
          current: safeNumber(data.TSI_Impressions) as number,
          percentage: safeGoalPercentage(data.TSI_Goal_Pacing)
        } : {
          target: "TBD",
          current: safeNumber(data.TSI_Impressions) as number,
          percentage: 0
        }
      ) : undefined,
      delta: safeDelta(data.TSI_yoy),
      baselineLabel: "vs last year",
      trendField: 'TSI_Impressions'
    },
    // 3. Fan Growth (database growth metric)
    {
      label: "Fan Growth",
      value: safeNumber(data.FDG_Season_To_Date) !== '---' ? formatNumber(safeNumber(data.FDG_Season_To_Date) as number) : '---',
      goal: safeNumber(data.FDG_Season_To_Date) !== '---' ? (
        typeof safeNumber(data.FDG_Goal_Pacing) === 'number' && (safeNumber(data.FDG_Goal_Pacing) as number) > 0 ? {
          target: safeGoalTarget(data.FDG_Season_To_Date, data.FDG_Goal_Pacing),
          current: safeNumber(data.FDG_Season_To_Date) as number,
          percentage: safeGoalPercentage(data.FDG_Goal_Pacing)
        } : {
          target: "TBD",
          current: safeNumber(data.FDG_Season_To_Date) as number,
          percentage: 0
        }
      ) : undefined,
      delta: safeDelta(data.fan_growth_yoy),
      baselineLabel: "vs last year",
      trendField: 'FDG_Season_To_Date'
    }
  ];

  return {
    coreMetrics // Single array with 3 marketing metrics
  };
};

// League engagement rankings (demo values, not real league data)
const ENGAGEMENT_RANKINGS: Record<string, number> = {
  TikTok: 9,
  Instagram: 14,
  Twitter: 17,
  Facebook: 21,
  YouTube: 12
};

function MarketingContent({ league, selectedDate, franchise }: { league: 'NHL' | 'AHL'; selectedDate?: string; franchise: string }) {
  const { data: marketingData, loading } = useMarketingKPIData(selectedDate, franchise);
  const { data: socialMediaData, loading: socialLoading } = useSocialMediaData(selectedDate, franchise);

  // Register searchable headers for marketing section
  useSearchableHeader(SEARCHABLE_ITEMS.marketing.fanEngagement);
  useSearchableHeader(SEARCHABLE_ITEMS.marketing.socialMedia);
  useSearchableHeader(SEARCHABLE_ITEMS.marketing.platformPerformance);

  // Hover state for Platform Positioning chart tooltip
  const [hoveredPlatform, setHoveredPlatform] = useState<{ platform: string; impressions: number; engagement: number; x: number; y: number } | null>(null);

  // Hover state for engagement bar tooltip
  const [hoveredBar, setHoveredBar] = useState<{ platform: string; rank: number } | null>(null);

  // Master loading gate - only check this component's data (parent handles dateRange)
  const masterLoading = loading || socialLoading || !marketingData;

  if (masterLoading) {
    return <KPICardSkeletonGrid />;
  }

  // Build marketing-focused metrics from the KPI records
  const formattedMetrics = formatMarketingMetricsFromOverview(marketingData);

  return (
    <div className="space-y-6">
      {/* Marketing Engagement Header */}
      <div id="fan-engagement" className="space-y-3">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-text-primary">Marketing Engagement</h2>
          <div className="flex-1 h-px bg-gray-200 ml-4"></div>
        </div>

        {/* 3 Marketing KPI Cards */}
        {formattedMetrics.coreMetrics.length > 0 && (
          <KPICard
            metrics={formattedMetrics.coreMetrics}
            section="marketing"
            league={league}
            selectedDate={selectedDate}
          />
        )}
      </div>

      {/* Social Media Performance Section */}
      <div id="social-media" className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-text-primary">Social Media Performance</h2>
          <div className="flex-1 h-px bg-gray-200 ml-4"></div>
        </div>

        <div className="border-0 rounded-lg shadow-sm p-6" style={{ backgroundColor: '#ededed' }}>

        {socialMediaData.length > 0 ? (
          <>
            <div className="space-y-3 relative">
              {/* Column Headers */}
              <div className="flex items-center mb-1">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-24">Platform</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-1">Engagement Rate</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-24 text-right">Impressions</span>
              </div>

              {(() => {
                // Sort by engagement rate (descending)
                const sortedPlatforms = [...socialMediaData].sort((a, b) => b.growth - a.growth);
                const maxEngagement = Math.max(...sortedPlatforms.map(p => p.growth));

                return sortedPlatforms.map((platform) => {
                  const engagementRank = ENGAGEMENT_RANKINGS[platform.platform] ?? 0;

                  return (
                    <div key={platform.platform} className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 w-24">
                        {platform.platform}
                      </span>

                      <div className="flex-1 flex items-center gap-3">
                        <div
                          className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
                          onMouseEnter={() => setHoveredBar({ platform: platform.platform, rank: engagementRank })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${(platform.growth / maxEngagement) * 100}%`,
                              backgroundColor: platform.color,
                              opacity: 0.7
                            }}
                          />
                        </div>

                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                          {platform.growth.toFixed(1)}%
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-gray-700 w-24 text-right">
                        {formatNumber(platform.followers)}
                      </span>
                    </div>
                  );
                });
              })()}

              {/* Tooltip for engagement bar */}
              {hoveredBar && (
                <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none z-50"
                  style={{ top: '-50px', left: '50%', transform: 'translateX(-50%)' }}
                >
                  <p className="text-sm font-medium text-gray-900 mb-1">{hoveredBar.platform}</p>
                  <p className="text-sm text-gray-600">
                    NHL Rank: <span className="font-medium text-gray-900">#{hoveredBar.rank} of 32</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Demo ranking (synthetic)</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No social media data available for this date
          </div>
        )}
        </div>
      </div>

      {/* Platform Positioning Chart - Separate Card */}
      {socialMediaData.length > 0 && (
        <div id="platform-performance" className="space-y-3">
          {/* Section Header */}
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-text-primary">Platform Performance Metrics</h2>
            <div className="flex-1 h-px bg-gray-200 ml-4"></div>
          </div>

          <div className="border-0 rounded-lg shadow-sm p-4" style={{ backgroundColor: '#ededed' }}>
            <div>
              {(() => {
                const platformLogos: Record<string, { path: string; size: number }> = {
                  'Facebook': { path: '/Facebook_Logo_Primary.png', size: 32 },
                  'Instagram': { path: '/Instagram_Glyph_Gradient.png', size: 32 },
                  'Twitter': { path: '/x-logo-black.png', size: 24 },
                  'YouTube': { path: '/yt_icon_red_digital.png', size: 40 },
                  'TikTok': { path: '/TikTok_Icon_Black_Circle.png', size: 32 }
                };

                const maxImpressions = Math.max(...socialMediaData.map(p => p.followers));
                const maxEngagement = Math.max(...socialMediaData.map(p => p.growth));
                const minEngagement = 0;

                const width = 600;
                const height = 240;
                const padding = { left: 60, right: 30, top: 30, bottom: 50 };
                const plotWidth = width - padding.left - padding.right;
                const plotHeight = height - padding.top - padding.bottom;

                const scaleX = (impressions: number) =>
                  padding.left + (impressions / maxImpressions) * plotWidth;

                const scaleY = (engagement: number) =>
                  height - padding.bottom - ((engagement - minEngagement) / (maxEngagement - minEngagement)) * plotHeight;

                return (
                  <div className="relative w-full rounded-lg" style={{ backgroundColor: '#ededed' }}>
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
                      {/* Axis lines */}
                      <line
                        x1={padding.left}
                        y1={height - padding.bottom}
                        x2={width - padding.right}
                        y2={height - padding.bottom}
                        stroke="#9ca3af"
                        strokeWidth="2"
                      />
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={height - padding.bottom}
                        stroke="#9ca3af"
                        strokeWidth="2"
                      />

                      {/* Axis labels */}
                      <text
                        x={width / 2}
                        y={height - 15}
                        textAnchor="middle"
                        className="fill-gray-700 font-medium"
                        style={{ fontSize: '13px' }}
                      >
                        Impressions →
                      </text>
                      <text
                        x={15}
                        y={height / 2}
                        textAnchor="middle"
                        className="fill-gray-700 font-medium"
                        style={{ fontSize: '13px' }}
                        transform={`rotate(-90, 15, ${height / 2})`}
                      >
                        Engagement % →
                      </text>

                      {/* Platform logos as data points */}
                      {socialMediaData.map((platform) => {
                        const x = scaleX(platform.followers);
                        const y = scaleY(platform.growth);
                        const logoConfig = platformLogos[platform.platform];

                        return (
                          <g key={platform.platform}>
                            <image
                              href={logoConfig.path}
                              x={x - logoConfig.size / 2}
                              y={y - logoConfig.size / 2}
                              width={logoConfig.size}
                              height={logoConfig.size}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onMouseEnter={() => setHoveredPlatform({
                                platform: platform.platform,
                                impressions: platform.followers,
                                engagement: platform.growth,
                                x: x,
                                y: y
                              })}
                              onMouseLeave={() => setHoveredPlatform(null)}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Custom Tooltip */}
                    {hoveredPlatform && (
                      <div
                        className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
                        style={{
                          left: `${hoveredPlatform.x}px`,
                          top: `${hoveredPlatform.y - 60}px`,
                          transform: 'translateX(-50%)',
                          zIndex: 50
                        }}
                      >
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {hoveredPlatform.platform}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Impressions: <span className="font-medium text-gray-900">{formatNumber(hoveredPlatform.impressions)}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Engagement: <span className="font-medium text-gray-900">{hoveredPlatform.engagement.toFixed(1)}%</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function DashboardPageClient() {
  // removed extracted earlier
  const { league } = useLeague();
  const { franchise } = useFranchise();
  const { section } = useSection();
  const pathname = usePathname();
  const salesView = salesViewFromPathname(pathname);
  const isWideSalesView = section === 'sales' && salesView === 'analysis';
  const pageTitle =
    section === 'sales'
      ? salesView === 'game'
        ? 'Game Command Center'
        : salesView === 'analysis'
          ? 'Sales Analysis'
          : 'Season Command Center'
      : section === 'overview'
        ? 'Overview'
        : section === 'marketing'
          ? 'Marketing'
          : 'Dashboard';
  const containerClass = isWideSalesView
    ? 'w-[min(1500px,calc(100vw-2rem))] mx-auto'
    : 'max-w-container mx-auto';
  const { data: glossaryData } = useGlossary();

  // Dynamic page title
  usePageTitle(section);

  // Simple date state - defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(''); // Empty = latest
  const { dateRange } = useDateRange();

  // Initialize to latest date when dateRange loads
  useEffect(() => {
    if (dateRange?.endDate && !selectedDate) {
      setSelectedDate(dateRange.endDate);
    }
  }, [dateRange, selectedDate]);

  // Helper function to check if data has sectioned structure
  const hasSections = (data: SectionData): data is { sections: GlossarySection[] } => {
    return typeof data === 'object' && !Array.isArray(data) && 'sections' in data && Array.isArray(data.sections);
  };

  // Get glossary terms for current section (Production sections only)
  const getGlossaryTerms = (): SectionData => {
    if (!glossaryData) return [];

    switch (section) {
      case 'overview': return glossaryData.overview;
      case 'sales': return glossaryData.sales;
      case 'marketing': return glossaryData.marketing;
      case 'social': return glossaryData.social;
      default: return [];
    }
  };

  // Render glossary terms - handles both sectioned and flat structures
  const renderGlossaryTerms = (data: SectionData) => {
    // Check if data has sectioned structure
    if (hasSections(data)) {
      // Sort sections by order if provided
      const sortedSections = [...data.sections].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });

      return (
        <div className="space-y-6">
          {sortedSections.map((section) => (
            <div key={section.title}>
              {/* Section Header */}
              <h4 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">
                {section.title}
              </h4>
              {/* Terms - Use 2 columns only if section has 2+ terms, with wide spacing */}
              <div className={`gap-x-20 gap-y-5 ${section.terms.length > 1 ? 'grid grid-cols-1 md:grid-cols-2' : 'space-y-4'}`}>
                {section.terms.map((term, index) => (
                  <div key={index}>
                    <div className="text-glossary-label text-text-secondary">
                      {term.term}
                    </div>
                    <div className="text-glossary-value text-text-primary">
                      {term.definition}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Fallback: Handle flat array structure (backward compatibility)
    if (!Array.isArray(data)) return null;
    const terms = data as GlossaryTerm[];
    const midpoint = Math.ceil(terms.length / 2);
    const leftColumn = terms.slice(0, midpoint);
    const rightColumn = terms.slice(midpoint);

    return (
      <>
        <div className="space-y-4">
          {leftColumn.map((term, index) => (
            <div key={index} className={term.isPlaceholder ? 'opacity-60' : ''}>
              <div className={`text-glossary-label ${
                term.isPlaceholder ? 'text-text-tertiary italic' : 'text-text-secondary'
              }`}>
                {term.term}{term.isPlaceholder ? ' (Coming Soon)' : ''}
              </div>
              <div className="text-glossary-value text-text-primary">
                {term.definition}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {rightColumn.map((term, index) => (
            <div key={index} className={term.isPlaceholder ? 'opacity-60' : ''}>
              <div className={`text-glossary-label ${
                term.isPlaceholder ? 'text-text-tertiary italic' : 'text-text-secondary'
              }`}>
                {term.term}{term.isPlaceholder ? ' (Coming Soon)' : ''}
              </div>
              <div className="text-glossary-value text-text-primary">
                {term.definition}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderContent = () => {
    if (section === 'overview') {
      return <OverviewContent detailedView={false} league={league} selectedDate={selectedDate} dateRange={dateRange} franchise={franchise} />;
    }

    if (section === 'sales') {
      return <SalesContent selectedDate={selectedDate} view={salesView} />;
    }

    if (section === 'marketing') {
      return <MarketingContent league={league} selectedDate={selectedDate} franchise={franchise} />;
    }

    return <OverviewContent detailedView={false} league={league} selectedDate={selectedDate} dateRange={dateRange} franchise={franchise} />;
  };

  return (
    <div className={containerClass}>
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-title-xl text-text-primary">
            {pageTitle}
          </h1>
        </div>
      
      
      
      

      {section === 'marketing' && <DemoTerms terms={['fanGrowth', 'impressions', 'powerUsers', 'periods', 'attainment']} />}
      <div className="space-y-2">
        {/* Executive Date Selection - Show on overview, sales, and marketing pages */}
        {(section === 'overview' || section === 'sales' || section === 'marketing') && dateRange && (
          <MinimalDateSelector
            selectedDate={selectedDate || dateRange.endDate}
            onDateChange={setSelectedDate}
            endDate={dateRange.endDate}
            className="mb-4"
          />
        )}


        {/* Content based on active section */}
        <div className="relative space-y-3">
          {/* Remove league switching overlay - data loading controls UI state */}
          {renderContent()}
        </div>

        {/* Dynamic Glossary Section - Compact */}
        <InlineDropdown title="Glossary" className="mt-3">
          {(() => {
            const glossaryData = getGlossaryTerms();
            // If data has sections, render with section headers
            // Otherwise use 2-column grid for flat arrays
            if (hasSections(glossaryData)) {
              return renderGlossaryTerms(glossaryData);
            } else {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderGlossaryTerms(glossaryData)}
                </div>
              );
            }
          })()}
        </InlineDropdown>


      </div>
    </div>
  );
}
