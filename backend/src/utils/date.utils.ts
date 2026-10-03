// ==============================================================================
// MAHMAS LANGUAGE — DATE & TIMEZONE UTILITIES
// Safe, authoritative IANA timezone conversion without third-party dependencies
// ==============================================================================

/**
 * Returns the calendar date string (YYYY-MM-DD) for a given timestamp and IANA timezone.
 * Defaults safely to UTC if the timezone identifier is invalid.
 */
export function getLocalDateString(date: Date = new Date(), timeZone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Returns 'YYYY-MM-DD'
  } catch (error) {
    // Fallback if timezone string is malformed
    return date.toISOString().split('T')[0];
  }
}

/**
 * Returns a Date object representing UTC midnight for a given calendar date string (YYYY-MM-DD).
 */
export function parseDateStringToUtcDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

/**
 * Calculates the whole-day difference between two calendar date strings (YYYY-MM-DD).
 * Positive if dateStr2 is after dateStr1.
 */
export function getCalendarDayDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(`${dateStr1}T00:00:00.000Z`).getTime();
  const d2 = new Date(`${dateStr2}T00:00:00.000Z`).getTime();
  const diffMs = d2 - d1;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Gets the UTC start and end timestamps representing the local day in the given IANA timezone.
 */
export function getLocalDayTimeRange(date: Date = new Date(), timeZone: string = 'UTC'): { start: Date; end: Date } {
  const localDateStr = getLocalDateString(date, timeZone);
  const start = new Date(`${localDateStr}T00:00:00.000Z`);
  const end = new Date(`${localDateStr}T23:59:59.999Z`);
  return { start, end };
}
