// app/utils/dateUtils.ts
import { parseISO, format } from 'date-fns';

/**
 * Parses input into a Date.
 * If input is a string, assumes it is an ISO string.
 */
export function parseDate(input: string | Date): Date {
  return input instanceof Date ? input : parseISO(input);
}

/**
 * Formats a Date into a localized string.
 * Default format can be customized (e.g., "Pp" for a standard date and time).
 */
export function formatDateLocal(date: Date, formatStr = 'Pp'): string {
  return format(date, formatStr);
}

/**
 * Returns an ISO string from a Date in UTC.
 */
export function toUTCString(date: Date): string {
  return date.toISOString();
}
