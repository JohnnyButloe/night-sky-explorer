'use client';
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';

type DateTimeCtx = {
  /** The ISO string all data should be fetched with (single source of truth). */
  selectedIso: string;
  /** The ISO string the user is currently editing in the picker (does NOT trigger fetches). */
  pendingIso: string;
  /** Update the pending value as the user types/selects. */
  setPendingIso: (iso: string) => void;
  /** Promote pending → selected (triggers refetches). */
  confirm: () => void;
  /** Optional utility: force a selectedIso directly (e.g., when location changes). */
  setSelectedIso: (iso: string) => void;
};

const Ctx = createContext<DateTimeCtx | null>(null);

function toIso(d: Date | string) {
  return (d instanceof Date ? d : new Date(d)).toISOString();
}

export function DateTimeProvider({
  children,
  initialIso,
}: {
  children: React.ReactNode;
  initialIso?: string;
}) {
  // default to "now" in UTC, keeping your existing behavior that derives local time at selection time
  const initial = useMemo(
    () => (initialIso ? toIso(initialIso) : new Date().toISOString()),
    [initialIso],
  );
  const [selectedIso, setSelectedIso] = useState<string>(initial);
  const [pendingIso, setPendingIso] = useState<string>(initial);

  const confirm = useCallback(() => {
    setSelectedIso(pendingIso);
  }, [pendingIso]);

  const value = useMemo(
    () => ({ selectedIso, pendingIso, setPendingIso, confirm, setSelectedIso }),
    [selectedIso, pendingIso, confirm],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDateTime() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error('useDateTime must be used within <DateTimeProvider>');
  return ctx;
}
