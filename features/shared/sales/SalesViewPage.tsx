'use client';

import { DemoTerms } from '@/components/demo/DemoTerms';
import { useEffect, useState } from 'react';
import { MinimalDateSelector } from '@/components/ui/MinimalDateSelector';
import { SalesSection } from '@/components/sections/SalesSection';
import { useDateRange } from '@/lib/hooks/useDateRange';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import type { SalesView } from '@/lib/routes';

export function SalesViewPage({ view }: { view: SalesView }) {
  usePageTitle('sales');

  const { dateRange } = useDateRange();
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (dateRange?.endDate && !selectedDate) {
      setSelectedDate(dateRange.endDate);
    }
  }, [dateRange, selectedDate]);

  const pageTitle =
    view === 'analysis'
      ? 'Sales Analysis'
      : view === 'game'
        ? 'Game'
        : 'Season';
  const containerClass =
    view === 'analysis'
      ? 'w-[min(1500px,calc(100vw-2rem))] mx-auto'
      : 'max-w-container mx-auto';

  return (
    <div className={containerClass}>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-title-xl text-text-primary">{pageTitle}</h1>
      </div>

      <DemoTerms
        terms={
          view === 'analysis'
            ? [
                'atp',
                'analysis',
                'attendance',
                'netTickets',
                'priceLevels',
                'ancillary',
                'periods'
              ]
            : [
                'atp',
                'sellThrough',
                'priceLevels',
                'ancillary',
                'fse',
                'netTickets',
                'attainment',
                'periods'
              ]
        }
      />
      <div className="space-y-2">
        {dateRange && (
          <MinimalDateSelector
            selectedDate={selectedDate || dateRange.endDate}
            onDateChange={setSelectedDate}
            endDate={dateRange.endDate}
            className="mb-4"
          />
        )}

        <div className="relative space-y-3">
          <SalesSection selectedDate={selectedDate} view={view} />
        </div>
      </div>
    </div>
  );
}
