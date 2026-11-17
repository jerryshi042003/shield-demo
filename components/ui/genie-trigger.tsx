'use client';

import { Sparkles } from 'lucide-react';

export function GenieTrigger({
  label,
  open,
  onClick,
  disabled = false
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={open ? `Close ${label}` : label}
      aria-expanded={open}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[#102a50] shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      title={open ? `Close ${label}` : label}
    >
      <Sparkles aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
