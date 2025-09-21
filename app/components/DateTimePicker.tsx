'use client';
import { useTime } from '@/hooks/useTime';
import { set } from 'date-fns';

export default function DateTimePicker() {
  const { timeZone, selectedDateTime, setSelectedDateTime } = useTime();

  if (!timeZone || !selectedDateTime) return null;

  // datetime-local needs a local-like string (no timezone). We present the zoned
  // date's wall-clock values and keep interpreting them in the same tz.
  const toInputValue = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value; // "YYYY-MM-DDThh:mm"
    if (!val) return;
    // Interpret as wall time in the current tz by constructing a Date from parts.
    const [datePart, timePart] = val.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [hh, mm] = timePart.split(':').map(Number);
    // We keep a JS date with those wall-clock fields; the context will treat it as in 'timeZone'.
    const next = new Date(y, m - 1, d, hh, mm, 0);
    setSelectedDateTime(next);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm opacity-80">Date &amp; Time</label>
      <input
        type="datetime-local"
        className="rounded-md bg-neutral-800 px-3 py-2 text-sm"
        value={toInputValue(selectedDateTime)}
        onChange={onChange}
      />
      <span className="text-xs opacity-60">{timeZone}</span>
    </div>
  );
}
