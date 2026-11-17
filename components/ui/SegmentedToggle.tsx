"use client";

import React from 'react';
import clsx from 'clsx';

export interface SegmentedOption<T> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Compact segmented control used throughout the dashboard (league switch, basic/detailed, etc.).
 * Keeps styling consistent – muted outer pill, active item raised on white background.
 */
export function SegmentedToggle<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="tablist"
      className={clsx(
        'inline-flex items-center rounded-full bg-muted p-0.5 border border-muted-foreground/10',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            role="tab"
            onClick={() => onChange(opt.value)}
            aria-selected={active}
            className={clsx(
              'px-3 py-0.5 text-xs font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
