import React, { useState } from 'react';
import { Trash2, Check, Clock, Edit3, ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

// Custom Task Card Component
const TaskCard = ({ task, index, isCurrentFocus, onComplete, onPostpone, onEdit, onDelete, onMoveUp, onMoveDown, onDemote, canMoveUp, canMoveDown, isMoving }) => {
  return (
    <div className={`relative bg-slate-800 rounded-lg p-4 border-2 transition-all duration-300 ease-in-out ${isMoving ? 'transform scale-105 shadow-lg shadow-cyan-400/20' : ''} ${isCurrentFocus ? 'border-cyan-400 shadow-lg shadow-cyan-400/20 ring-1 ring-cyan-400/30' : 'border-slate-700 hover:border-slate-600'}`}>
      <div className={`absolute -left-3 -top-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCurrentFocus ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg' : 'bg-slate-700 text-slate-300'}`}>
        {index + 1}
      </div>

      <div className="absolute -right-2 top-2 flex flex-col">
        <button
          onClick={() => onMoveUp(task.id)}
          disabled={!canMoveUp}
          className={`p-1 rounded transition-all ${canMoveUp ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
          title="Move up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={() => onMoveDown(task.id)}
          disabled={!canMoveDown}
          className={`p-1 rounded transition-all ${canMoveDown ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
          title="Move down"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="ml-4 mr-8">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-white flex-1 mr-4">{task.title}</h3>
          {task.dueDate && (
            <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              {new Date(task.dueDate).toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
        
        {task.description && (
          <p className="text-slate-300 text-sm mb-4">{task.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button 
              onClick={() => onComplete(task.id)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Check size={14} />
              <span>Complete</span>
            </button>
            <button 
              onClick={() => onPostpone(task.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Clock size={14} />
              <span>Postpone</span>
            </button>
            <button 
              onClick={() => onEdit(task.id)}
              className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
            <button 
              onClick={() => onDemote(task.id)}
              className="border border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400 bg-transparent px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
              title="Move to Queue"
            >
              <ArrowDown size={12} />
              <span>Queue</span>
            </button>
          </div>
          
          <button 
            onClick={() => onDelete(task.id)}
            className="text-red-400 hover:text-red-300 p-1 transition-colors hover:bg-red-400/10 rounded"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Queue Card Component
const QueueCard = ({ task, index, onEdit, onDelete, onMoveUp, onMoveDown, onPromote, canMoveUp, canMoveDown, isMoving }) => {
  return (
    <div className={`bg-slate-800/50 rounded-lg p-3 border border-slate-700 transition-all duration-300 ease-in-out ${isMoving ? 'transform scale-105 shadow-lg shadow-cyan-400/20' : 'hover:border-slate-600'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 mr-4">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-white font-medium">{task.title}</h4>
            {task.dueDate && (
              <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                {new Date(task.dueDate).toLocaleString('en-US', {
                  timeZone: 'America/Los_Angeles',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
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
            <ArrowUp size={12} />
            <span>Activate</span>
          </button>
          
          <div className="flex flex-col">
            <button
              onClick={() => onMoveUp(task.id)}
              disabled={!canMoveUp}
              className={`p-1 rounded transition-all ${canMoveUp ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
              title="Move up in queue"
            >
              <ChevronUp size={12} />
            </button>
            <button
              onClick={() => onMoveDown(task.id)}
              disabled={!canMoveDown}
              className={`p-1 rounded transition-all ${canMoveDown ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
              title="Move down in queue"
            >
              <ChevronDown size={12} />
            </button>
          </div>
          
          <button
            onClick={() => onEdit(task.id)}
            className="text-slate-400 hover:text-slate-300 p-1 transition-colors hover:bg-slate-600/50 rounded"
            title="Edit task"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-400 hover:text-red-300 p-1 transition-colors hover:bg-red-400/10 rounded"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Complete project proposal",
      description: "Finalize the Q1 project proposal with timeline and budget",
      status: "active",
      position: 1,
      dueDate: new Date('2024-12-15T14:00:00'),
      createdAt: new Date(),
      completedAt: null
    },
    {
      id: 2,
      title: "Review team performance",
      description: "Quarterly review meetings with each team member",
      status: "active",
      position: 2,
      dueDate: null,
      createdAt: new Date(),
      completedAt: null
    }
  ]);

  const [activeTab, setActiveTab] = useState('active');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [movingTask, setMovingTask] = useState(null);

  const completeTask = (taskId) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === taskId) {
          return { ...task, status: 'completed', completedAt: new Date() };
        }
        return task;
      }).map(task => {
        if (task.status === 'active') {
          const completedTask = prevTasks.find(t => t.id === taskId);
          if (completedTask && completedTask.status === 'active' && completedTask.position < task.position) {
            return { ...task, position: task.position - 1 };
          }
        }
        return task;
      });
    });

    setTasks(prevTasks => {
      const activeCount = prevTasks.filter(t => t.status === 'active').length;
      if (activeCount < 6) {
        const firstQueued = prevTasks.filter(t => t.status === 'queued').sort((a, b) => a.position - b.position)[0];
        if (firstQueued) {
          return prevTasks.map(task => {
            if (task.id === firstQueued.id) {
              return { ...task, status: 'active', position: activeCount + 1 };
            }
            return task;
          });
        }
      }
      return prevTasks;
    });
  };

  const postponeTask = (taskId) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === taskId) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          return {
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate.getTime() + 24 * 60 * 60 * 1000) : tomorrow
          };
        }
        return task;
      });
    });
  };

  const deleteTask = (taskId) => {
    setTasks(prevTasks => {
      const taskToDelete = prevTasks.find(t => t.id === taskId);
      if (!taskToDelete) return prevTasks;
      
      let updatedTasks = prevTasks.filter(task => task.id !== taskId);
      
      if (taskToDelete.status === 'active') {
        updatedTasks = updatedTasks.map(task => {
          if (task.status === 'active' && task.position > taskToDelete.position) {
            return { ...task, position: task.position - 1 };
          }
          return task;
        });
        
        const activeCount = updatedTasks.filter(t => t.status === 'active').length;
        if (activeCount < 6) {
          const firstQueued = updatedTasks.filter(t => t.status === 'queued').sort((a, b) => a.position - b.position)[0];
          if (firstQueued) {
            updatedTasks = updatedTasks.map(task => {
              if (task.id === firstQueued.id) {
                return { ...task, status: 'active', position: activeCount + 1 };
              }
              return task;
            });
          }
        }
      }
      return updatedTasks;
    });
  };

  const undoComplete = (taskId) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === taskId) {
          const activeTasks = prevTasks.filter(t => t.status === 'active');
          const nextPosition = activeTasks.length < 6 ? activeTasks.length + 1 : null;
          return {
            ...task,
            status: nextPosition ? 'active' : 'queued',
            position: nextPosition || prevTasks.filter(t => t.status === 'queued').length + 1,
            completedAt: null
          };
        }
        return task;
      });
    });
  };

  const editTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    });
  };

  const saveEdit = () => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task.id === editingTask.id) {
          return {
            ...task,
            title: editingTask.title,
            description: editingTask.description,
            dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : null
          };
        }
        return task;
      });
    });
    setEditingTask(null);
  };

  const addTask = () => {
    if (newTask.trim()) {
      const queuedTasks = tasks.filter(t => t.status === 'queued');
      const nextPosition = queuedTasks.length + 1;
      const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
      
      setTasks(prevTasks => [
        ...prevTasks,
        {
          id: newId,
          title: newTask.trim(),
          description: '',
          status: 'queued',
          position: nextPosition,
          dueDate: null,
          createdAt: new Date(),
          completedAt: null
        }
      ]);
      setNewTask('');
    }
  };

  const moveTaskUp = (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), 300);
    
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task) return prevTasks;
      
      const tasksInSameStatus = prevTasks.filter(t => t.status === task.status).sort((a, b) => a.position - b.position);
      const currentIndex = tasksInSameStatus.findIndex(t => t.id === taskId);
      if (currentIndex <= 0) return prevTasks;
      
      const newOrder = [...tasksInSameStatus];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      
      const updatedStatusTasks = newOrder.map((t, index) => ({ ...t, position: index + 1 }));
      
      return prevTasks.map(t => {
        if (t.status === task.status) {
          const updatedTask = updatedStatusTasks.find(ut => ut.id === t.id);
          return updatedTask || t;
        }
        return t;
      });
    });
  };

  const moveTaskDown = (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), 300);
    
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task) return prevTasks;
      
      const tasksInSameStatus = prevTasks.filter(t => t.status === task.status).sort((a, b) => a.position - b.position);
      const currentIndex = tasksInSameStatus.findIndex(t => t.id === taskId);
      if (currentIndex >= tasksInSameStatus.length - 1) return prevTasks;
      
      const newOrder = [...tasksInSameStatus];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      
      const updatedStatusTasks = newOrder.map((t, index) => ({ ...t, position: index + 1 }));
      
      return prevTasks.map(t => {
        if (t.status === task.status) {
          const updatedTask = updatedStatusTasks.find(ut => ut.id === t.id);
          return updatedTask || t;
        }
        return t;
      });
    });
  };

  const promoteTask = (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), 300);
    
    setTasks(prevTasks => {
      const taskToPromote = prevTasks.find(t => t.id === taskId);
      if (!taskToPromote || taskToPromote.status !== 'queued') return prevTasks;
      
      const activeTasks = prevTasks.filter(t => t.status === 'active').sort((a, b) => a.position - b.position);
      
      if (activeTasks.length < 6) {
        return prevTasks.map(t => {
          if (t.id === taskId) {
            return { ...t, status: 'active', position: activeTasks.length + 1 };
          }
          return t;
        });
      } else {
        const taskSix = activeTasks[5];
        const maxQueuePosition = Math.max(...prevTasks.filter(t => t.status === 'queued').map(t => t.position), 0);
        
        return prevTasks.map(t => {
          if (t.id === taskId) {
            return { ...t, status: 'active', position: 6 };
          }
          if (t.id === taskSix.id) {
            return { ...t, status: 'queued', position: maxQueuePosition + 1 };
          }
          return t;
        });
      }
    });
  };

  const demoteTask = (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), 300);
    
    setTasks(prevTasks => {
      const taskToDemote = prevTasks.find(t => t.id === taskId);
      if (!taskToDemote || taskToDemote.status !== 'active') return prevTasks;
      
      const maxQueuePosition = Math.max(...prevTasks.filter(t => t.status === 'queued').map(t => t.position), 0);
      
      return prevTasks.map(t => {
        if (t.id === taskId) {
          // Move to queue
          return { ...t, status: 'queued', position: maxQueuePosition + 1 };
        }
        // Compact remaining active tasks
        if (t.status === 'active' && t.position > taskToDemote.position) {
          return { ...t, position: t.position - 1 };
        }
        return t;
      });
    });
  };

  const activeTasks = tasks.filter(task => task.status === 'active').sort((a, b) => a.position - b.position).slice(0, 6);
  const queuedTasks = tasks.filter(task => task.status === 'queued').sort((a, b) => a.position - b.position);
  const completedTasks = tasks.filter(task => task.status === 'completed').sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400 mb-2">
            SUPERSIX
          </h1>
          <p className="text-slate-300">Six meaningful tasks. Daily focus. Relentless progress.</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-md transition-all ${activeTab === 'active' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
            >
              Active & Queue
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-md transition-all ${activeTab === 'completed' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
            >
              Completed
            </button>
          </div>
        </div>

        {activeTab === 'active' ? (
          <div className="space-y-8">
            
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                Active Focus (1-6)
              </h2>
              
              <div className="space-y-3">
                {Array.from({ length: 6 }, (_, slotIndex) => {
                  const task = activeTasks[slotIndex];
                  const isCurrentFocus = slotIndex === 0;
                  
                  return task ? (
                    <TaskCard
                      key={`${task.id}-${task.position}`}
                      task={task}
                      index={slotIndex}
                      isCurrentFocus={isCurrentFocus}
                      onComplete={completeTask}
                      onPostpone={postponeTask}
                      onEdit={editTask}
                      onDelete={(taskId) => setDeleteConfirm(taskId)}
                      onMoveUp={moveTaskUp}
                      onMoveDown={moveTaskDown}
                      onDemote={demoteTask}
                      canMoveUp={slotIndex > 0}
                      canMoveDown={slotIndex < activeTasks.length - 1}
                      isMoving={movingTask === task.id}
                    />
                  ) : (
                    <div
                      key={slotIndex}
                      className="relative bg-slate-800 rounded-lg p-4 border-2 border-dashed border-slate-600"
                    >
                      <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-700 text-slate-300">
                        {slotIndex + 1}
                      </div>
                      <div className="ml-4 text-slate-500 italic">
                        Empty slot - promote from queue or add new task
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="border-t border-slate-700 pt-8">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                  Task Queue ({queuedTasks.length})
                </h2>
                
                {queuedTasks.length > 0 ? (
                  <div className="space-y-2">
                    {queuedTasks.map((task, index) => (
                      <QueueCard
                        key={`${task.id}-${task.position}`}
                        task={task}
                        index={index}
                        onEdit={editTask}
                        onDelete={(taskId) => setDeleteConfirm(taskId)}
                        onMoveUp={moveTaskUp}
                        onMoveDown={moveTaskDown}
                        onPromote={promoteTask}
                        canMoveUp={index > 0}
                        canMoveDown={index < queuedTasks.length - 1}
                        isMoving={movingTask === task.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-center py-8">
                    Queue is empty - add tasks to build momentum
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      placeholder="Add new task to queue..."
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={addTask}
                      disabled={!newTask.trim()}
                      className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Completed Tasks</h2>
            {completedTasks.length > 0 ? (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div key={task.id} className="bg-slate-800/50 rounded-lg p-3 border border-green-500/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-white font-medium line-through opacity-75">{task.title}</h4>
                        <p className="text-slate-400 text-sm">
                          Completed: {new Date(task.completedAt).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => undoComplete(task.id)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                      >
                        Undo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-8">No completed tasks yet</p>
            )}
          </div>
        )}
      </div>

      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 w-full">
            <h3 className="text-white font-semibold mb-4">Edit Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400 resize-none"
                  placeholder="Optional description..."
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Due Date & Time (PST)</label>
                <input
                  type="datetime-local"
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 justify-end mt-6">
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!editingTask.title.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm mx-4 border border-slate-700">
            <h3 className="text-white font-semibold mb-2">Delete Task</h3>
            <p className="text-slate-300 mb-4">
              Are you sure you want to delete this task permanently? This action cannot be undone.
            </p>
            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTask(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;