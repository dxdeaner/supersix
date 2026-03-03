import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

const SubtaskList = ({ taskId, subtasks, onAdd = () => {}, onToggle, onDelete = () => {}, onUpdate = () => {}, loading, mode = 'edit' }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleAdd = () => {
    onAdd(taskId, newSubtask);
    setNewSubtask('');
  };

  const startEditing = (subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const saveEditing = () => {
    if (editingId && editingTitle.trim()) {
      const original = taskSubtasks.find(s => s.id === editingId);
      if (original && editingTitle.trim() !== original.title) {
        onUpdate(editingId, taskId, editingTitle.trim());
      }
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const taskSubtasks = subtasks[taskId] || [];
  const completedCount = taskSubtasks.filter(s => s.completed).length;

  // Sort: incomplete first, completed last
  const sortedSubtasks = [...taskSubtasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-slate-300 text-sm font-medium">
          Checklist ({completedCount}/{taskSubtasks.length})
        </h4>
        {taskSubtasks.length > 0 && (
          <div className="w-24 bg-slate-600 rounded-full h-2" role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={taskSubtasks.length} aria-label="Checklist progress">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${taskSubtasks.length > 0 ? (completedCount / taskSubtasks.length) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      <ul className="space-y-2 max-h-40 overflow-y-auto">
        {sortedSubtasks.map(subtask => (
          <li
            key={subtask.id}
            className="flex items-center space-x-2 group transition-all duration-300"
          >
            <button
              onClick={() => onToggle(subtask.id, taskId)}
              role="checkbox"
              aria-checked={subtask.completed}
              aria-label={subtask.title}
              className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${subtask.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-500 hover:border-green-400'
                }`}
            >
              {subtask.completed && <Icon name="check" size={10} />}
            </button>
            {editingId === subtask.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={saveEditing}
                className="flex-1 bg-slate-600 border border-cyan-400 rounded px-2 py-0.5 text-white text-sm focus:outline-none"
                aria-label="Edit checklist item title"
              />
            ) : (
              <span
                onClick={() => startEditing(subtask)}
                className={`flex-1 text-sm cursor-text hover:bg-slate-700/50 rounded px-1 py-0.5 transition-colors ${
                  subtask.completed ? 'text-slate-400 line-through' : 'text-slate-200'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') startEditing(subtask); }}
              >
                {subtask.title}
              </span>
            )}
            {mode !== 'view' && (
              <button
                onClick={() => onDelete(subtask.id, taskId)}
                onMouseDown={(e) => e.preventDefault()}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-all"
                aria-label="Delete checklist item"
              >
                <Icon name="x" size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {mode !== 'view' && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add checklist item..."
            aria-label="New checklist item"
            className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleAdd}
            disabled={!newSubtask.trim() || loading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default SubtaskList;
