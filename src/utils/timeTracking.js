// Time tracking helpers.
// Billing rule (must match api/billing_helper.php): all of a board's time for one local day
// at one rate is pooled and rounded UP once to the next 15 minutes; the rounded minutes are
// then spread across the tasks in the pool in whole minutes. Raw timestamps are never altered.

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

export const effectiveRate = (taskRate, boardRate) =>
  taskRate != null ? taskRate : boardRate != null ? boardRate : null;

// Seconds -> billed minutes (rounded up to 15-minute increments)
const billedMinutesForSeconds = (seconds) =>
  seconds <= 0 ? 0 : Math.ceil(seconds / (BILLING_INCREMENT_MIN * 60)) * BILLING_INCREMENT_MIN;

// Split `total` whole minutes across integer `weights`, largest remainder first.
// Ties go to the larger weight, then the lower index (callers sort by task id first).
const allocateMinutes = (total, weights) => {
  const out = weights.map(() => 0);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || sum <= 0) return out;

  const cands = [];
  let given = 0;
  weights.forEach((w, i) => {
    const num = total * w;
    out[i] = Math.floor(num / sum);
    given += out[i];
    if (w > 0) cands.push({ i, r: num % sum, w });
  });
  cands.sort((a, b) => (b.r - a.r) || (b.w - a.w) || (a.i - b.i));
  for (let k = 0, left = total - given; left > 0 && cands.length; k++, left--) {
    out[cands[k % cands.length].i] += 1;
  }
  return out;
};

// Compute each task's billing from a flat list of entries (one board, or several).
// Entries need: taskId, startedAt, endedAt, invoiceId, and optionally boardId, taskRate,
// boardRate, invoicedRate. Returns Map<taskId, { days, rawMs, billedMinutes,
// invoicedMinutes, unbilledMinutes }> where days (newest first) hold each day's entries
// (newest first) and that task's share of the day's pooled, rounded minutes.
export const allocateBoardBilling = (entries, now = Date.now()) => {
  // Pool by board + local day + rate
  const pools = new Map();
  entries.forEach(entry => {
    const day = localDateKey(entry.startedAt);
    const base = effectiveRate(entry.taskRate, entry.boardRate);
    const rate = entry.invoiceId && entry.invoicedRate != null ? entry.invoicedRate : base;
    const key = `${entry.boardId ?? ''}|${day}|${rate == null ? 'x' : Number(rate).toFixed(2)}`;
    if (!pools.has(key)) pools.set(key, { day, allSec: 0, invSec: 0, tasks: new Map() });
    const pool = pools.get(key);

    const ms = entryMs(entry, now);
    const sec = Math.floor(ms / 1000);
    pool.allSec += sec;
    if (entry.invoiceId) pool.invSec += sec;

    if (!pool.tasks.has(entry.taskId)) {
      pool.tasks.set(entry.taskId, { taskId: entry.taskId, invSec: 0, unbSec: 0, rawMs: 0, entries: [] });
    }
    const t = pool.tasks.get(entry.taskId);
    t.rawMs += ms;
    if (entry.invoiceId) t.invSec += sec; else t.unbSec += sec;
    t.entries.push(entry);
  });

  const perTask = new Map(); // taskId -> Map<day, dayRow>
  pools.forEach(pool => {
    const billedInv = billedMinutesForSeconds(pool.invSec);
    const unbilledTotal = billedMinutesForSeconds(pool.allSec) - billedInv;
    const tasks = [...pool.tasks.values()].sort((a, b) => a.taskId - b.taskId);
    const invAlloc = allocateMinutes(billedInv, tasks.map(t => t.invSec));
    const unbAlloc = allocateMinutes(unbilledTotal, tasks.map(t => t.unbSec));

    tasks.forEach((t, i) => {
      if (!perTask.has(t.taskId)) perTask.set(t.taskId, new Map());
      const days = perTask.get(t.taskId);
      if (!days.has(pool.day)) {
        days.set(pool.day, { date: pool.day, rawMs: 0, invoicedMinutes: 0, unbilledMinutes: 0, entries: [] });
      }
      const row = days.get(pool.day);
      row.rawMs += t.rawMs;
      row.invoicedMinutes += invAlloc[i];
      row.unbilledMinutes += unbAlloc[i];
      row.entries.push(...t.entries);
    });
  });

  const result = new Map();
  perTask.forEach((dayMap, taskId) => {
    const days = [...dayMap.values()]
      .map(day => ({
        ...day,
        billedMinutes: day.invoicedMinutes + day.unbilledMinutes,
        entries: day.entries.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const sum = (key) => days.reduce((total, d) => total + d[key], 0);
    result.set(taskId, {
      days,
      rawMs: sum('rawMs'),
      billedMinutes: sum('billedMinutes'),
      invoicedMinutes: sum('invoicedMinutes'),
      unbilledMinutes: sum('unbilledMinutes'),
    });
  });
  return result;
};

export const emptyTaskBilling = () => ({
  days: [], rawMs: 0, billedMinutes: 0, invoicedMinutes: 0, unbilledMinutes: 0,
});

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
