// lib/time.ts
export function isWithinMinutes(a: Date, b: Date, minutes = 30) {
  const diff = Math.abs(a.getTime() - b.getTime()); // compare timestamps
  return diff <= minutes * 60 * 1000;
}
