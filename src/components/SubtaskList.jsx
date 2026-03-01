import { useState } from 'react';
import Icon from './Icon';

const SubtaskList = ({ taskId, subtasks, onAdd, onToggle, onDelete, loading }) => {
  const [newSubtask, setNewSubtask] = useState('');

  const handleAdd = () => {
    onAdd(taskId, newSubtask);
    setNewSubtask('');
  };

  const taskSubtasks = subtasks[taskId] || [];
  const completedCount = taskSubtasks.filter(s => s.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-slate-300 text-sm font-medium">
          Checklist ({completedCount}/{taskSubtasks.length})
        </h4>
        {taskSubtasks.length > 0 && (
          <div className="w-24 bg-slate-600 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${taskSubtasks.length > 0 ? (completedCount / taskSubtasks.length) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {taskSubtasks.map(subtask => (
          <div
            key={subtask.id}
            className="flex items-center space-x-2 group"
          >
            <button
              onClick={() => onToggle(subtask.id, taskId)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${subtask.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-500 hover:border-green-400'
                }`}
            >
              {subtask.completed && <Icon name="check" size={10} />}
            </button>
            <span
              className={`flex-1 text-sm ${subtask.completed
                ? 'text-slate-400 line-through'
                : 'text-slate-200'
                }`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => onDelete(subtask.id, taskId)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-all"
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add checklist item..."
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
    </div>
  );
};

export default SubtaskList;
