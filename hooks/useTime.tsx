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
  selectedDateTime: Date | null; // always interpreted in timeZone
  setSelectedDateTime: (d: Date | null) => void;
  now: Date | null; // "now" in timeZone
};

const Ctx = createContext<TimeCtx>({
  timeZone: null,
  setTimeZone: () => {},
  selectedDateTime: null,
  setSelectedDateTime: () => {},
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

  const value = useMemo(
    () => ({
      timeZone,
      setTimeZone,
      selectedDateTime,
      setSelectedDateTime,
      now,
    }),
    [timeZone, selectedDateTime, now],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTime = () => useContext(Ctx);
