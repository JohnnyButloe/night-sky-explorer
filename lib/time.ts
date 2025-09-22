// lib/time.ts
// Helpers for time zone handling across the app.
//
// Requires:
//   - date-fns
//   - date-fns-tz >= 3 (uses toZonedTime / fromZonedTime)
//   - tz-lookup (+ @types/tz-lookup for TS)
//
// Notes:
// - formatZoned is defensive: returns '' if input/tz is invalid to avoid RangeError.
// - isWithinMinutes is added here because some components import it from this module.

import tzLookup from 'tz-lookup';
import {
  parseISO,
  isValid as isValidDate,
  differenceInMinutes,
} from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/** Safely coerce a Date | ISO string to a valid Date, else null. */
function toDateSafe(input: Date | string): Date | null {
  const d = typeof input === 'string' ? parseISO(input) : input;
  return isValidDate(d) ? d : null;
}

/**
 * Format a date/time in a target IANA time zone.
 * Returns '' if the input is missing/invalid or the tz is missing.
 */
export function formatZoned(
  input: Date | string | null | undefined,
  tz: string | null | undefined,
  fmt = 'M/d/yyyy, h:mm:ss a',
): string {
  if (!input || !tz) return '';
  const d = toDateSafe(input);
  if (!d) return '';
  return formatInTimeZone(d, tz, fmt);
}

/** Current moment represented in the given IANA time zone. */
export function nowInZone(tz: string): Date {
  return toZonedTime(new Date(), tz);
}

/**
 * Convert a local time (in a specific IANA zone) to a UTC ISO string.
 * If input is invalid, falls back to current UTC timestamp.
 */
export function toUTCISO(dateInZone: Date | string, tz: string): string {
  const d = toDateSafe(dateInZone);
  if (!d) return new Date().toISOString();
  const utc = fromZonedTime(d, tz);
  return utc.toISOString();
}

/** True if two instants are within N minutes of each other. */
export function isWithinMinutes(
  a: Date | string,
  b: Date | string,
  minutes: number,
): boolean {
  const da = toDateSafe(a);
  const db = toDateSafe(b);
  if (!da || !db) return false;
  return Math.abs(differenceInMinutes(da, db)) <= minutes;
}

/**
 * Derive the IANA time zone for geographic coordinates.
 * Returns null if lookup fails.
 */
export function getTimeZoneForCoords(lat: number, lon: number): string | null {
  try {
    return tzLookup(lat, lon);
  } catch {
    return null;
  }
}
