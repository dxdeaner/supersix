import { useState } from 'react';
import Icon from './Icon';

const CONFETTI_COLORS = ['#22d3ee', '#f97316', '#22c55e', '#eab308', '#a855f7', '#ec4899'];
const CONFETTI_PIECES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 360;
  const distance = 60 + Math.random() * 40;
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    rot: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  };
});

const getDueDateColor = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  if (due < now) return 'bg-red-500';
  if (due - now < 24 * 60 * 60 * 1000) return 'bg-orange-500';
  return 'bg-green-600';
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
  return { value, label };
});

const TaskCard = ({ task, index, isCurrentFocus, isCompleting, onComplete, onPostpone, onEdit, onView, onDelete, onMoveUp, onMoveDown, onDemote, onDuplicate, onToggleBlock, canMoveUp, canMoveDown, isMoving, onDragStart, onDragEnd, onDragOver, onDrop, isDragOver, subtasks, onUpdateDueDate, boards = [], onMoveToBoard }) => {
  const [expanded, setExpanded] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [movingBoard, setMovingBoard] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.setData('source', 'active');
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(task.id, index, 'active');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(index);
  };

  return (
    <div
      className={`relative bg-slate-800 rounded-lg p-4 px-6 border-2 transition-all duration-200 ease-in-out cursor-pointer hover:cursor-grab active:cursor-grabbing ${isMoving ? 'transform scale-105 shadow-lg shadow-cyan-400/20' : ''} ${task.isBlocked ? 'border-red-500 shadow-lg shadow-red-500/20 ring-1 ring-red-500/30' : isCurrentFocus ? 'border-cyan-400 shadow-lg shadow-cyan-400/20 ring-1 ring-cyan-400/30' : 'border-slate-700 hover:border-slate-600'} ${isDragOver ? 'border-green-400 bg-green-500/40 animate-pulse shadow-lg shadow-green-400/50' : ''} ${isCompleting ? 'overflow-hidden' : ''}`}
      draggable={!isCompleting}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Completion celebration overlay */}
      {isCompleting && (
        <div className="completion-overlay absolute inset-0 z-10 flex items-center justify-center bg-slate-800/90 rounded-lg">
          {/* Confetti particles */}
          {CONFETTI_PIECES.map((piece, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                '--confetti-x': `${piece.x}px`,
                '--confetti-y': `${piece.y}px`,
                '--confetti-rot': `${piece.rot}deg`,
                backgroundColor: piece.color,
                left: '50%',
                top: '50%',
              }}
            />
          ))}
          {/* Animated checkmark */}
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="relative z-10">
            <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" opacity="0.3" />
            <path
              d="M7 13l3 3 7-7"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="completion-check"
            />
          </svg>
        </div>
      )}

      <div className={`${isCompleting ? 'opacity-30' : ''} transition-opacity duration-200`}>
        <div className={`absolute left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCurrentFocus ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg' : 'bg-slate-700 text-slate-300'}`}>
          {index + 1}
        </div>

        {/* Arrow buttons */}
        <div className="absolute right-0 top-2 flex flex-col opacity-50 hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMoveUp(task.id)}
            disabled={!canMoveUp}
            className={`p-1 rounded transition-all ${canMoveUp ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
            title="Move up"
            aria-label="Move task up"
          >
            <Icon name="chevron-up" size={12} />
          </button>
          <button
            onClick={() => onMoveDown(task.id)}
            disabled={!canMoveDown}
            className={`p-1 rounded transition-all ${canMoveDown ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
            title="Move down"
            aria-label="Move task down"
          >
            <Icon name="chevron-down" size={12} />
          </button>
        </div>

        <div className="ml-12 mr-8">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center flex-1 mr-4">
              <h3 className="font-medium text-white">{task.title}</h3>
              {task.description && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-2 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                  aria-expanded={expanded}
                  aria-label={expanded ? 'Hide description' : 'Show description'}
                >
                  <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} />
                </button>
              )}
            </div>
            {task.dueDate && !editingDueDate && (
              <div
                className="flex items-center space-x-1 group/due cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const d = new Date(task.dueDate);
                  setDueDate(d.toISOString().split('T')[0]);
                  setDueTime(d.toISOString().slice(11, 16));
                  setEditingDueDate(true);
                }}
                title="Click to edit due date"
              >
                {new Date(task.dueDate) < new Date() && (
                  <span className="text-red-400 font-bold text-sm" aria-label="Overdue" role="img">!</span>
                )}
                <div className={`${getDueDateColor(task.dueDate)} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}>
                  <span>{new Date(task.dueDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  <Icon name="edit-3" size={10} className="opacity-0 group-hover/due:opacity-100 transition-opacity" />
                </div>
              </div>
            )}
            {editingDueDate && (
              <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-white text-xs focus:outline-none focus:border-cyan-400 min-w-0"
                />
                <select
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-white text-xs focus:outline-none focus:border-cyan-400 min-w-0"
                >
                  {TIME_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      if (dueDate && onUpdateDueDate) {
                        onUpdateDueDate(task.id, `${dueDate}T${dueTime}`);
                      }
                      setEditingDueDate(false);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-1.5 py-0.5 rounded text-xs transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingDueDate(false)}
                    className="bg-slate-600 hover:bg-slate-500 text-white px-1.5 py-0.5 rounded text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Expandable description */}
          {task.description && (
            <div className={`description-expand ${expanded ? 'expanded' : ''}`}>
              <p className="text-slate-300 text-sm mb-4">{task.description}</p>
            </div>
          )}

          {/* URL link */}
          {task.url && (
            <div className="mt-1 mb-2">
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="external-link" size={12} />
                <span className="truncate max-w-[200px]">{task.url}</span>
              </a>
            </div>
          )}

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => onComplete(task.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Icon name="check" size={14} />
              <span>Complete</span>
            </button>
            <button
              onClick={() => onPostpone(task.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Icon name="clock" size={14} />
              <span>Postpone</span>
            </button>
            <button
              onClick={() => onView(task.id)}
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Icon name="eye" size={14} />
              <span>View</span>
            </button>
            <button
              onClick={() => onDemote(task.id)}
              className="border border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400 bg-transparent px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
              title="Move to Queue"
            >
              <Icon name="arrow-down" size={12} />
              <span>Queue</span>
            </button>
            <button
              onClick={() => onDuplicate(task.id)}
              className="border border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400 bg-transparent px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
              title="Duplicate task"
            >
              <Icon name="copy" size={12} />
              <span>Duplicate</span>
            </button>

            {boards.length > 0 && onMoveToBoard && (
              <div className="relative">
                <button
                  onClick={() => setMovingBoard(v => !v)}
                  className="border border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400 bg-transparent px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                  title="Move to board"
                >
                  <Icon name="log-in" size={12} />
                  <span>Move</span>
                </button>
                {movingBoard && (
                  <div className="absolute bottom-full mb-1 left-0 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[140px]">
                    {boards.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { onMoveToBoard(task.id, b.id); setMovingBoard(false); }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-600 hover:text-white first:rounded-t-lg last:rounded-b-lg"
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onToggleBlock(task.id)}
              className={`border bg-transparent px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${task.isBlocked ? 'border-red-500 text-red-400 hover:border-red-400 hover:text-red-300' : 'border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400'}`}
              title={task.isBlocked ? 'Unblock task' : 'Block task'}
            >
              <Icon name={task.isBlocked ? 'unlock' : 'lock'} size={12} />
              <span>{task.isBlocked ? 'Unblock' : 'Block'}</span>
            </button>

            <button
              onClick={() => onDelete(task.id)}
              className="text-red-400 hover:text-red-300 p-1 transition-colors hover:bg-red-400/10 rounded"
              title="Delete task"
              aria-label="Delete task"
            >
              <Icon name="trash-2" size={16} />
            </button>
          </div>
          {/* Subtask Badge */}
          {subtasks[task.id] && subtasks[task.id].length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="bg-slate-700 text-slate-300 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <Icon name="check" size={12} />
                  <span>
                    {subtasks[task.id].filter(s => s.completed).length}/{subtasks[task.id].length} completed
                  </span>
                </div>
                {subtasks[task.id].length > 0 && (
                  <div className="flex-1 max-w-20 bg-slate-600 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(subtasks[task.id].filter(s => s.completed).length / subtasks[task.id].length) * 100}%`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
