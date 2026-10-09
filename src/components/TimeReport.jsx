import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from './Icon';
import api from '../services/api';
import useNow from '../hooks/useNow';
import {
  allocateBoardBilling, effectiveRate, billedAmount, entryMs,
  formatMinutes, formatRawMs, formatUsd, formatDayLabel, formatTimeOfDay,
} from '../utils/timeTracking';

const BOARD_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#fb923c', '#94a3b8'];

const pad = (n) => String(n).padStart(2, '0');

function enumerateDays(start, end) {
  const days = [];
  const cur = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  while (cur <= last) {
    days.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const shortDate = (dateKey) =>
  new Date(dateKey + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const rangeLabel = (range) => {
  const end = new Date(range.end + 'T12:00:00');
  return range.start === range.end
    ? end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : `${shortDate(range.start)} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const hours2 = (minutes) => (minutes / 60).toFixed(2);

const csvCell = (value) => {
  const str = value == null ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// ─── Aggregation ─────────────────────────────────────────────────────────────

// filter: 'all' | 'unbilled' | 'invoiced'. Day/task billedMinutes and amounts reflect the filter.
// Unbilled time is priced at the current rate; invoiced time at the rate saved on its invoice.
function buildReport(entries, now, filter = 'all') {
  const taskMap = new Map();
  entries.forEach(e => {
    if (!taskMap.has(e.taskId)) {
      taskMap.set(e.taskId, {
        taskId: e.taskId,
        title: e.taskTitle,
        status: e.taskStatus,
        boardId: e.boardId,
        boardName: e.boardName,
        taskRate: e.taskRate,
        boardRate: e.boardRate,
        entries: [],
      });
    }
    taskMap.get(e.taskId).entries.push(e);
  });

  // Rounding is pooled per board, day and rate, so allocate across all entries at once
  const billing = allocateBoardBilling(entries, now);

  const tasks = [...taskMap.values()].map(t => {
    const summary = billing.get(t.taskId);
    const rate = effectiveRate(t.taskRate, t.boardRate);

    const days = summary.days.map(day => {
      const invoicedRate = day.entries.find(e => e.invoiceId && e.invoicedRate != null)?.invoicedRate ?? rate;
      const unbilledAmt = billedAmount(day.unbilledMinutes, rate);
      const invoicedAmt = billedAmount(day.invoicedMinutes, invoicedRate);
      let minutes, amount, dayEntries;
      if (filter === 'unbilled') {
        minutes = day.unbilledMinutes; amount = unbilledAmt;
        dayEntries = day.entries.filter(e => !e.invoiceId);
      } else if (filter === 'invoiced') {
        minutes = day.invoicedMinutes; amount = invoicedAmt;
        dayEntries = day.entries.filter(e => e.invoiceId);
      } else {
        minutes = day.billedMinutes;
        amount = unbilledAmt == null && invoicedAmt == null ? null : (unbilledAmt || 0) + (invoicedAmt || 0);
        dayEntries = day.entries;
      }
      const rawMs = dayEntries.reduce((sum, e) => sum + entryMs(e, now), 0);
      return { ...day, billedMinutes: minutes, amount, rawMs, entries: dayEntries };
    }).filter(day => day.entries.length > 0);

    const priced = days.filter(d => d.amount != null);
    return {
      ...t,
      days,
      rawMs: days.reduce((sum, d) => sum + d.rawMs, 0),
      billedMinutes: days.reduce((sum, d) => sum + d.billedMinutes, 0),
      rate,
      rateSource: t.taskRate != null ? 'task' : t.boardRate != null ? 'board' : null,
      amount: priced.length ? priced.reduce((sum, d) => sum + d.amount, 0) : null,
      running: days.some(d => d.entries.some(e => !e.endedAt)),
    };
  }).filter(t => t.days.length > 0);

  const boardMap = new Map();
  tasks.forEach(t => {
    if (!boardMap.has(t.boardId)) {
      boardMap.set(t.boardId, { boardId: t.boardId, name: t.boardName, tasks: [], billedMinutes: 0, rawMs: 0, amount: 0, unratedMinutes: 0 });
    }
    const b = boardMap.get(t.boardId);
    b.tasks.push(t);
    b.billedMinutes += t.billedMinutes;
    b.rawMs += t.rawMs;
    if (t.amount != null) b.amount += t.amount;
    else b.unratedMinutes += t.billedMinutes;
  });

  const boards = [...boardMap.values()]
    .map(b => ({ ...b, tasks: b.tasks.sort((x, y) => y.billedMinutes - x.billedMinutes) }))
    .sort((x, y) => y.billedMinutes - x.billedMinutes);

  return boards;
}

function sumBoards(boards) {
  return boards.reduce((acc, b) => ({
    billedMinutes: acc.billedMinutes + b.billedMinutes,
    rawMs: acc.rawMs + b.rawMs,
    amount: acc.amount + b.amount,
    unratedMinutes: acc.unratedMinutes + b.unratedMinutes,
  }), { billedMinutes: 0, rawMs: 0, amount: 0, unratedMinutes: 0 });
}

// ─── Exports ─────────────────────────────────────────────────────────────────

function buildCsv(boards) {
  const rows = [];
  boards.forEach(b => b.tasks.forEach(t => t.days.forEach(day => {
    const notes = day.entries.map(e => e.note).filter(Boolean).join('; ');
    const amount = day.amount;
    rows.push([
      day.date, b.name, t.title,
      (day.rawMs / 3600000).toFixed(2),
      hours2(day.billedMinutes),
      t.rate != null ? t.rate.toFixed(2) : '',
      amount != null ? amount.toFixed(2) : '',
      notes,
    ]);
  })));
  rows.sort((x, y) => x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]) || x[2].localeCompare(y[2]));

  const header = ['Date', 'Board', 'Task', 'Raw Hours', 'Billed Hours', 'Rate (USD)', 'Amount (USD)', 'Notes'];
  return [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
}

function buildSummaryText(boards, totals, range) {
  const lines = [`Time report — ${rangeLabel(range)}`, ''];
  boards.forEach(b => {
    const money = b.amount > 0 ? ` · ${formatUsd(b.amount)}` : '';
    const unrated = b.unratedMinutes > 0 ? ` (${formatMinutes(b.unratedMinutes)} without a rate)` : '';
    lines.push(`${b.name} — ${formatMinutes(b.billedMinutes)}${money}${unrated}`);
    b.tasks.forEach(t => {
      const priced = t.rate != null ? ` @ ${formatUsd(t.rate)}/hr = ${formatUsd(t.amount)}` : '';
      lines.push(`  • ${t.title} — ${formatMinutes(t.billedMinutes)}${priced}`);
    });
    lines.push('');
  });
  lines.push(`Total: ${formatMinutes(totals.billedMinutes)} billed${totals.amount > 0 ? ` · ${formatUsd(totals.amount)}` : ''}`);
  return lines.join('\n');
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-1">
    <span className="text-slate-400 text-xs uppercase tracking-wide">{label}</span>
    <span className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</span>
    {sub && <span className="text-slate-500 text-xs">{sub}</span>}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const rows = payload.filter(p => p.value > 0);
  if (rows.length === 0) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white shadow-lg">
      <div className="text-slate-400 text-xs mb-0.5">{label}</div>
      {rows.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 text-slate-300">{formatMinutes(Math.round(p.value * 60))}</span>
        </div>
      ))}
    </div>
  );
};

const TaskRow = ({ task }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-slate-700/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_7rem_5rem_6rem] gap-x-3 items-center px-4 py-2 text-left text-sm hover:bg-slate-700/30 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} className="text-slate-500 shrink-0" />
          {task.status === 'completed' && <Icon name="check-circle" size={12} className="text-cyan-400 shrink-0" />}
          <span className="text-slate-200 truncate">{task.title}</span>
          {task.running && (
            <span className="shrink-0 text-[10px] px-1.5 rounded-full bg-green-600/20 text-green-300">running</span>
          )}
        </span>
        <span className="hidden sm:block text-xs text-slate-400 text-right">
          {task.rate != null
            ? <>{formatUsd(task.rate)}/hr <span className="text-slate-600">{task.rateSource === 'task' ? 'task' : 'board'}</span></>
            : <span className="text-amber-400/80">no rate</span>}
        </span>
        <span className="text-slate-200 text-right whitespace-nowrap">
          {formatMinutes(task.billedMinutes)}
          <span className="sm:hidden text-slate-500 text-xs ml-2">{task.amount != null ? formatUsd(task.amount) : ''}</span>
        </span>
        <span className="hidden sm:block text-right text-green-400">{task.amount != null ? formatUsd(task.amount) : '—'}</span>
      </button>

      {open && (
        <div className="px-4 pb-3 pl-9 space-y-2">
          {task.days.map(day => (
            <div key={day.date} className="text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{formatDayLabel(day.date)}</span>
                <span>{formatRawMs(day.rawMs)} → <span className="text-slate-200">{formatMinutes(day.billedMinutes)}</span></span>
              </div>
              {day.entries.map(e => (
                <div key={e.id} className="flex gap-2 text-slate-500 pl-2">
                  <span className="whitespace-nowrap">
                    {formatTimeOfDay(e.startedAt)} – {e.endedAt ? formatTimeOfDay(e.endedAt) : 'now'}
                  </span>
                  {e.note && <span className="truncate text-slate-400" title={e.note}>{e.note}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const TimeReport = ({ range }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBoards, setSelectedBoards] = useState([]); // empty = all
  const [billing, setBilling] = useState('all'); // 'all' | 'unbilled' | 'invoiced'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!range.start || !range.end) return;
    let cancelled = false;
    setLoading(true);
    api.getTimeReport(range.start, range.end)
      .then(data => { if (!cancelled) { setEntries(data.entries); setError(null); } })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range.start, range.end]);

  const hasRunning = entries.some(e => !e.endedAt);
  const now = useNow(hasRunning, 30000);

  const allBoards = useMemo(() => buildReport(entries, now, billing), [entries, now, billing]);

  // Stable color per board (by order of first appearance in the unfiltered report)
  const boardColors = useMemo(() => {
    const map = {};
    allBoards.forEach((b, i) => { map[b.boardId] = BOARD_COLORS[i % BOARD_COLORS.length]; });
    return map;
  }, [allBoards]);

  const boards = selectedBoards.length === 0
    ? allBoards
    : allBoards.filter(b => selectedBoards.includes(b.boardId));
  const totals = sumBoards(boards);

  const chartData = useMemo(() => {
    const days = enumerateDays(range.start, range.end);
    const rows = days.map(d => ({ date: shortDate(d), _key: d }));
    const index = Object.fromEntries(days.map((d, i) => [d, i]));
    boards.forEach(b => b.tasks.forEach(t => t.days.forEach(day => {
      const row = rows[index[day.date]];
      if (row) row[`b${b.boardId}`] = (row[`b${b.boardId}`] || 0) + day.billedMinutes / 60;
    })));
    return rows;
  }, [boards, range.start, range.end]);

  const toggleBoard = (boardId) => {
    setSelectedBoards(prev => prev.includes(boardId) ? prev.filter(id => id !== boardId) : [...prev, boardId]);
  };

  const exportCsv = () => {
    downloadFile(`time-report_${billing === 'all' ? '' : billing + '_'}${range.start}_${range.end}.csv`, buildCsv(boards), 'text/csv;charset=utf-8');
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText(boards, totals, range));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-16">Loading time report…</div>;
  }
  if (error) {
    return <div className="text-red-400 text-center py-16" role="alert">{error}</div>;
  }
  if (entries.length === 0) {
    return <div className="text-slate-500 italic text-center py-16">No time tracked in this date range</div>;
  }

  return (
    <div>
      {/* Billing status */}
      <div className="flex gap-1 mb-3" role="group" aria-label="Billing status">
        {[
          { id: 'all', label: 'All' },
          { id: 'unbilled', label: 'Unbilled' },
          { id: 'invoiced', label: 'Invoiced' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setBilling(f.id)}
            aria-pressed={billing === f.id}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              billing === f.id ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {allBoards.length === 0 ? (
        <div className="text-slate-500 italic text-center py-16">No {billing} time in this date range</div>
      ) : (<>
      {/* Board filter + exports */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {allBoards.length > 1 && allBoards.map(b => {
          const active = selectedBoards.includes(b.boardId);
          return (
            <button
              key={b.boardId}
              onClick={() => toggleBoard(b.boardId)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                active ? 'bg-slate-700 border-slate-500 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
              aria-pressed={active}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: boardColors[b.boardId] }} />
              {b.name}
            </button>
          );
        })}
        {selectedBoards.length > 0 && (
          <button onClick={() => setSelectedBoards([])} className="text-xs text-slate-500 hover:text-slate-300">
            Show all
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={copySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm rounded-lg transition-colors"
          >
            <Icon name={copied ? 'check' : 'clipboard'} size={14} />
            {copied ? 'Copied!' : 'Copy summary'}
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-sm rounded-lg transition-colors"
          >
            <Icon name="file-text" size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Billed Time" value={formatMinutes(totals.billedMinutes)} sub={`${hours2(totals.billedMinutes)} hours`} />
        <StatCard label="Billed Amount" value={formatUsd(totals.amount)} color="text-green-400" />
        <StatCard
          label="Raw Time"
          value={formatRawMs(totals.rawMs)}
          sub={totals.billedMinutes > 0 ? `${formatMinutes(Math.max(0, totals.billedMinutes - Math.floor(totals.rawMs / 60000)))} added by rounding` : null}
        />
        <StatCard
          label="No Rate Set"
          value={formatMinutes(totals.unratedMinutes)}
          sub={totals.unratedMinutes > 0 ? 'Billed time not priced' : 'Everything is priced'}
          color={totals.unratedMinutes > 0 ? 'text-amber-400' : 'text-slate-400'}
        />
      </div>

      {/* Billed hours per day, stacked by board */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Billed Hours Per Day</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
            {boards.map((b, i) => (
              <Bar
                key={b.boardId}
                dataKey={`b${b.boardId}`}
                name={b.name}
                stackId="time"
                fill={boardColors[b.boardId]}
                radius={i === boards.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Board → task breakdown */}
      <div className="space-y-4">
        {boards.map(b => (
          <div key={b.boardId} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: boardColors[b.boardId] }} />
              <span className="text-white font-medium">{b.name}</span>
              <span className="text-slate-500 text-xs">{formatRawMs(b.rawMs)} raw</span>
              <span className="ml-auto text-slate-200 text-sm">{formatMinutes(b.billedMinutes)}</span>
              <span className="text-green-400 text-sm font-medium w-24 text-right">{formatUsd(b.amount)}</span>
            </div>
            {b.tasks.map(t => <TaskRow key={t.taskId} task={t} />)}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-4 px-4 text-sm">
        <span className="text-slate-400">Total</span>
        <span className="text-white font-medium">{formatMinutes(totals.billedMinutes)}</span>
        <span className="text-green-400 font-medium w-24 text-right">{formatUsd(totals.amount)}</span>
      </div>
      </>)}
    </div>
  );
};

export default TimeReport;
