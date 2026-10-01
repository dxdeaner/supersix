import { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import api from '../services/api';
import { formatMinutes, formatUsd } from '../utils/timeTracking';

const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fmtDate = (dateKey, withYear = true) =>
  new Date(dateKey + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', ...(withYear && { year: 'numeric' }),
  });

const periodLabel = (start, end) =>
  start === end ? fmtDate(end) : `${fmtDate(start, false)} – ${fmtDate(end)}`;

const inputClass = 'bg-slate-700 border border-slate-600 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500';

const csvCell = (value) => {
  const str = value == null ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

function invoiceSummaryText(inv) {
  const lines = [
    inv.number,
    `${inv.boardName} · ${periodLabel(inv.periodStart, inv.periodEnd)} · Issued ${fmtDate(inv.issueDate)}`,
    '',
  ];
  inv.lines.forEach(l => {
    const priced = l.rate != null ? ` @ ${formatUsd(l.rate)}/hr = ${formatUsd(l.amount)}` : '';
    lines.push(`  • ${l.description} — ${formatMinutes(l.minutes)}${priced}`);
  });
  lines.push('', `Total: ${formatMinutes(inv.minutes)} · ${formatUsd(inv.total)}`);
  return lines.join('\n');
}

function invoiceCsv(inv) {
  const rows = [['Task', 'Hours', 'Rate (USD)', 'Amount (USD)']];
  inv.lines.forEach(l => rows.push([
    l.description, (l.minutes / 60).toFixed(2), l.rate != null ? l.rate.toFixed(2) : '', l.amount.toFixed(2),
  ]));
  rows.push(['Total', (inv.minutes / 60).toFixed(2), '', inv.total.toFixed(2)]);
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n');
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

const LinesTable = ({ lines }) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="text-slate-500 text-xs uppercase tracking-wide">
        <th className="text-left font-medium py-1">Task</th>
        <th className="text-right font-medium py-1">Time</th>
        <th className="text-right font-medium py-1 hidden sm:table-cell">Rate</th>
        <th className="text-right font-medium py-1">Amount</th>
      </tr>
    </thead>
    <tbody>
      {lines.map((l, i) => (
        <tr key={i} className="border-t border-slate-700/60">
          <td className="py-1.5 pr-2 text-slate-200">{l.description}</td>
          <td className="py-1.5 text-right text-slate-300 whitespace-nowrap">{formatMinutes(l.minutes)}</td>
          <td className="py-1.5 text-right text-slate-400 hidden sm:table-cell whitespace-nowrap">
            {l.rate != null ? `${formatUsd(l.rate)}/hr` : <span className="text-amber-400/80">no rate</span>}
          </td>
          <td className="py-1.5 text-right text-green-400 whitespace-nowrap">{formatUsd(l.amount)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ─── New invoice panel ───────────────────────────────────────────────────────

const NewInvoice = ({ boards, range, onCreated }) => {
  const [boardId, setBoardId] = useState('');
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);
  const [issueDate, setIssueDate] = useState(todayKey);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Follow the report's date range
  useEffect(() => { setStart(range.start); setEnd(range.end); }, [range.start, range.end]);

  useEffect(() => {
    if (!boardId && boards.length > 0) setBoardId(String(boards[0].id));
  }, [boards, boardId]);

  const loadPreview = useCallback(async () => {
    if (!boardId || !start || !end || start > end) { setPreview(null); return; }
    setLoading(true);
    try {
      setPreview(await api.previewInvoice(boardId, start, end));
      setError(null);
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [boardId, start, end]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const create = async () => {
    setCreating(true);
    try {
      const invoice = await api.createInvoice(boardId, start, end, issueDate);
      setError(null);
      onCreated(invoice);
      loadPreview();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const unpriced = preview?.lines.filter(l => l.rate == null) ?? [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-slate-300 mb-3">New invoice</h3>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Board
          <select value={boardId} onChange={(e) => setBoardId(e.target.value)} className={inputClass}>
            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          From
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          To
          <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Issue date
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} />
        </label>
      </div>

      {error && <p className="text-red-400 text-sm mb-3" role="alert">{error}</p>}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading unbilled time…</p>
      ) : preview && preview.entryCount === 0 ? (
        <p className="text-slate-500 text-sm italic">No unbilled time for this board and period.</p>
      ) : preview ? (
        <>
          {preview.lines.length > 0 ? (
            <LinesTable lines={preview.lines} />
          ) : (
            <p className="text-slate-500 text-sm italic">
              The unbilled entries are covered by already-invoiced rounding — invoicing will just lock them.
            </p>
          )}
          {unpriced.length > 0 && (
            <p className="text-amber-400 text-xs mt-2">
              {unpriced.length} {unpriced.length === 1 ? 'task has' : 'tasks have'} no rate and will invoice at $0. Set a board or task rate first if that’s not intended.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-700">
            <span className="text-slate-400 text-sm">
              Total <span className="text-white font-medium ml-1">{formatMinutes(preview.minutes)}</span>
              <span className="text-green-400 font-medium ml-3">{formatUsd(preview.total)}</span>
            </span>
            <span className="text-slate-500 text-xs">
              Locks {preview.entryCount} time {preview.entryCount === 1 ? 'entry' : 'entries'}
            </span>
            <button
              onClick={create}
              disabled={creating || !issueDate}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              <Icon name="lock" size={14} />
              Create invoice
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

// ─── Invoice row ─────────────────────────────────────────────────────────────

const InvoiceRow = ({ invoice, onStatus, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null); // 'number' | 'summary'
  const isPaid = invoice.status === 'paid';

  const copy = async (kind, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const actionClass = 'flex items-center gap-1 px-2 py-1 rounded text-xs border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-slate-700/30 transition-colors"
        aria-expanded={open}
      >
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={12} className="text-slate-500" />
        <span className="text-white text-sm font-medium break-all">{invoice.number}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${isPaid ? 'bg-green-600/20 text-green-300' : 'bg-amber-500/15 text-amber-300'}`}>
          {isPaid ? 'Paid' : 'Invoiced'}
        </span>
        <span className="ml-auto text-slate-300 text-sm">{formatMinutes(invoice.minutes)}</span>
        <span className="text-green-400 text-sm font-medium w-24 text-right">{formatUsd(invoice.total)}</span>
        <span className="basis-full text-slate-500 text-xs pl-5">
          {invoice.boardName} · {periodLabel(invoice.periodStart, invoice.periodEnd)} · Issued {fmtDate(invoice.issueDate)}
          {isPaid && invoice.paidAt && ` · Paid ${new Date(invoice.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pl-9">
          <LinesTable lines={invoice.lines} />
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => onStatus(invoice, isPaid ? 'invoiced' : 'paid')} className={actionClass}>
              <Icon name={isPaid ? 'rotate-ccw' : 'check-circle'} size={12} />
              {isPaid ? 'Mark unpaid' : 'Mark paid'}
            </button>
            <button onClick={() => copy('number', `${invoice.number}.pdf`)} className={actionClass}>
              <Icon name={copied === 'number' ? 'check' : 'copy'} size={12} />
              {copied === 'number' ? 'Copied!' : 'Copy filename'}
            </button>
            <button onClick={() => copy('summary', invoiceSummaryText(invoice))} className={actionClass}>
              <Icon name={copied === 'summary' ? 'check' : 'clipboard'} size={12} />
              {copied === 'summary' ? 'Copied!' : 'Copy summary'}
            </button>
            <button onClick={() => downloadFile(`${invoice.number}.csv`, invoiceCsv(invoice), 'text/csv;charset=utf-8')} className={actionClass}>
              <Icon name="file-text" size={12} />
              CSV
            </button>
            {!isPaid && (
              <button
                onClick={() => onDelete(invoice)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
              >
                <Icon name="trash-2" size={12} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const InvoicesTab = ({ range }) => {
  const [invoices, setInvoices] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'invoiced' | 'paid'

  const load = useCallback(async () => {
    try {
      const [inv, brd] = await Promise.all([api.getInvoices(), api.getBoards()]);
      setInvoices(inv);
      setBoards(brd.filter(b => !b.archived));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (invoice, status) => {
    try {
      const updated = await api.setInvoiceStatus(invoice.id, status);
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm(`Delete ${invoice.number}?\n\nIts time entries will be unlocked and become unbilled again.`)) return;
    try {
      await api.deleteInvoice(invoice.id);
      setInvoices(prev => prev.filter(i => i.id !== invoice.id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-16">Loading invoices…</div>;
  }

  const outstanding = invoices.filter(i => i.status === 'invoiced');
  const outstandingTotal = outstanding.reduce((sum, i) => sum + i.total, 0);
  const visible = statusFilter === 'all' ? invoices : invoices.filter(i => i.status === statusFilter);

  return (
    <div>
      {error && <p className="text-red-400 text-sm mb-4" role="alert">{error}</p>}

      <NewInvoice
        boards={boards}
        range={range}
        onCreated={(invoice) => setInvoices(prev => [invoice, ...prev])}
      />

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Invoices</h3>
        {outstanding.length > 0 && (
          <span className="text-xs text-amber-300">
            {formatUsd(outstandingTotal)} outstanding across {outstanding.length} {outstanding.length === 1 ? 'invoice' : 'invoices'}
          </span>
        )}
        <div className="ml-auto flex gap-1" role="group" aria-label="Invoice status">
          {[
            { id: 'all', label: 'All' },
            { id: 'invoiced', label: 'Unpaid' },
            { id: 'paid', label: 'Paid' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              aria-pressed={statusFilter === f.id}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.id ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-slate-500 italic text-center py-10">No invoices yet</div>
      ) : (
        <div className="space-y-3">
          {visible.map(inv => (
            <InvoiceRow key={inv.id} invoice={inv} onStatus={handleStatus} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;
