import { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import api from '../services/api';
import useNow from '../hooks/useNow';
import {
  summarizeTaskTime, effectiveRate, billedAmount, entryMs,
  formatClock, formatMinutes, formatRawMs, formatUsd,
  toLocalInput, fromLocalInput, formatDayLabel, formatTimeOfDay,
} from '../utils/timeTracking';

const inputClass = 'bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-cyan-400 min-w-0';

const emptyDraft = () => {
  const end = new Date();
  end.setSeconds(0, 0);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  return { start: toLocalInput(start.toISOString()), end: toLocalInput(end.toISOString()), note: '' };
};

const EntryEditor = ({ draft, setDraft, isRunning, onSave, onCancel, saving }) => (
  <div className="bg-slate-900/60 rounded p-2 space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <label className="text-[10px] uppercase tracking-wider text-slate-500">
        In
        <input
          type="datetime-local"
          value={draft.start}
          onChange={(e) => setDraft({ ...draft, start: e.target.value })}
          className={`${inputClass} w-full mt-0.5`}
        />
      </label>
      <label className="text-[10px] uppercase tracking-wider text-slate-500">
        Out
        {isRunning ? (
          <div className="mt-0.5 px-2 py-1 text-xs text-green-400">Running…</div>
        ) : (
          <input
            type="datetime-local"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            className={`${inputClass} w-full mt-0.5`}
          />
        )}
      </label>
    </div>
    <input
      type="text"
      value={draft.note}
      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
      onKeyDown={(e) => e.key === 'Enter' && onSave()}
      placeholder="Note (optional)"
      maxLength={500}
      className={`${inputClass} w-full`}
    />
    <div className="flex gap-1.5 justify-end">
      <button
        onClick={onCancel}
        className="bg-slate-600 hover:bg-slate-500 text-white px-2 py-0.5 rounded text-xs transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving || !draft.start || (!isRunning && !draft.end)}
        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white px-2 py-0.5 rounded text-xs transition-colors"
      >
        Save
      </button>
    </div>
  </div>
);

const TimeTracker = ({ task, runningEntry, onStart, onStop, onChanged }) => {
  const [entries, setEntries] = useState([]);
  const [taskRate, setTaskRate] = useState(null);
  const [boardRate, setBoardRate] = useState(null);
  const [rateDraft, setRateDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // entry id, or 'new'
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const isRunningHere = runningEntry?.taskId === task.id;
  const now = useNow(isRunningHere);

  const load = useCallback(async () => {
    try {
      const data = await api.getTaskTime(task.id);
      setEntries(data.entries);
      setTaskRate(data.taskRate);
      setBoardRate(data.boardRate);
      setRateDraft(data.taskRate != null ? String(data.taskRate) : '');
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  // Reload whenever the running timer changes (started/stopped here or elsewhere)
  useEffect(() => { load(); }, [load, runningEntry?.id]);

  const summary = summarizeTaskTime(entries, now);
  const rate = effectiveRate(taskRate, boardRate);
  const amount = billedAmount(summary.billedMinutes, rate);

  const afterMutation = async () => {
    await load();
    onChanged?.();
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const startedAt = fromLocalInput(draft.start);
      const editing = entries.find(e => e.id === editingId);
      const endedAt = editing && !editing.endedAt ? null : fromLocalInput(draft.end);
      if (editingId === 'new') {
        await api.createTimeEntry(task.id, startedAt, endedAt, draft.note);
      } else {
        await api.updateTimeEntry(editingId, startedAt, endedAt, draft.note);
      }
      setEditingId(null);
      await afterMutation();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (entryId) => {
    if (!window.confirm('Delete this time entry?')) return;
    try {
      await api.deleteTimeEntry(entryId);
      await afterMutation();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveRate = async () => {
    const trimmed = rateDraft.trim();
    const next = trimmed === '' ? null : Number(trimmed);
    if (next !== null && (Number.isNaN(next) || next < 0)) {
      setError('Hourly rate must be a positive number');
      return;
    }
    if (next === taskRate) return;
    try {
      const res = await api.setTaskRate(task.id, next);
      setTaskRate(res.taskRate);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setDraft({ start: toLocalInput(entry.startedAt), end: toLocalInput(entry.endedAt), note: entry.note || '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-slate-400 text-xs font-medium uppercase tracking-wider">Time</label>
        {task.status !== 'completed' && (
          isRunningHere ? (
            <button
              onClick={onStop}
              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Icon name="square" size={10} />
              <span>Stop</span>
              <span className="font-mono">{formatClock(entryMs(runningEntry, now))}</span>
            </button>
          ) : (
            <button
              onClick={() => onStart(task.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Icon name="play" size={12} />
              <span>Start timer</span>
            </button>
          )
        )}
      </div>

      {/* Totals + rate */}
      <div className="bg-slate-900/40 rounded p-2.5 mb-2 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-white text-sm font-medium">{formatMinutes(summary.billedMinutes)}</span>
            <span className="text-slate-500 text-xs ml-1.5">billed · {formatRawMs(summary.rawMs)} raw</span>
          </div>
          {amount != null && (
            <span className="text-green-400 text-sm font-medium">{formatUsd(amount)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Rate $</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={rateDraft}
            onChange={(e) => setRateDraft(e.target.value)}
            onBlur={saveRate}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder={boardRate != null ? String(boardRate) : '—'}
            className={`${inputClass} w-20`}
            aria-label="Hourly rate for this task"
          />
          <span>/hr</span>
          <span className="text-slate-500">
            {taskRate != null
              ? 'task override'
              : boardRate != null ? 'board default' : 'no rate set'}
          </span>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mb-2" role="alert">{error}</p>}

      {loading ? (
        <p className="text-slate-500 text-xs">Loading…</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {summary.days.map(day => (
            <div key={day.date}>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>{formatDayLabel(day.date)}</span>
                <span>{formatRawMs(day.rawMs)} → <span className="text-slate-300">{formatMinutes(day.billedMinutes)}</span></span>
              </div>
              <div className="space-y-1">
                {day.entries.map(entry => (
                  editingId === entry.id ? (
                    <EntryEditor
                      key={entry.id}
                      draft={draft}
                      setDraft={setDraft}
                      isRunning={!entry.endedAt}
                      onSave={saveDraft}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  ) : (
                    <div key={entry.id} className="group/entry flex items-center gap-2 text-xs text-slate-300 bg-slate-700/40 rounded px-2 py-1">
                      <span className="whitespace-nowrap">
                        {formatTimeOfDay(entry.startedAt)} – {entry.endedAt ? formatTimeOfDay(entry.endedAt) : <span className="text-green-400">now</span>}
                      </span>
                      <span className="text-slate-500 whitespace-nowrap">{formatRawMs(entryMs(entry, now))}</span>
                      <span className="flex-1 truncate text-slate-400" title={entry.note || ''}>{entry.note}</span>
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                        aria-label="Edit time entry"
                      >
                        <Icon name="edit-3" size={12} />
                      </button>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        aria-label="Delete time entry"
                      >
                        <Icon name="trash-2" size={12} />
                      </button>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}

          {editingId === 'new' ? (
            <EntryEditor
              draft={draft}
              setDraft={setDraft}
              isRunning={false}
              onSave={saveDraft}
              onCancel={() => setEditingId(null)}
              saving={saving}
            />
          ) : (
            <button
              onClick={() => { setDraft(emptyDraft()); setEditingId('new'); }}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <Icon name="plus" size={12} />
              <span>Add entry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
