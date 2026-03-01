import Icon from './Icon';

const QueueCard = ({ task, index, onEdit, onDelete, onMoveUp, onMoveDown, onPromote, canMoveUp, canMoveDown, isMoving, subtasks }) => {
  return (
    <div className={`bg-slate-800/50 rounded-lg p-3 border border-slate-700 transition-all duration-300 ease-in-out ${isMoving ? 'transform scale-105 shadow-lg shadow-cyan-400/20' : 'hover:border-slate-600'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-4">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-white font-medium">{task.title}</h4>
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                {new Date(task.dueDate) < new Date() && (
                  <span className="text-red-400 font-bold text-sm">!</span>
                )}
                <div className={`${new Date(task.dueDate) < new Date() ? 'bg-red-500' : 'bg-orange-500'} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                  {new Date(task.dueDate).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          {task.description && (
            <p className="text-slate-400 text-sm">{task.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPromote(task.id)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
            title="Promote to Active"
          >
            <Icon name="arrow-up" size={12} />
            <span>Activate</span>
          </button>

          <div className="flex flex-col">
            <button
              onClick={() => onMoveUp(task.id)}
              disabled={!canMoveUp}
              className={`p-1 rounded transition-all ${canMoveUp ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
              title="Move up in queue"
            >
              <Icon name="chevron-up" size={12} />
            </button>
            <button
              onClick={() => onMoveDown(task.id)}
              disabled={!canMoveDown}
              className={`p-1 rounded transition-all ${canMoveDown ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
              title="Move down in queue"
            >
              <Icon name="chevron-down" size={12} />
            </button>
          </div>

          <button
            onClick={() => onEdit(task.id)}
            className="text-slate-400 hover:text-slate-300 p-1 transition-colors hover:bg-slate-600/50 rounded"
            title="Edit task"
          >
            <Icon name="edit-3" size={14} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-400 hover:text-red-300 p-1 transition-colors hover:bg-red-400/10 rounded"
            title="Delete task"
          >
            <Icon name="trash-2" size={14} />
          </button>
        </div>
      </div>

      {/* Subtask Badge */}
      {subtasks[task.id] && subtasks[task.id].length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-600">
          <div className="flex items-center space-x-2">
            <div className="bg-slate-700 text-slate-300 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <Icon name="check" size={10} />
              <span>
                {subtasks[task.id].filter(s => s.completed).length}/{subtasks[task.id].length} completed
              </span>
            </div>
            <div className="flex-1 max-w-16 bg-slate-600 rounded-full h-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${(subtasks[task.id].filter(s => s.completed).length / subtasks[task.id].length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueCard;
