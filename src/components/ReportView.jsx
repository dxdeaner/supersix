import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Icon from './Icon';

// ─── Date helpers ────────────────────────────────────────────────────────────

function toLocalDateStr(isoUtc) {
  const d = new Date(isoUtc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(isoUtc) {
  return new Date(isoUtc).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function enumerateDays(start, end) {
  const days = [];
  const cur = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  while (cur <= last) {
    days.push(toLocalDateStr(cur.toISOString()));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getPresetRange(preset) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);

  if (preset === 'today') {
    return { start: today, end: today };
  }
  if (preset === 'this-week') {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return { start: fmt(mon), end: today };
  }
  if (preset === 'last-week') {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: fmt(mon), end: fmt(sun) };
  }
  if (preset === 'this-month') {
    const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    return { start, end: today };
  }
  if (preset === 'last-month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: fmt(first), end: fmt(last) };
  }
  return { start: '', end: '' };
}

// ─── Derived metrics ─────────────────────────────────────────────────────────

function useMetrics(reportData) {
  return useMemo(() => {
    if (!reportData) return null;
    const { tasks, journal } = reportData;

    // Stats
    const tasksWithDue = tasks.filter(t => t.dueDate);
    const onTime = tasksWithDue.filter(t => t.completedAt <= t.dueDate).length;
    const onTimeRate = tasksWithDue.length > 0 ? Math.round((onTime / tasksWithDue.length) * 100) : null;

    const taggedJournal = journal.filter(j => j.tag);
    const wins = taggedJournal.filter(j => j.tag === 'win').length;
    const blockers = taggedJournal.filter(j => j.tag === 'blocker').length;
    const ideas = taggedJournal.filter(j => j.tag === 'idea').length;
    const reflections = taggedJournal.filter(j => j.tag === 'reflection').length;
    const healthScore = (wins + blockers) > 0 ? Math.round((wins / (wins + blockers)) * 100) : null;

    // Daily output data (filled with 0s)
    const dailyCounts = {};
    tasks.forEach(t => {
      const day = toLocalDateStr(t.completedAt);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    // Time-of-day buckets
    const bands = { 'Night\n12–6am': 0, 'Morning\n6am–12pm': 0, 'Afternoon\n12–6pm': 0, 'Evening\n6pm–12am': 0 };
    tasks.forEach(t => {
      const h = new Date(t.completedAt).getHours();
      if (h < 6) bands['Night\n12–6am']++;
      else if (h < 12) bands['Morning\n6am–12pm']++;
      else if (h < 18) bands['Afternoon\n12–6pm']++;
      else bands['Evening\n6pm–12am']++;
    });
    const timeData = Object.entries(bands).map(([name, count]) => ({ name, count }));

    // Journal tag pie
    const tagData = [
      { name: 'Wins', value: wins, color: '#22c55e' },
      { name: 'Blockers', value: blockers, color: '#ef4444' },
      { name: 'Ideas', value: ideas, color: '#eab308' },
      { name: 'Reflections', value: reflections, color: '#60a5fa' },
    ].filter(d => d.value > 0);

    return { onTimeRate, tasksWithDueCount: tasksWithDue.length, wins, blockers, ideas, reflections, healthScore, dailyCounts, timeData, tagData };
  }, [reportData]);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col gap-1">
    <span className="text-slate-400 text-xs uppercase tracking-wide">{label}</span>
    <span className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</span>
    {sub && <span className="text-slate-500 text-xs">{sub}</span>}
  </div>
);

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white shadow-lg">
      {label && <div className="text-slate-400 text-xs mb-0.5">{label}</div>}
      <div>{payload[0].value} {payload[0].value === 1 ? 'task' : 'tasks'}</div>
    </div>
  );
};

const TAG_STYLES = {
  win:        'bg-green-500/20 text-green-400 border-green-500/30',
  blocker:    'bg-red-500/20 text-red-400 border-red-500/30',
  idea:       'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  reflection: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

// ─── Main component ──────────────────────────────────────────────────────────

const ReportView = ({ reportData, reportLoading, onLoad }) => {
  const [preset, setPreset] = useState('this-week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [range, setRange] = useState(() => getPresetRange('this-week'));

  // Load on mount and whenever range changes
  useEffect(() => {
    if (range.start && range.end) {
      onLoad(range.start, range.end);
    }
  }, [range]);

  const metrics = useMetrics(reportData);

  const handlePreset = (p) => {
    setPreset(p);
    if (p === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setRange(getPresetRange(p));
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd || customStart > customEnd) return;
    setRange({ start: customStart, end: customEnd });
  };

  // Daily output chart data: fill in 0s for empty days
  const dailyChartData = useMemo(() => {
    if (!reportData || !metrics) return [];
    const days = enumerateDays(range.start, range.end);
    return days.map(day => ({
      date: formatShortDate(day),
      tasks: metrics.dailyCounts[day] || 0,
    }));
  }, [reportData, metrics, range]);

  // Daily log: merge tasks + journal, group by local date
  const dailyLog = useMemo(() => {
    if (!reportData) return [];
    const items = [
      ...reportData.tasks.map(t => ({ ...t, _type: 'task', _ts: t.completedAt })),
      ...reportData.journal.map(j => ({ ...j, _type: 'journal', _ts: j.createdAt })),
    ].sort((a, b) => a._ts.localeCompare(b._ts));

    const groups = {};
    items.forEach(item => {
      const day = toLocalDateStr(item._ts);
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [reportData]);

  const healthColor = metrics?.healthScore == null ? 'text-slate-400'
    : metrics.healthScore >= 70 ? 'text-green-400'
    : metrics.healthScore >= 40 ? 'text-yellow-400'
    : 'text-red-400';

  const presets = [
    { id: 'today', label: 'Today' },
    { id: 'this-week', label: 'This Week' },
    { id: 'last-week', label: 'Last Week' },
    { id: 'this-month', label: 'This Month' },
    { id: 'last-month', label: 'Last Month' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="w-full px-4 py-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Icon name="bar-chart-2" size={22} className="text-cyan-400" />
        <h2 className="text-2xl font-semibold text-white">Report</h2>
        {reportData && (
          <span className="text-slate-400 text-sm ml-1">
            {formatShortDate(range.start)} – {formatShortDate(range.end)}
          </span>
        )}
      </div>

      {/* Preset Picker */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              preset === p.id
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3 mb-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">From</label>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">To</label>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!customStart || !customEnd || customStart > customEnd}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {reportLoading && (
        <div className="text-slate-400 text-center py-16">Loading report…</div>
      )}

      {!reportLoading && reportData && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Tasks Completed"
              value={reportData.tasks.length}
            />
            <StatCard
              label="On-Time Rate"
              value={metrics.onTimeRate != null ? `${metrics.onTimeRate}%` : '—'}
              sub={metrics.tasksWithDueCount > 0 ? `${metrics.tasksWithDueCount} tasks had due dates` : 'No due dates set'}
              color={
                metrics.onTimeRate == null ? 'text-slate-400'
                : metrics.onTimeRate >= 80 ? 'text-green-400'
                : metrics.onTimeRate >= 50 ? 'text-yellow-400'
                : 'text-red-400'
              }
            />
            <StatCard
              label="Health Score"
              value={metrics.healthScore != null ? `${metrics.healthScore}%` : '—'}
              sub={metrics.wins + metrics.blockers > 0
                ? `${metrics.wins} wins · ${metrics.blockers} blockers`
                : 'No wins or blockers logged'}
              color={healthColor}
            />
            <StatCard
              label="Journal Entries"
              value={reportData.journal.length}
              sub={`${reportData.journal.filter(j => j.entryType === 'manual').length} written · ${reportData.journal.filter(j => j.entryType === 'auto').length} auto`}
            />
          </div>

          {/* Daily Output Chart */}
          {dailyChartData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Tasks Completed Per Day</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dailyChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={dailyChartData.length > 14 ? Math.floor(dailyChartData.length / 7) : 0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                  <Bar dataKey="tasks" fill="#22d3ee" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Time of Day + Journal Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Time of Day */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">When You Complete Tasks</h3>
              {reportData.tasks.length === 0 ? (
                <p className="text-slate-500 text-sm italic py-4 text-center">No tasks completed</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={metrics.timeData} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => v.replace('\n', ' ')}
                    />
                    <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                    <Bar dataKey="count" fill="#818cf8" radius={[0, 3, 3, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Journal Tags Donut */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Journal Tag Breakdown</h3>
              {metrics.tagData.length === 0 ? (
                <p className="text-slate-500 text-sm italic py-4 text-center">No tagged entries</p>
              ) : (
                <div className="flex items-center gap-4">
                  <PieChart width={140} height={140}>
                    <Pie
                      data={metrics.tagData}
                      cx={65}
                      cy={65}
                      innerRadius={38}
                      outerRadius={60}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {metrics.tagData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white shadow-lg">
                            {payload[0].name}: {payload[0].value}
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                  <div className="flex flex-col gap-2">
                    {metrics.tagData.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-300 text-sm">{d.name}</span>
                        <span className="text-slate-500 text-sm ml-auto pl-3">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Log */}
          {dailyLog.length === 0 ? (
            <div className="text-slate-500 italic text-center py-10">
              No activity in this date range
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Activity Log</h3>
              {dailyLog.map(([day, items]) => (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-slate-300 font-medium text-sm">{formatDayHeader(day)}</span>
                    <div className="flex-1 border-t border-slate-700" />
                    <span className="text-slate-600 text-xs">
                      {items.filter(i => i._type === 'task').length} tasks ·{' '}
                      {items.filter(i => i._type === 'journal').length} entries
                    </span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {items.map((item, idx) => (
                      <div key={idx}>
                        {item._type === 'task' ? (
                          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-3">
                            <div className="flex items-start gap-2">
                              <Icon name="check-circle" size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-white text-sm font-medium">{item.title}</span>
                                  <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                                    {item.boardName}
                                  </span>
                                  <span className="text-slate-500 text-xs ml-auto">{formatTime(item.completedAt)}</span>
                                </div>
                                {item.result && (
                                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.result}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-start gap-2 px-4 py-2.5 rounded-lg ${item.entryType === 'auto' ? 'opacity-60' : ''}`}>
                            <span className="text-slate-500 text-xs w-16 shrink-0 pt-0.5">{formatTime(item.createdAt)}</span>
                            <div className="min-w-0 flex-1">
                              {item.tag && (
                                <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full border mr-2 mb-1 ${TAG_STYLES[item.tag] || ''}`}>
                                  {item.tag}
                                </span>
                              )}
                              {item.entryType === 'auto' ? (
                                <span className="text-slate-500 text-sm italic">{item.content}</span>
                              ) : (
                                <span className="text-slate-300 text-sm">{item.content}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportView;
