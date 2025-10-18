'use client';

import * as React from 'react';
import { useDateTime } from '@/app/providers/date-time';
import { useTime } from '@/hooks/useTime';
import { Button } from '@/app/components/ui/button';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

/**
 * DateTimePicker
 * - Shows the pending date/time in the user's selected IANA time zone.
 * - Only when the user clicks Submit do we confirm (pending → selected),
 *   which should trigger refetches across the dashboard (since queries include selectedIso).
 */
export default function DateTimePicker() {
  const { selectedIso, pendingIso, setPendingIso, confirm } = useDateTime();
  const { timeZone } = useTime() as { timeZone?: string };

  if (!pendingIso) return null;

  /** Build `YYYY-MM-DDTHH:mm` for <input type="datetime-local"> from ISO + tz. */
  const toLocalInputValue = (iso: string, tz?: string) => {
    const d = tz ? utcToZonedTime(new Date(iso), tz) : new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  /**
   * When the input changes, interpret the wall time in the selected tz
   * and convert it to a UTC ISO string for app state.
   */
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value; // "YYYY-MM-DDThh:mm"
    if (!val) return;

    // Treat the typed value as time in `timeZone` (if provided) and convert to UTC.
    // Passing the "wall time" string directly is supported by date-fns-tz.
    // Fallback to native Date if tz is unknown.
    const nextUtc = timeZone
      ? zonedTimeToUtc(`${val}:00`, timeZone)
      : new Date(`${val}:00`);

    setPendingIso(nextUtc.toISOString());
  };

  const isDirty = pendingIso !== selectedIso;

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm opacity-80 min-w-[92px]">Date &amp; Time</label>

      <input
        type="datetime-local"
        className="rounded-md bg-neutral-800 px-3 py-2 text-sm text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={toLocalInputValue(pendingIso, timeZone)}
        onChange={onChange}
      />

      <span className="text-xs opacity-60 tabular-nums">
        {timeZone ?? 'Local'}
      </span>

      <Button
        type="button"
        onClick={confirm}
        disabled={!isDirty}
        title={isDirty ? 'Apply date/time' : 'No changes to apply'}
      >
        Submit
      </Button>
    </div>
  );
}
