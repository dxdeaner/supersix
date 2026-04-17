import { useState, useRef } from 'react';
import Icon from './Icon';
import useFocusTrap from '../hooks/useFocusTrap';

const CompletionModal = ({ isOpen, onClose, onDone, taskTitle, loading }) => {
  const [result, setResult] = useState('');
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpUrl, setFollowUpUrl] = useState('');
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, isOpen, () => {
    handleDone();
  });

  const handleDone = () => {
    onDone({ result: result.trim(), followUpTitle: followUpTitle.trim(), followUpUrl: followUpUrl.trim() });
    setResult('');
    setFollowUpTitle('');
    setFollowUpUrl('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-modal-title"
        className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" size={20} className="text-green-400" />
            <h2 id="completion-modal-title" className="text-xl font-semibold text-white truncate">
              {taskTitle}
            </h2>
          </div>
          <button
            onClick={handleDone}
            className="text-slate-400 hover:text-white"
            aria-label="Close dialog"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Result / Notes <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 resize-none"
              placeholder="What was the outcome?"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Follow-up Task <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={followUpTitle}
              onChange={(e) => setFollowUpTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDone();
              }}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              placeholder="Add a follow-up task..."
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Follow-up URL <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={followUpUrl}
              onChange={(e) => setFollowUpUrl(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleDone}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
          >
            {loading ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;
