import { useState, useEffect, useRef } from 'react';
import { MAX_ACTIVE_TASKS, DESKTOP_BREAKPOINT, ANIMATION_DELAY_MS } from './constants';
import api from './services/api';
import Icon from './components/Icon';
import AuthModal from './components/AuthModal';
import UserHeader from './components/UserHeader';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import LoadingScreen from './components/LoadingScreen';
import TaskCard from './components/TaskCard';
import QueueCard from './components/QueueCard';
import SubtaskList from './components/SubtaskList';
import QuickAddModal from './components/QuickAddModal';
import OfflineIndicator from './components/OfflineIndicator';
import ReloadPrompt from './components/ReloadPrompt';

const App = () => {
  // Haiku collection
  const haikus = [
    "Keep it simple now, Laser focus, step by step\u2014 Relentless progress.",
    "Keep it simple, clear\u2014 Focused breath, unbroken stride. Progress never stops.",
    "Cut through noise and fog, Eyes forward, blade sharp with will\u2014 Relentless advance.",
    "River carves through stone, Quiet, steady, unyielding. Simple, focused path."
  ];
  // Select random haiku on component mount
  const [selectedHaiku] = useState(() => {
    return haikus[Math.floor(Math.random() * haikus.length)];
  });

  // Authentication state
  const [user, setUser] = useState(null);
  const [authModalMode, setAuthModalMode] = useState('login');
  // Handle verification messages from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verification = urlParams.get('verification');

    if (verification) {
      switch (verification) {
        case 'success':
          // Refresh user data to show verified status
          if (user) {
            checkAuth();
          }
          break;
        case 'invalid':
          setError('Invalid verification link');
          break;
        case 'already':
          // User already verified, just refresh
          if (user) {
            checkAuth();
          }
          break;
        case 'error':
          setError('Verification failed. Please try again.');
          break;
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEmailBanner, setShowEmailBanner] = useState(true);

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);

  // Drag and drop handlers
  const handleDragStart = (taskId, fromIndex) => {
    setDraggedTask(taskId);
    setDraggedFromIndex(fromIndex);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverIndex(null);
    setDraggedFromIndex(null);
  };

  const handleDragOver = (overIndex) => {
    setDragOverIndex(overIndex);
  };

  const handleDrop = async (toIndex) => {
    if (draggedTask && draggedFromIndex !== null && draggedFromIndex !== toIndex) {
      // Determine direction and call existing reorder API
      if (draggedFromIndex < toIndex) {
        // Moving down - need multiple moves
        for (let i = draggedFromIndex; i < toIndex; i++) {
          await moveTaskDown(draggedTask);
        }
      } else {
        // Moving up - need multiple moves
        for (let i = draggedFromIndex; i > toIndex; i--) {
          await moveTaskUp(draggedTask);
        }
      }
    }
    handleDragEnd();
  };

  // Auto-load subtasks for all tasks when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      tasks.forEach(task => {
        if (!subtasks[task.id] && !loadingSubtasks[task.id]) {
          loadSubtasks(task.id);
        }
      });
    }
  }, [tasks, currentBoard, subtasks, loadingSubtasks]);

  // Subtask state
  const [subtasks, setSubtasks] = useState({});
  const [loadingSubtasks, setLoadingSubtasks] = useState({});

  const loadSubtasks = async (taskId) => {
    if (loadingSubtasks[taskId]) return;

    try {
      setLoadingSubtasks(prev => ({ ...prev, [taskId]: true }));
      const subtasksData = await api.getSubtasks(taskId);
      setSubtasks(prev => ({ ...prev, [taskId]: subtasksData }));
    } catch (err) {
      console.error('Error loading subtasks:', err);
    } finally {
      setLoadingSubtasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const addSubtask = async (taskId, title) => {
    if (!title.trim()) return;

    try {
      await api.createSubtask(taskId, title.trim());
      await loadSubtasks(taskId);
    } catch (err) {
      setError('Failed to add subtask: ' + err.message);
    }
  };

  const toggleSubtask = async (subtaskId, taskId) => {
    try {
      await api.toggleSubtask(subtaskId);
      await loadSubtasks(taskId);
    } catch (err) {
      setError('Failed to update subtask: ' + err.message);
    }
  };

  const deleteSubtask = async (subtaskId, taskId) => {
    try {
      await api.deleteSubtask(subtaskId);
      await loadSubtasks(taskId);
    } catch (err) {
      setError('Failed to delete subtask: ' + err.message);
    }
  };

  // Existing app state
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState('active');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [movingTask, setMovingTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [boardMenuOpen, setBoardMenuOpen] = useState(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up auth failure handler only for authenticated users
  useEffect(() => {
    if (user) {
      // Only set up session expiry handling for authenticated users
      api.setAuthFailureCallback((reason) => {
        if (reason === 'session_expired') {
          handleSessionExpiry();
        }
      });
    } else {
      // Clear the handler when no user
      api.setAuthFailureCallback(null);
    }
  }, [user]);

  // Load boards when user changes
  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user]);

  // Load tasks when board changes
  useEffect(() => {
    if (currentBoard && user) {
      loadTasks();
    }
  }, [currentBoard, user]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    const handleClickOutside = (e) => {
      if (boardMenuOpen && !e.target.closest('.board-menu-container')) {
        setBoardMenuOpen(null);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [boardMenuOpen]);

  const checkAuth = async () => {
    try {
      const result = await api.getCurrentUser();
      setUser(result.user);
    } catch (error) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setError(null);
    setSessionExpired(false);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    api.clearCsrfToken();
    setUser(null);
    setBoards([]);
    setTasks([]);
    setCurrentBoard(null);
    setSubtasks({});
    setLoadingSubtasks({});
    setError(null);
    setSessionExpired(false);

    // Close any open modals
    setShowAuthModal(false);
    setEditingTask(null);
    setShowBoardModal(false);
    setEditingBoard(null);
    setBoardMenuOpen(null);
    setSidebarOpen(false);
  };

  const handleSessionExpiry = () => {
    handleLogout();
    setSessionExpired(true);
    setShowAuthModal(true);
  };

  // API functions
  const loadBoards = async () => {
    try {
      setLoading(true);
      const boardsData = await api.getBoards();
      setBoards(boardsData);
      if (boardsData.length > 0 && !currentBoard) {
        switchBoard(boardsData[0].id);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading boards:', err);
      setError('Failed to load boards: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!currentBoard) return;

    try {
      const tasksData = await api.getTasks(currentBoard);
      setTasks(tasksData);

      // Force subtask loading after a small delay to ensure state updates
      setTimeout(() => {
        tasksData.forEach(task => {
          if (!subtasks[task.id]) {
            loadSubtasks(task.id);
          }
        });
      }, 100);

      setError(null);
    } catch (err) {
      setError('Failed to load tasks: ' + err.message);
      console.error('Error loading tasks:', err);
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      const newBoard = await api.createBoard(newBoardName.trim());
      await loadBoards();
      setCurrentBoard(newBoard.id);
      setNewBoardName('');
      setShowBoardModal(false);
    } catch (err) {
      setError('Failed to create board: ' + err.message);
    }
  };

  const editBoard = async (boardId, newName) => {
    if (!newName.trim()) return;

    try {
      await api.updateBoard(boardId, newName.trim());
      await loadBoards();
      setEditingBoard(null);
    } catch (err) {
      setError('Failed to update board: ' + err.message);
    }
  };

  const archiveBoard = async (boardId) => {
    try {
      await api.deleteBoard(boardId);
      await loadBoards();
      setBoardMenuOpen(null);

      if (boardId === currentBoard) {
        const nextBoard = boards.find(b => b.id !== boardId && !b.archived);
        if (nextBoard) setCurrentBoard(nextBoard.id);
      }
    } catch (err) {
      setError('Failed to archive board: ' + err.message);
    }
  };

  // Action guard to prevent duplicate API calls from rapid clicks
  const pendingAction = useRef(false);
  const withGuard = (fn) => async (...args) => {
    if (pendingAction.current) return;
    pendingAction.current = true;
    try { await fn(...args); } finally { pendingAction.current = false; }
  };

  // Task management functions
  const completeTask = withGuard(async (taskId) => {
    try {
      await api.completeTask(taskId);
      await loadTasks();
    } catch (err) {
      setError('Failed to complete task: ' + err.message);
    }
  });

  const postponeTask = withGuard(async (taskId) => {
    try {
      await api.postponeTask(taskId);
      await loadTasks();
    } catch (err) {
      setError('Failed to postpone task: ' + err.message);
    }
  });

  const deleteTask = withGuard(async (taskId) => {
    try {
      await api.deleteTask(taskId);
      await loadTasks();
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete task: ' + err.message);
    }
  });

  const promoteTask = withGuard(async (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);

    try {
      await api.promoteTask(taskId);
      await loadTasks();
    } catch (err) {
      setError('Failed to promote task: ' + err.message);
      setMovingTask(null);
    }
  });

  const demoteTask = withGuard(async (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);

    try {
      await api.demoteTask(taskId);
      await loadTasks();
    } catch (err) {
      setError('Failed to demote task: ' + err.message);
      setMovingTask(null);
    }
  });

  const moveTaskUp = withGuard(async (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);

    try {
      await api.reorderTask(taskId, 'up');
      await loadTasks();
    } catch (err) {
      setError('Failed to move task: ' + err.message);
      setMovingTask(null);
    }
  });

  const moveTaskDown = withGuard(async (taskId) => {
    setMovingTask(taskId);
    setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);

    try {
      await api.reorderTask(taskId, 'down');
      await loadTasks();
    } catch (err) {
      setError('Failed to move task: ' + err.message);
      setMovingTask(null);
    }
  });

  const addTask = withGuard(async () => {
    if (!newTask.trim()) return;

    try {
      await api.createTask(currentBoard, newTask.trim());
      await loadTasks();
      setNewTask('');
    } catch (err) {
      setError('Failed to add task: ' + err.message);
    }
  });

  const editTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    });

    // Load subtasks for this task
    loadSubtasks(taskId);
  };

  const saveEdit = withGuard(async () => {
    try {
      await api.updateTask(
        editingTask.id,
        editingTask.title,
        editingTask.description,
        editingTask.dueDate || null
      );
      await loadTasks();
      setEditingTask(null);
    } catch (err) {
      setError('Failed to update task: ' + err.message);
    }
  });

  const undoComplete = withGuard(async (taskId) => {
    try {
      await api.undoCompleteTask(taskId);
      await loadTasks();
    } catch (err) {
      setError('Failed to restore task: ' + err.message);
    }
  });

  // Helper functions
  const getBoardStats = (boardId) => {
    const activeTasks = tasks.filter(t => t.boardId === boardId && t.status === 'active').length;
    return `${activeTasks}/${MAX_ACTIVE_TASKS}`;
  };

  const switchBoard = (boardId) => {
    if (boardId !== currentBoard) {
      setSubtasks({});
      setCurrentBoard(boardId);
    }
  };

  // Show auth loading screen
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Show login modal if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <img src="/SuperSix-Logo.png" alt="SuperSix" className="h-16 mx-auto mb-8" />
          <h1 className="text-3xl font-bold text-white mb-4">
            {sessionExpired ? 'Session Expired' : 'Welcome to SuperSix'}
          </h1>
          <p className="text-slate-300 whitespace-pre-line italic font-light leading-relaxed mb-8">
            {sessionExpired
              ? 'Your session has expired for security. Please sign in again to continue.'
              : selectedHaiku
            }
          </p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => {
                setAuthModalMode('login');
                setShowAuthModal(true);
              }}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
            {!sessionExpired && (
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setShowAuthModal(true);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Account
              </button>
            )}
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setSessionExpired(false);
          }}
          onAuthSuccess={handleAuthSuccess}
          mode={authModalMode}
        />
      </div>
    );
  }

  // Filter tasks by status
  const activeTasks = tasks
    .filter(task => task.status === 'active')
    .sort((a, b) => a.position - b.position)
    .slice(0, MAX_ACTIVE_TASKS);

  const queuedTasks = tasks
    .filter(task => task.status === 'queued')
    .sort((a, b) => a.position - b.position);

  const completedTasks = tasks
    .filter(task => task.status === 'completed')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  if (loading && !user) {
    return <LoadingScreen />;
  }

  if (error && !boards.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <h2 className="text-red-400 font-semibold mb-2">Connection Error</h2>
            <p className="text-slate-300 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                loadBoards();
              }}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-x-hidden">

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ transform: windowWidth >= DESKTOP_BREAKPOINT ? 'translateX(0)' : undefined, position: windowWidth >= DESKTOP_BREAKPOINT ? 'static' : 'fixed' }}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Boards</h2>
          {windowWidth < DESKTOP_BREAKPOINT && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <Icon name="x" size={20} />
            </button>
          )}
        </div>

        <div className="p-4 relative">
          <div className="space-y-2">
            {boards.filter(board => !board.archived).map(board => (
              <div key={board.id} className="relative board-menu-container">
                <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${board.id === currentBoard
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}>
                  <button
                    onClick={() => {
                      switchBoard(board.id);
                      setSidebarOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    <span className="font-medium">{board.name}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded ${board.id === currentBoard
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-600 text-slate-300'
                      }`}>
                      {getBoardStats(board.id)}
                    </span>
                    <button
                      onClick={() => setBoardMenuOpen(boardMenuOpen === board.id ? null : board.id)}
                      className={`board-menu-button p-1 rounded transition-colors relative ${board.id === currentBoard
                        ? 'hover:bg-cyan-500 text-white'
                        : 'hover:bg-slate-600 text-slate-400'
                        } ${boardMenuOpen === board.id ? 'bg-slate-600' : ''}`}
                      title="Board options"
                    >
                      <Icon name="more-vertical" size={14} />
                    </button>
                  </div>
                </div>

                {/* Board Menu Dropdown */}
                {boardMenuOpen === board.id && (
                  <div
                    className="board-menu-dropdown absolute right-3 top-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl w-36"
                    style={{ position: 'absolute', zIndex: 9999 }}
                  >
                    <button
                      onClick={() => {
                        setEditingBoard({ id: board.id, name: board.name });
                        setBoardMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center space-x-2 rounded-t-lg"
                    >
                      <Icon name="edit" size={14} />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={() => archiveBoard(board.id)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center space-x-2 rounded-b-lg"
                    >
                      <Icon name="archive" size={14} />
                      <span>Archive</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Board Button */}
          <button
            onClick={() => setShowBoardModal(true)}
            className="w-full mt-4 p-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center space-x-2"
          >
            <Icon name="plus" size={16} />
            <span>Add Board</span>
          </button>

          {/* Archived Boards Section */}
          {boards.some(b => b.archived) && (
            <div className="mt-6 pt-4 border-t border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Archived</h3>
              <div className="space-y-1">
                {boards.filter(board => board.archived).map(board => (
                  <div key={board.id} className="flex items-center justify-between p-2 text-slate-500 text-sm">
                    <span>{board.name}</span>
                    <button
                      onClick={() => restoreBoard(board.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar backdrop for mobile */}
      {sidebarOpen && windowWidth < DESKTOP_BREAKPOINT && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header */}
        {windowWidth < DESKTOP_BREAKPOINT && (
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white"
            >
              <Icon name="menu" size={24} />
            </button>
            <img src="/SuperSix-Logo.png" alt="SuperSix" className="h-8" />
            <UserHeader
              user={user}
              onLogout={handleLogout}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          </div>
        )}

        {/* Desktop Header */}
        {windowWidth >= DESKTOP_BREAKPOINT && (
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="text-center flex-1">
              <img src="/SuperSix-Logo.png" alt="SuperSix" className="h-12 mx-auto mb-2" />
              <p className="text-slate-300 whitespace-pre-line italic font-light leading-relaxed">
                {selectedHaiku}
              </p>
            </div>
            <div className="absolute right-6 top-6">
              <UserHeader
                user={user}
                onLogout={handleLogout}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            </div>
          </div>
        )}

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Email Verification Banner */}
        {showEmailBanner && (
          <EmailVerificationBanner user={user} />
        )}

        <div className="container mx-auto px-2 py-8 max-w-4xl overflow-x-hidden">
          {/* Board Title for Mobile */}
          {windowWidth <= 1249 && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white mb-1">
                {boards.find(b => b.id === currentBoard)?.name || 'Loading...'}
              </h2>
              <p className="text-slate-400 text-sm">
                {getBoardStats(currentBoard)} active tasks
              </p>
            </div>
          )}

          {/* Tab Navigation with Add Button */}
          <div className={`mb-6 ${windowWidth >= 768 ? 'relative flex justify-center' : 'flex justify-center items-center space-x-4'}`}>
            <button
              onClick={() => setShowQuickAddModal(true)}
              className={`w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all hover:shadow-lg shadow-orange-500/20 ${windowWidth >= 768 ? 'absolute left-0 top-1/2 transform -translate-y-1/2' : ''}`}
              title="Add new task"
            >
              <Icon name="plus" size={20} />
            </button>

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

          {/* Content */}
          {activeTab === 'active' ? (
            <div className="space-y-8">
              {/* Active Focus Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                  Active Focus (1-6)
                </h2>

                <div className="space-y-3">
                  {Array.from({ length: MAX_ACTIVE_TASKS }, (_, slotIndex) => {
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
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        isDragOver={dragOverIndex === slotIndex}
                        subtasks={subtasks}
                      />
                    ) : (
                      <div
                        key={slotIndex}
                        className="relative bg-slate-800 rounded-lg p-4 border-2 border-dashed border-slate-600"
                      >
                        <div className="absolute left-0 -top-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-700 text-slate-300">
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

              {/* Task Queue Section */}
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
                          subtasks={subtasks}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-center py-8">
                      Queue is empty - add tasks to build momentum
                    </div>
                  )}

                  {/* Add Task Input */}
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
            /* Completed Tasks */
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
      </div>

      {/* Modals */}

      {/* Quick Add Task Modal */}
      <QuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onAdd={(taskTitle) => {
          if (currentBoard) {
            api.createTask(currentBoard, taskTitle).then(() => {
              loadTasks();
            }).catch(err => {
              setError('Failed to add task: ' + err.message);
            });
          }
        }}
        loading={loading}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Create Board Modal */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 w-full">
            <h3 className="text-white font-semibold mb-4">Create New Board</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Board Name</label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createBoard()}
                  placeholder="e.g., Side Projects, Health Goals..."
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowBoardModal(false);
                  setNewBoardName('');
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createBoard}
                disabled={!newBoardName.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {editingBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 w-full">
            <h3 className="text-white font-semibold mb-4">Rename Board</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Board Name</label>
                <input
                  type="text"
                  value={editingBoard.name}
                  onChange={(e) => setEditingBoard({ ...editingBoard, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && editBoard(editingBoard.id, editingBoard.name)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-2 justify-end mt-6">
              <button
                onClick={() => setEditingBoard(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => editBoard(editingBoard.id, editingBoard.name)}
                disabled={!editingBoard.name.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
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
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400 resize-none"
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Due Date & Time (PST)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const currentTime = editingTask.dueDate ? editingTask.dueDate.split('T')[1] || '09:00' : '09:00';
                      setEditingTask({
                        ...editingTask,
                        dueDate: e.target.value ? `${e.target.value}T${currentTime}` : ''
                      });
                    }}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Date"
                  />
                  <select
                    value={editingTask.dueDate ? editingTask.dueDate.split('T')[1]?.substring(0, 5) || '09:00' : '09:00'}
                    onChange={(e) => {
                      const currentDate = editingTask.dueDate ? editingTask.dueDate.split('T')[0] : new Date().toISOString().split('T')[0];
                      setEditingTask({
                        ...editingTask,
                        dueDate: currentDate ? `${currentDate}T${e.target.value}` : ''
                      });
                    }}
                    className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const hour = Math.floor(i / 2);
                      const minute = (i % 2) * 30;
                      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const ampm = hour < 12 ? 'AM' : 'PM';
                      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;

                      return (
                        <option key={time24} value={time24}>
                          {time12}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <SubtaskList
                taskId={editingTask.id}
                subtasks={subtasks}
                onAdd={addSubtask}
                onToggle={toggleSubtask}
                onDelete={deleteSubtask}
                loading={loadingSubtasks[editingTask.id]}
              />
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

      {/* Delete Confirmation Modal */}
      {/* SW Update Prompt */}
      <ReloadPrompt />

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
                onClick={() => deleteTask(deleteConfirm)}
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
