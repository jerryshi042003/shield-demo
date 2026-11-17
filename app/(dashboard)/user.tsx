'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { type Franchise } from '@/lib/franchise';
import { getFranchiseBrand } from '@/lib/franchise-brand';
import type { AuthUser } from '@/lib/types/auth-user';
import { useFranchise } from './franchise-context';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getGreetingByTime(date: Date): string {
  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    hourCycle: 'h23'
  })
    .formatToParts(date)
    .find((part) => part.type === 'hour');
  const hour = Number(hourPart?.value ?? 0);
  if (hour < 9) return "You're up early";
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function User({
  firstName = '',
  fullName = '',
  email = '',
  allowedFranchises = [],
  showGreeting = false,
  showInlineIdentity = false
}: {
  firstName?: AuthUser['firstName'];
  fullName?: AuthUser['fullName'];
  email?: AuthUser['email'];
  isSuperAdmin?: AuthUser['isSuperAdmin'];
  allowedFranchises?: AuthUser['allowedFranchises'];
  showGreeting?: boolean;
  showInlineIdentity?: boolean;
}) {
  const { franchise } = useFranchise();
  const [switchingTo, setSwitchingTo] = useState<Franchise | null>(null);
  const [greeting, setGreeting] = useState('');
  const [switchError, setSwitchError] = useState('');
  const initials = getInitials(fullName);

  useEffect(() => {
    setGreeting(getGreetingByTime(new Date()));
  }, []);

  async function handleSwitchFranchise(targetFranchise: Franchise) {
    if (targetFranchise === franchise || switchingTo) return;

    setSwitchingTo(targetFranchise);
    setSwitchError('');

    try {
      const response = await fetch('/api/auth/superadmin/franchise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ franchise: targetFranchise })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as { redirectPath?: string };
      const redirectPath = payload.redirectPath ?? '/sales/season';

      // Hard reload resets in-memory caches before loading the new franchise context.
      window.location.assign(redirectPath);
    } catch {
      setSwitchingTo(null);
      setSwitchError('Unable to switch. Try again.');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={showInlineIdentity ? 'ghost' : 'outline'}
          size={showInlineIdentity ? 'default' : 'icon'}
          className={
            showInlineIdentity
              ? 'h-auto gap-2 rounded-full px-1.5 py-1 hover:bg-gray-100'
              : 'overflow-hidden rounded-full'
          }
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white',
              showInlineIdentity ? 'bg-[#1f2f5b]' : 'bg-purple-600'
            )}
          >
            {initials || ' '}
          </div>
          {showInlineIdentity && fullName ? (
            <span className="hidden max-w-40 truncate pr-2 text-sm font-semibold text-gray-900 sm:inline">
              {fullName}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            {showGreeting && firstName && greeting && (
              <span className="text-xs font-medium text-muted-foreground">
                {greeting}, {firstName}
              </span>
            )}
            {fullName && <span className="font-medium">{fullName}</span>}
            {email && (
              <span className="text-xs text-muted-foreground font-normal">
                {email}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        {allowedFranchises.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Switch franchise
            </DropdownMenuLabel>
            {allowedFranchises.map((item) => {
              const brand = getFranchiseBrand(item);
              const isActive = item === franchise;
              const isLoading = switchingTo === item;
              const label = isActive
                ? `${brand.shortDisplayName} (Active)`
                : brand.shortDisplayName;

              return (
                <DropdownMenuItem
                  key={item}
                  disabled={Boolean(switchingTo) || isActive}
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleSwitchFranchise(item);
                  }}
                  className="justify-between gap-4"
                >
                  <span>{label}</span>
                  {isLoading ? (
                    <span className="text-xs text-muted-foreground">
                      Switching...
                    </span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        {switchError && <p role="alert" className="px-2 py-2 text-sm text-red-700">{switchError}</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
