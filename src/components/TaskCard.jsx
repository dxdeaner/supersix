import Icon from './Icon';

const TaskCard = ({ task, index, isCurrentFocus, onComplete, onPostpone, onEdit, onDelete, onMoveUp, onMoveDown, onDemote, canMoveUp, canMoveDown, isMoving, onDragStart, onDragEnd, onDragOver, onDrop, isDragOver, subtasks }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(task.id, index);
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
      className={`relative bg-slate-800 rounded-lg p-4 border-2 transition-all duration-200 ease-in-out cursor-pointer hover:cursor-grab active:cursor-grabbing ${isMoving ? 'transform scale-105 shadow-lg shadow-cyan-400/20' : ''} ${isCurrentFocus ? 'border-cyan-400 shadow-lg shadow-cyan-400/20 ring-1 ring-cyan-400/30' : 'border-slate-700 hover:border-slate-600'} ${isDragOver ? 'border-green-400 bg-green-500/40 animate-pulse shadow-lg shadow-green-400/50' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={`absolute -left-3 left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCurrentFocus ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg' : 'bg-slate-700 text-slate-300'}`}>
        {index + 1}
      </div>

      {/* Keep the arrow buttons as backup/alternative */}
      <div className="absolute right-0 top-2 flex flex-col opacity-50 hover:opacity-100 transition-opacity">
        <button
          onClick={() => onMoveUp(task.id)}
          disabled={!canMoveUp}
          className={`p-1 rounded transition-all ${canMoveUp ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
          title="Move up"
        >
          <Icon name="chevron-up" size={12} />
        </button>
        <button
          onClick={() => onMoveDown(task.id)}
          disabled={!canMoveDown}
          className={`p-1 rounded transition-all ${canMoveDown ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
          title="Move down"
        >
          <Icon name="chevron-down" size={12} />
        </button>
      </div>

      <div className="ml-4 mr-8">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-white flex-1 mr-4">{task.title}</h3>
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
          <p className="text-slate-300 text-sm mb-4">{task.description}</p>
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
            onClick={() => onEdit(task.id)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <Icon name="edit-3" size={14} />
            <span>Edit</span>
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
            onClick={() => onDelete(task.id)}
            className="text-red-400 hover:text-red-300 p-1 transition-colors hover:bg-red-400/10 rounded"
            title="Delete task"
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
  );
};

export default TaskCard;
