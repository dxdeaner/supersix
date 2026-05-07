import { useState, useEffect, useRef, useMemo } from 'react';
import Icon from './Icon';
import useFocusTrap from '../hooks/useFocusTrap';
import api from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtRange(start, end) {
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  const s = new Date(start + 'T12:00:00').toLocaleDateString(undefined, opts);
  const e = new Date(end + 'T12:00:00').toLocaleDateString(undefined, opts);
  return start === end ? s : `${s} – ${e}`;
}

function fmtDue(isoUtc) {
  return new Date(isoUtc).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function fmtTime(isoUtc) {
  return new Date(isoUtc).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
}

// ─── Summary builder ─────────────────────────────────────────────────────────

function buildSummary(reportData, lookingAhead, range, userName, showAutoLogs) {
  const { tasks, journal } = reportData;

  // Tasks grouped by board
  const byBoard = {};
  tasks.forEach(t => {
    if (!byBoard[t.boardName]) byBoard[t.boardName] = [];
    byBoard[t.boardName].push(t);
  });

  // Journal: manual entries (+ auto if toggled), exclude task_promoted
  const entries = journal.filter(j =>
    j.autoType !== 'task_promoted' &&
    (j.entryType === 'manual' || showAutoLogs)
  );

  const wins       = entries.filter(j => j.tag === 'win');
  const blockers   = entries.filter(j => j.tag === 'blocker');
  const keyNotes   = entries.filter(j =>
    j.entryType === 'manual' &&
    j.tag !== 'win' &&
    j.tag !== 'blocker'
  );

  // Metrics
  const totalTasks = tasks.length;
  const boardCount = Object.keys(byBoard).length;
  const tasksWithDue = tasks.filter(t => t.dueDate);
  const onTime = tasksWithDue.filter(t => t.completedAt <= t.dueDate).length;
  const onTimeRate = tasksWithDue.length > 0
    ? Math.round((onTime / tasksWithDue.length) * 100)
    : null;
  const healthScore = (wins.length + blockers.length) > 0
    ? Math.round((wins.length / (wins.length + blockers.length)) * 100)
    : null;

  const dateLabel = fmtRange(range.start, range.end);

  return { byBoard, wins, blockers, keyNotes, totalTasks, boardCount, onTimeRate, healthScore, dateLabel, userName };
}

// ─── HTML generator (for clipboard rich text) ────────────────────────────────

function buildHtml(summary, lookingAhead) {
  const { byBoard, wins, blockers, keyNotes, totalTasks, boardCount, onTimeRate, healthScore, dateLabel, userName } = summary;

  const tag = (label, color) =>
    `<span style="display:inline-block;font-size:11px;padding:1px 7px;border-radius:10px;background:${color}20;color:${color};border:1px solid ${color}40;margin-right:4px;">${label}</span>`;

  const TAG_COLORS = {
    blocker: '#ef4444', decision: '#a855f7', delegated: '#f97316',
    idea: '#eab308', learning: '#14b8a6', meeting: '#6366f1',
    note: '#94a3b8', opportunity: '#06b6d4', reflection: '#60a5fa',
    waiting: '#f59e0b', win: '#22c55e',
  };

  let html = `
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1e293b;max-width:680px;line-height:1.6;">
  <h1 style="font-size:20px;font-weight:700;margin:0 0 2px;color:#0f172a;">Status Report</h1>
  <p style="margin:0 0 16px;color:#64748b;font-size:13px;">${dateLabel}${userName ? ` &nbsp;·&nbsp; ${userName}` : ''}</p>
  <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 20px;" />

  <h2 style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#475569;margin:0 0 8px;">Summary</h2>
  <p style="margin:0 0 20px;color:#1e293b;">
    ${totalTasks} task${totalTasks !== 1 ? 's' : ''} completed across ${boardCount} board${boardCount !== 1 ? 's' : ''}${
      onTimeRate != null ? `, with a <strong>${onTimeRate}%</strong> on-time rate` : ''
    }${
      healthScore != null ? ` and a <strong>${healthScore}%</strong> health score (${summary.wins.length} win${summary.wins.length !== 1 ? 's' : ''}, ${summary.blockers.length} blocker${summary.blockers.length !== 1 ? 's' : ''})` : ''
    }.
  </p>`;

  // Completed tasks by board
  if (totalTasks > 0) {
    html += `<h2 style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#475569;margin:0 0 10px;">Completed Tasks</h2>`;
    Object.entries(byBoard).forEach(([board, tasks]) => {
      html += `<p style="margin:0 0 4px;font-weight:600;color:#334155;">${board}</p><ul style="margin:0 0 14px;padding-left:20px;">`;
      tasks.forEach(t => {
        html += `<li style="margin-bottom:4px;color:#1e293b;">${t.title}`;
        if (t.result) html += ` <span style="color:#64748b;font-size:13px;">— ${t.result}</span>`;
        html += `</li>`;
      });
      html += `</ul>`;
    });
  }

  // Wins
  if (wins.length > 0) {
    html += `<h2 style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#16a34a;margin:0 0 8px;">Highlights &amp; Wins</h2><ul style="margin:0 0 20px;padding-left:20px;">`;
    wins.forEach(w => {
      html += `<li style="margin-bottom:4px;color:#1e293b;">${w.content}</li>`;
    });
    html += `</ul>`;
  }

  // Blockers
  if (blockers.length > 0) {
    html += `<h2 style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#dc2626;margin:0 0 8px;">Challenges &amp; Blockers</h2><ul style="margin:0 0 20px;padding-left:20px;">`;
    blockers.forEach(b => {
      html += `<li style="margin-bottom:4px;color:#1e293b;">${b.content}</li>`;
    });
    html += `</ul>`;
  }

  // Key notes
  if (keyNotes.length > 0) {
    html += `<h2 style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#475569;margin:0 0 8px;">Key Notes</h2><ul style="margin:0 0 20px;padding-left:20px;">`;
    keyNotes.forEach(n => {
      html += `<li style="margin-bottom:6px;color:#1e293b;">`;
      if (n.tag) html += tag(n.tag, TAG_COLORS[n.tag] || '#64748b');
      html += `${n.content}</li>`;
    });
    html += `</ul>`;
  }

  // Looking ahead
  const hasFuture = lookingAhead?.futureDue?.length > 0;
  const hasBlocked = lookingAhead?.blocked?.length > 0;
  if (hasFuture || hasBlocked) {
    html += `<h2 style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#475569;margin:0 0 8px;">Looking Ahead</h2>`;
    if (hasFuture) {
      html += `<p style="margin:0 0 4px;font-weight:600;color:#334155;">Due Soon</p><ul style="margin:0 0 12px;padding-left:20px;">`;
      lookingAhead.futureDue.forEach(t => {
        html += `<li style="margin-bottom:4px;color:#1e293b;">${t.title} <span style="color:#64748b;font-size:13px;">(due ${fmtDue(t.dueDate)})</span> <span style="color:#94a3b8;font-size:12px;">[${t.boardName}]</span></li>`;
      });
      html += `</ul>`;
    }
    if (hasBlocked) {
      html += `<p style="margin:0 0 4px;font-weight:600;color:#dc2626;">Active Blockers</p><ul style="margin:0 0 12px;padding-left:20px;">`;
      lookingAhead.blocked.forEach(t => {
        html += `<li style="margin-bottom:4px;color:#1e293b;">${t.title} <span style="color:#94a3b8;font-size:12px;">[${t.boardName}]</span></li>`;
      });
      html += `</ul>`;
    }
  }

  html += `</div>`;
  return html;
}

// ─── Plain text generator ─────────────────────────────────────────────────────

function buildPlainText(summary, lookingAhead) {
  const { byBoard, wins, blockers, keyNotes, totalTasks, boardCount, onTimeRate, healthScore, dateLabel, userName } = summary;
  const lines = [];

  lines.push('STATUS REPORT');
  lines.push(dateLabel + (userName ? `  ·  ${userName}` : ''));
  lines.push('─'.repeat(50));
  lines.push('');

  lines.push('SUMMARY');
  let summaryLine = `${totalTasks} task${totalTasks !== 1 ? 's' : ''} completed across ${boardCount} board${boardCount !== 1 ? 's' : ''}`;
  if (onTimeRate != null) summaryLine += `, ${onTimeRate}% on-time`;
  if (healthScore != null) summaryLine += `, ${healthScore}% health score`;
  lines.push(summaryLine + '.');
  lines.push('');

  if (totalTasks > 0) {
    lines.push('COMPLETED TASKS');
    Object.entries(byBoard).forEach(([board, tasks]) => {
      lines.push(`  ${board}`);
      tasks.forEach(t => {
        lines.push(`    ✓ ${t.title}${t.result ? ` — ${t.result}` : ''}`);
      });
    });
    lines.push('');
  }

  if (wins.length > 0) {
    lines.push('HIGHLIGHTS & WINS');
    wins.forEach(w => lines.push(`  • ${w.content}`));
    lines.push('');
  }

  if (blockers.length > 0) {
    lines.push('CHALLENGES & BLOCKERS');
    blockers.forEach(b => lines.push(`  • ${b.content}`));
    lines.push('');
  }

  if (keyNotes.length > 0) {
    lines.push('KEY NOTES');
    keyNotes.forEach(n => lines.push(`  • ${n.tag ? `[${n.tag}] ` : ''}${n.content}`));
    lines.push('');
  }

  const hasFuture = lookingAhead?.futureDue?.length > 0;
  const hasBlocked = lookingAhead?.blocked?.length > 0;
  if (hasFuture || hasBlocked) {
    lines.push('LOOKING AHEAD');
    if (hasFuture) {
      lines.push('  Due Soon:');
      lookingAhead.futureDue.forEach(t => {
        lines.push(`    → ${t.title} (due ${fmtDue(t.dueDate)}) [${t.boardName}]`);
      });
    }
    if (hasBlocked) {
      lines.push('  Active Blockers:');
      lookingAhead.blocked.forEach(t => {
        lines.push(`    ⛔ ${t.title} [${t.boardName}]`);
      });
    }
  }

  return lines.join('\n');
}

// ─── Modal ───────────────────────────────────────────────────────────────────

const ReportSummaryModal = ({ isOpen, onClose, reportData, range, userName }) => {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen, onClose);

  const [lookingAhead, setLookingAhead] = useState(null);
  const [lookingLoading, setLookingLoading] = useState(false);
  const [showAutoLogs, setShowAutoLogs] = useState(false);
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'copied' | 'error'
  const [copyPlainState, setCopyPlainState] = useState('idle');

  useEffect(() => {
    if (!isOpen) return;
    setLookingAhead(null);
    setLookingLoading(true);
    api.getLookingAhead()
      .then(data => setLookingAhead(data))
      .catch(() => setLookingAhead({ futureDue: [], blocked: [] }))
      .finally(() => setLookingLoading(false));
  }, [isOpen]);

  const summary = useMemo(() => {
    if (!reportData) return null;
    return buildSummary(reportData, lookingAhead, range, userName, showAutoLogs);
  }, [reportData, lookingAhead, range, userName, showAutoLogs]);

  const subject = summary ? `Status Report: ${summary.dateLabel}` : '';

  const handleCopyRich = async () => {
    if (!summary) return;
    try {
      const html = buildHtml(summary, lookingAhead);
      const plain = buildPlainText(summary, lookingAhead);
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2500);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  const handleCopyPlain = async () => {
    if (!summary) return;
    try {
      const plain = buildPlainText(summary, lookingAhead);
      await navigator.clipboard.writeText(plain);
      setCopyPlainState('copied');
      setTimeout(() => setCopyPlainState('idle'), 2500);
    } catch {
      setCopyPlainState('error');
      setTimeout(() => setCopyPlainState('idle'), 2500);
    }
  };

  const handleCopySubject = async () => {
    try {
      await navigator.clipboard.writeText(subject);
    } catch {}
  };

  if (!isOpen) return null;

  const { byBoard, wins, blockers, keyNotes, totalTasks, boardCount, onTimeRate, healthScore, dateLabel } = summary || {};

  const hasFuture = lookingAhead?.futureDue?.length > 0;
  const hasBlocked = lookingAhead?.blocked?.length > 0;

  const TAG_STYLES = {
    blocker:     'bg-red-500/20 text-red-400 border-red-500/30',
    decision:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    delegated:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
    idea:        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    learning:    'bg-teal-500/20 text-teal-400 border-teal-500/30',
    meeting:     'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    note:        'bg-slate-400/20 text-slate-300 border-slate-400/30',
    opportunity: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    reflection:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    waiting:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
    win:         'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-modal-title"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Icon name="file-text" size={18} className="text-cyan-400" />
            <h2 id="summary-modal-title" className="text-white font-semibold text-base">
              Status Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Subject line */}
        <div className="px-6 pt-4 pb-0">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wide shrink-0">Subject</span>
            <span className="text-slate-300 text-sm flex-1 truncate">{subject}</span>
            <button
              onClick={handleCopySubject}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              title="Copy subject"
            >
              <Icon name="copy" size={13} />
            </button>
          </div>
        </div>

        {/* Document preview */}
        {!summary ? (
          <div className="px-6 py-12 text-center text-slate-500">Loading…</div>
        ) : (
          <div className="px-6 pt-5 pb-2 space-y-5">

            {/* Summary paragraph */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Summary</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {totalTasks} task{totalTasks !== 1 ? 's' : ''} completed across {boardCount} board{boardCount !== 1 ? 's' : ''}
                {onTimeRate != null && <>, with a <span className="text-white font-medium">{onTimeRate}%</span> on-time rate</>}
                {healthScore != null && (
                  <> and a{' '}
                    <span className={`font-medium ${healthScore >= 70 ? 'text-green-400' : healthScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {healthScore}%
                    </span>{' '}
                    health score ({wins.length} win{wins.length !== 1 ? 's' : ''}, {blockers.length} blocker{blockers.length !== 1 ? 's' : ''})
                  </>
                )}.
              </p>
            </div>

            {/* Completed tasks by board */}
            {totalTasks > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Completed Tasks</p>
                <div className="space-y-3">
                  {Object.entries(byBoard).map(([board, bTasks]) => (
                    <div key={board}>
                      <p className="text-slate-300 text-sm font-semibold mb-1">{board}</p>
                      <ul className="space-y-1 pl-3">
                        {bTasks.map(t => (
                          <li key={t.id} className="flex items-start gap-2 text-sm">
                            <Icon name="check-circle" size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                            <span className="text-slate-300">{t.title}</span>
                            {t.result && (
                              <span className="text-slate-500 text-xs mt-0.5">— {t.result}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wins */}
            {wins.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-2">Highlights &amp; Wins</p>
                <ul className="space-y-1 pl-3">
                  {wins.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                      {w.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Blockers */}
            {blockers.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-2">Challenges &amp; Blockers</p>
                <ul className="space-y-1 pl-3">
                  {blockers.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-red-400 mt-0.5 shrink-0">•</span>
                      {b.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key notes */}
            {keyNotes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Key Notes</p>
                <ul className="space-y-1.5 pl-3">
                  {keyNotes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-slate-500 mt-0.5 shrink-0">•</span>
                      <span>
                        {n.tag && (
                          <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full border mr-1.5 ${TAG_STYLES[n.tag] || ''}`}>
                            {n.tag}
                          </span>
                        )}
                        <span className="text-slate-300">{n.content}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Looking ahead */}
            {lookingLoading ? (
              <div className="text-slate-600 text-sm italic">Loading upcoming tasks…</div>
            ) : (hasFuture || hasBlocked) ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Looking Ahead</p>
                <div className="space-y-3">
                  {hasFuture && (
                    <div>
                      <p className="text-slate-400 text-xs font-medium mb-1">Due Soon</p>
                      <ul className="space-y-1 pl-3">
                        {lookingAhead.futureDue.map(t => (
                          <li key={t.id} className="flex items-start gap-2 text-sm">
                            <Icon name="clock" size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                            <span className="text-slate-300">{t.title}</span>
                            <span className="text-slate-500 text-xs mt-0.5 ml-auto shrink-0">
                              {fmtDue(t.dueDate)} · {t.boardName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hasBlocked && (
                    <div>
                      <p className="text-red-400 text-xs font-medium mb-1">Active Blockers</p>
                      <ul className="space-y-1 pl-3">
                        {lookingAhead.blocked.map(t => (
                          <li key={t.id} className="flex items-start gap-2 text-sm">
                            <Icon name="alert-triangle" size={13} className="text-red-400 mt-0.5 shrink-0" />
                            <span className="text-slate-300">{t.title}</span>
                            <span className="text-slate-500 text-xs mt-0.5 ml-auto shrink-0">{t.boardName}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Empty state */}
            {totalTasks === 0 && wins.length === 0 && blockers.length === 0 && keyNotes.length === 0 && (
              <p className="text-slate-500 italic text-sm text-center py-4">No activity in this date range.</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-700 mt-2">
          {/* Auto-log toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setShowAutoLogs(v => !v)}
              className={`w-8 h-4.5 rounded-full relative transition-colors ${showAutoLogs ? 'bg-cyan-600' : 'bg-slate-700'}`}
              style={{ width: '32px', height: '18px' }}
            >
              <span
                className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${showAutoLogs ? 'translate-x-3.5' : 'translate-x-0.5'}`}
                style={{ width: '14px', height: '14px' }}
              />
            </div>
            <span className="text-slate-400 text-xs">Include auto-logs</span>
          </label>

          {/* Copy buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPlain}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Icon name={copyPlainState === 'copied' ? 'check' : 'copy'} size={13} />
              {copyPlainState === 'copied' ? 'Copied!' : 'Plain Text'}
            </button>
            <button
              onClick={handleCopyRich}
              className="px-4 py-1.5 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors flex items-center gap-1.5 font-medium"
            >
              <Icon name={copyState === 'copied' ? 'check' : copyState === 'error' ? 'alert-circle' : 'clipboard'} size={13} />
              {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Failed' : 'Copy for Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSummaryModal;
