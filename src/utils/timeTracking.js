// Time tracking helpers.
// Billing rule: each task's total per local calendar day is rounded UP to the
// next 15-minute increment. Raw timestamps are never altered.

export const BILLING_INCREMENT_MIN = 15;

const MS_PER_MIN = 60 * 1000;

export const entryMs = (entry, now = Date.now()) => {
  const start = new Date(entry.startedAt).getTime();
  const end = entry.endedAt ? new Date(entry.endedAt).getTime() : now;
  return Math.max(0, end - start);
};

const pad = (n) => String(n).padStart(2, '0');

// Local YYYY-MM-DD for an ISO timestamp (entries count toward the day they started)
export const localDateKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const roundUpToIncrement = (ms) =>
  ms <= 0 ? 0 : Math.ceil(ms / MS_PER_MIN / BILLING_INCREMENT_MIN) * BILLING_INCREMENT_MIN;

// Summarize one task's entries: per-day raw + billed minutes, newest day first.
export const summarizeTaskTime = (entries, now = Date.now()) => {
  const byDay = new Map();
  entries.forEach(entry => {
    const key = localDateKey(entry.startedAt);
    if (!byDay.has(key)) byDay.set(key, { date: key, rawMs: 0, entries: [] });
    const day = byDay.get(key);
    day.rawMs += entryMs(entry, now);
    day.entries.push(entry);
  });

  const days = [...byDay.values()]
    .map(day => ({
      ...day,
      billedMinutes: roundUpToIncrement(day.rawMs),
      entries: day.entries.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    days,
    rawMs: days.reduce((sum, d) => sum + d.rawMs, 0),
    billedMinutes: days.reduce((sum, d) => sum + d.billedMinutes, 0),
  };
};

// Group a flat list of entries (e.g. a whole board) by task id.
export const groupEntriesByTask = (entries) => {
  const map = {};
  entries.forEach(e => {
    if (!map[e.taskId]) map[e.taskId] = [];
    map[e.taskId].push(e);
  });
  return map;
};

export const effectiveRate = (taskRate, boardRate) =>
  taskRate != null ? taskRate : boardRate != null ? boardRate : null;

export const billedAmount = (billedMinutes, rate) =>
  rate == null ? null : (billedMinutes / 60) * rate;

// 5025000 → "1:23:45"
export const formatClock = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${pad(m)}:${pad(s)}`;
};

// 75 → "1h 15m"
export const formatMinutes = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// Raw duration, minute precision: 5025000 → "1h 23m"
export const formatRawMs = (ms) => formatMinutes(Math.floor(ms / MS_PER_MIN));

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatUsd = (amount) => usdFormatter.format(amount);

// ISO → value for <input type="datetime-local"> in local time
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// <input type="datetime-local"> value (local) → ISO UTC
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

export const formatDayLabel = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export const formatTimeOfDay = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
