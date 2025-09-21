import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import tzlookup from 'tz-lookup';

export function getTimeZoneForCoords(lat: number, lon: number): string {
  return tzlookup(lat, lon); // e.g., "America/New_York"
}

export function nowInZone(tz: string): Date {
  return utcToZonedTime(new Date(), tz);
}

export function toUTCISO(dateInZone: Date, tz: string): string {
  return zonedTimeToUtc(dateInZone, tz).toISOString();
}

export function formatZoned(
  dateInZone: Date,
  tz: string,
  fmt = 'M/d/yyyy, h:mm:ss a',
) {
  return formatInTimeZone(dateInZone, tz, fmt);
}
