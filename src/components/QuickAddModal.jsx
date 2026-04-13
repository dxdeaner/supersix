import { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import useFocusTrap from '../hooks/useFocusTrap';

const getQuickDate = (target) => {
  const today = new Date();
  if (target === 'today') return today.toISOString().split('T')[0];
  if (target === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  const d = new Date(today);
  const day = d.getDay();
  const daysUntilFri = day <= 5 ? 5 - day : 6;
  d.setDate(d.getDate() + daysUntilFri);
  return d.toISOString().split('T')[0];
};

const QUICK_DATES = [
  { key: 'today', label: 'Today 3:30' },
  { key: 'tomorrow', label: 'Tomorrow 3:30' },
  { key: 'friday', label: 'Friday 3:30' },
];

const QuickAddModal = ({ isOpen, onClose, onAdd, loading, hasActiveRoom }) => {
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useFocusTrap(dialogRef, isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (newTask.trim()) {
      onAdd(newTask.trim(), dueDate);
      setNewTask('');
      setDueDate(null);
      onClose();
    }
  };

  const handleClose = () => {
    setNewTask('');
    setDueDate(null);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const toggleQuickDate = (key) => {
    const dateStr = `${getQuickDate(key)}T15:30`;
    setDueDate(prev => prev === dateStr ? null : dateStr);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="quick-add-title" className="text-xl font-semibold text-white">Add Task</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close dialog"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Task Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              placeholder="What needs to get done?"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Due Date</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_DATES.map(({ key, label }) => {
                const dateStr = `${getQuickDate(key)}T15:30`;
                const isActive = dueDate === dateStr;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleQuickDate(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-600 text-white border border-cyan-500'
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {dueDate && (
              <p className="text-xs text-cyan-400 mt-1.5">
                Due: {new Date(dueDate).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>

          <p className={`text-xs ${hasActiveRoom ? 'text-cyan-400' : 'text-orange-400'}`}>
            {hasActiveRoom ? 'Will be added to Active Focus' : 'Will be added to Queue'}
          </p>
        </div>

        <div className="flex space-x-2 justify-end mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!newTask.trim() || loading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
