'use client';
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { nowInZone } from '@/lib/time';

type TimeCtx = {
  timeZone: string | null;
  setTimeZone: (tz: string) => void;
  /** Confirmed date/time the app should use (interpreted in timeZone). */
  selectedDateTime: Date | null;
  setSelectedDateTime: (d: Date | null) => void;
  /** Convenience: ISO-8601 UTC string derived from selectedDateTime (stable for query keys). */
  selectedIso: string | null;
  /** "Now" in timeZone for UI convenience. */
  now: Date | null;
};

const Ctx = createContext<TimeCtx>({
  timeZone: null,
  setTimeZone: () => {},
  selectedDateTime: null,
  setSelectedDateTime: () => {},
  selectedIso: null,
  now: null,
});

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!timeZone) return;
    // initialize/refresh "now" whenever tz changes
    setNow(nowInZone(timeZone));
    // optional: keep "now" fresh
    const id = setInterval(() => setNow(nowInZone(timeZone)), 60_000);
    return () => clearInterval(id);
  }, [timeZone]);

  // default selectedDateTime = now in zone
  useEffect(() => {
    if (timeZone && !selectedDateTime) setSelectedDateTime(nowInZone(timeZone));
  }, [timeZone, selectedDateTime]);

  // NEW: derive a stable ISO string from the confirmed selectedDateTime
  const selectedIso = useMemo(
    () => (selectedDateTime ? selectedDateTime.toISOString() : null),
    [selectedDateTime],
  );

  const value = useMemo(
    () => ({
      timeZone,
      setTimeZone,
      selectedDateTime,
      setSelectedDateTime,
      selectedIso,
      now,
    }),
    [timeZone, selectedDateTime, selectedIso, now],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTime = () => useContext(Ctx);

/**
 * Tiny helper so consumers can import a dedicated ISO selector if they prefer:
 *   const iso = useSelectedIso();
 */
export const useSelectedIso = () => {
  const { selectedIso } = useTime();
  return selectedIso;
};
