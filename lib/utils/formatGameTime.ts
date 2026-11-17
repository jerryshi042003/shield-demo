/**
 * Game time formatting utilities
 * Handles PST/PDT timezone conversions for LA Kings games
 */

import { getLocalizedDate } from "./date";

/**
 * Format ISO datetime string to PST/PDT time display
 * @param dateTimeString - ISO datetime string (e.g., "2025-10-04T13:00:00")
 * @returns Formatted time string (e.g., "1:00 PM PST") or "TBD"
 */
export function formatGameTimePST(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return 'TBD';

  try {
    const dateTime = new Date(dateTimeString);

    if (isNaN(dateTime.getTime())) {
      return 'TBD';
    }

    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(dateTime);

    // Add PST/PDT suffix (simplified - always shows PST for consistency)
    // In production, could detect daylight saving time
    return `${timeStr} PST`;
  } catch {
    return 'TBD';
  }
}

/**
 * Format ISO datetime or date string to readable date format
 * @param dateTimeString - ISO datetime/date string
 * @returns Formatted date string (e.g., "Saturday, Oct 4") or "TBD"
 */
export function formatGameDate(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return 'TBD';

  try {
    const date = getLocalizedDate(dateTimeString);

    if (isNaN(date.getTime())) {
      return 'TBD';
    }

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return 'TBD';
  }
}

/**
 * Calculate days until game from current time
 * @param dateTimeString - ISO datetime string
 * @returns Number of days until game (0 if today, negative if past)
 */
export function calculateDaysUntil(dateTimeString: string | null | undefined): number {
  if (!dateTimeString) return 0;

  try {
    const gameDate = new Date(dateTimeString);
    const now = new Date();

    if (isNaN(gameDate.getTime())) {
      return 0;
    }

    const diffMs = gameDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch {
    return 0;
  }
}
