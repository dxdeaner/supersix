import { useState, useEffect, useRef, useCallback } from 'react';
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
import useFocusTrap from './hooks/useFocusTrap';

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
  const [dragSource, setDragSource] = useState(null); // 'active' | 'queue'

  // Completion animation state
  const [completingTask, setCompletingTask] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and drop handlers
  const handleDragStart = (taskId, fromIndex, section) => {
    setDraggedTask(taskId);
    setDraggedFromIndex(fromIndex);
    setDragSource(section || 'active');
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverIndex(null);
    setDraggedFromIndex(null);
    setDragSource(null);
  };

  const handleDragOver = (overIndex) => {
    setDragOverIndex(overIndex);
  };

  const handleDrop = async (toIndex) => {
    if (draggedTask && dragSource === 'active' && draggedFromIndex !== null && draggedFromIndex !== toIndex) {
      // Active-to-active reorder
      if (draggedFromIndex < toIndex) {
        for (let i = draggedFromIndex; i < toIndex; i++) {
          await moveTaskDown(draggedTask);
        }
      } else {
        for (let i = draggedFromIndex; i > toIndex; i--) {
          await moveTaskUp(draggedTask);
        }
      }
    }
    handleDragEnd();
  };

  // Drop handler for empty active slots (queue → active promotion)
  const handleEmptySlotDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleEmptySlotDrop = async (e) => {
    e.preventDefault();
    if (draggedTask && dragSource === 'queue') {
      await promoteTask(draggedTask);
    }
    handleDragEnd();
  };

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
    // Phase 4: Optimistic subtask toggle (no withGuard — allow rapid-fire)
    const prevSubtasks = { ...subtasks };
    setSubtasks(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    }));

    try {
      await api.toggleSubtask(subtaskId);
      scheduleReconcileSubtasks(taskId);
    } catch (err) {
      setSubtasks(prevSubtasks);
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

  const updateSubtaskTitle = async (subtaskId, taskId, newTitle) => {
    if (!newTitle.trim()) return;

    const prevSubtasks = { ...subtasks };
    setSubtasks(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(s =>
        s.id === subtaskId ? { ...s, title: newTitle.trim() } : s
      )
    }));

    try {
      await api.updateSubtask(subtaskId, newTitle.trim());
      scheduleReconcileSubtasks(taskId);
    } catch (err) {
      setSubtasks(prevSubtasks);
      setError('Failed to update subtask: ' + err.message);
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
  const [viewingTaskId, setViewingTaskId] = useState(null);

  // View mode: 'board' or 'journal'
  const [viewMode, setViewMode] = useState('board');

  // Journal state
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalPage, setJournalPage] = useState(1);
  const [journalHasMore, setJournalHasMore] = useState(false);
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [selectedJournalTag, setSelectedJournalTag] = useState(null);
  const [editingJournalId, setEditingJournalId] = useState(null);
  const [editingJournalContent, setEditingJournalContent] = useState('');
  const [editingJournalTag, setEditingJournalTag] = useState(null);
  const [journalDeleteConfirm, setJournalDeleteConfirm] = useState(null);

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

  // Modal refs for focus traps (Phase 3)
  const createBoardRef = useRef(null);
  const editBoardRef = useRef(null);
  const editTaskRef = useRef(null);
  const viewTaskRef = useRef(null);
  const deleteConfirmRef = useRef(null);

  // Focus traps for inline modals (Phase 3)
  useFocusTrap(createBoardRef, showBoardModal, () => {
    setShowBoardModal(false);
    setNewBoardName('');
  });
  useFocusTrap(editBoardRef, !!editingBoard, () => setEditingBoard(null));
  useFocusTrap(editTaskRef, !!editingTask, () => setEditingTask(null));
  useFocusTrap(viewTaskRef, !!viewingTaskId, () => setViewingTaskId(null));
  useFocusTrap(deleteConfirmRef, !!deleteConfirm, () => setDeleteConfirm(null));

  // Error toast auto-dismiss (Phase 3: fix transient error bug)
  useEffect(() => {
    if (error && boards.length > 0) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, boards.length]);

  // Phase 4: Background reconciliation
  const reconcileRef = useRef(null);
  const reconcileSubtasksRef = useRef(null);

  const scheduleReconcile = useCallback(() => {
    if (reconcileRef.current) clearTimeout(reconcileRef.current);
    reconcileRef.current = setTimeout(() => loadTasks(), 2000);
  }, [currentBoard]);

  const scheduleReconcileSubtasks = useCallback((taskId) => {
    if (reconcileSubtasksRef.current) clearTimeout(reconcileSubtasksRef.current);
    reconcileSubtasksRef.current = setTimeout(() => loadSubtasks(taskId), 2000);
  }, []);

  // Clean up reconciliation timers on unmount
  useEffect(() => {
    return () => {
      if (reconcileRef.current) clearTimeout(reconcileRef.current);
      if (reconcileSubtasksRef.current) clearTimeout(reconcileSubtasksRef.current);
    };
  }, []);

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

    // Reset journal state
    setViewMode('board');
    setJournalEntries([]);
    setJournalPage(1);
    setJournalHasMore(false);
    setNewJournalEntry('');
    setSelectedJournalTag(null);
    setEditingJournalId(null);
    setJournalDeleteConfirm(null);
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

  // Phase 4: withOptimistic helper — composes with withGuard
  const withOptimistic = (apiFn, optimisticUpdate, getSnapshot) =>
    withGuard(async (...args) => {
      const snapshot = getSnapshot();
      optimisticUpdate(...args);
      try {
        await apiFn(...args);
        scheduleReconcile();
      } catch (err) {
        snapshot.forEach(([setter, value]) => setter(value));
        setError('Failed: ' + err.message);
      }
    });

  // Task management functions — Phase 4: optimistic updates (+ completion animation)
  const completeTaskInner = withOptimistic(
    (taskId) => api.completeTask(taskId),
    (taskId) => {
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'completed', completedAt: new Date().toISOString() }
          : t
      ));
      setCompletingTask(null);
    },
    () => [[setTasks, [...tasks]]]
  );

  const completeTask = (taskId) => {
    // Start animation, then after 1.2s perform the actual completion
    setCompletingTask(taskId);
    setTimeout(() => {
      completeTaskInner(taskId);
    }, 1200);
  };

  const postponeTask = withOptimistic(
    (taskId) => api.postponeTask(taskId),
    (taskId) => {
      const maxQueuePos = Math.max(0, ...tasks.filter(t => t.status === 'queued').map(t => t.position));
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'queued', position: maxQueuePos + 1 }
          : t
      ));
    },
    () => [[setTasks, [...tasks]]]
  );

  const deleteTask = withOptimistic(
    (taskId) => api.deleteTask(taskId),
    (taskId) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setDeleteConfirm(null);
    },
    () => [[setTasks, [...tasks]], [setDeleteConfirm, deleteConfirm]]
  );

  const promoteTask = withOptimistic(
    (taskId) => api.promoteTask(taskId),
    (taskId) => {
      setMovingTask(taskId);
      setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);
      const maxActivePos = Math.max(0, ...tasks.filter(t => t.status === 'active').map(t => t.position));
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'active', position: maxActivePos + 1 }
          : t
      ));
    },
    () => [[setTasks, [...tasks]]]
  );

  const demoteTask = withOptimistic(
    (taskId) => api.demoteTask(taskId),
    (taskId) => {
      setMovingTask(taskId);
      setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);
      const maxQueuePos = Math.max(0, ...tasks.filter(t => t.status === 'queued').map(t => t.position));
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'queued', position: maxQueuePos + 1 }
          : t
      ));
    },
    () => [[setTasks, [...tasks]]]
  );

  const moveTaskUp = withOptimistic(
    (taskId) => api.reorderTask(taskId, 'up'),
    (taskId) => {
      setMovingTask(taskId);
      setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);
      setTasks(prev => {
        const task = prev.find(t => t.id === taskId);
        if (!task) return prev;
        const sameStatus = prev
          .filter(t => t.status === task.status)
          .sort((a, b) => a.position - b.position);
        const idx = sameStatus.findIndex(t => t.id === taskId);
        if (idx <= 0) return prev;
        const neighbor = sameStatus[idx - 1];
        return prev.map(t => {
          if (t.id === taskId) return { ...t, position: neighbor.position };
          if (t.id === neighbor.id) return { ...t, position: task.position };
          return t;
        });
      });
    },
    () => [[setTasks, [...tasks]]]
  );

  const moveTaskDown = withOptimistic(
    (taskId) => api.reorderTask(taskId, 'down'),
    (taskId) => {
      setMovingTask(taskId);
      setTimeout(() => setMovingTask(null), ANIMATION_DELAY_MS);
      setTasks(prev => {
        const task = prev.find(t => t.id === taskId);
        if (!task) return prev;
        const sameStatus = prev
          .filter(t => t.status === task.status)
          .sort((a, b) => a.position - b.position);
        const idx = sameStatus.findIndex(t => t.id === taskId);
        if (idx >= sameStatus.length - 1) return prev;
        const neighbor = sameStatus[idx + 1];
        return prev.map(t => {
          if (t.id === taskId) return { ...t, position: neighbor.position };
          if (t.id === neighbor.id) return { ...t, position: task.position };
          return t;
        });
      });
    },
    () => [[setTasks, [...tasks]]]
  );

  const addTask = withOptimistic(
    async () => {
      const trimmed = newTask.trim();
      if (!trimmed) return;
      const activeCount = tasks.filter(t => t.status === 'active').length;
      const result = await api.createTask(currentBoard, trimmed);
      // Auto-promote if there's room in active focus
      if (activeCount < MAX_ACTIVE_TASKS && result && result.id) {
        await api.promoteTask(result.id);
      }
    },
    () => {
      const trimmed = newTask.trim();
      if (!trimmed) return;
      const activeCount = tasks.filter(t => t.status === 'active').length;
      const hasRoom = activeCount < MAX_ACTIVE_TASKS;

      if (hasRoom) {
        const maxActivePos = Math.max(0, ...tasks.filter(t => t.status === 'active').map(t => t.position));
        const tempTask = {
          id: 'temp-' + Date.now(),
          title: trimmed,
          status: 'active',
          position: maxActivePos + 1,
          boardId: currentBoard,
          description: '',
          dueDate: null,
          completedAt: null,
        };
        setTasks(prev => [...prev, tempTask]);
      } else {
        const maxQueuePos = Math.max(0, ...tasks.filter(t => t.status === 'queued').map(t => t.position));
        const tempTask = {
          id: 'temp-' + Date.now(),
          title: trimmed,
          status: 'queued',
          position: maxQueuePos + 1,
          boardId: currentBoard,
          description: '',
          dueDate: null,
          completedAt: null,
        };
        setTasks(prev => [...prev, tempTask]);
      }
      setNewTask('');
    },
    () => [[setTasks, [...tasks]], [setNewTask, newTask]]
  );

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

  const viewTask = (taskId) => {
    setViewingTaskId(taskId);
    loadSubtasks(taskId);
  };

  const viewToEdit = () => {
    const id = viewingTaskId;
    setViewingTaskId(null);
    editTask(id);
  };

  const saveEdit = withOptimistic(
    async () => {
      await api.updateTask(
        editingTask.id,
        editingTask.title,
        editingTask.description,
        editingTask.dueDate || null
      );
    },
    () => {
      setTasks(prev => prev.map(t =>
        t.id === editingTask.id
          ? { ...t, title: editingTask.title, description: editingTask.description, dueDate: editingTask.dueDate || null }
          : t
      ));
      setEditingTask(null);
    },
    () => [[setTasks, [...tasks]], [setEditingTask, editingTask]]
  );

  const undoComplete = withOptimistic(
    (taskId) => api.undoCompleteTask(taskId),
    (taskId) => {
      const maxQueuePos = Math.max(0, ...tasks.filter(t => t.status === 'queued').map(t => t.position));
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'queued', completedAt: null, position: maxQueuePos + 1 }
          : t
      ));
    },
    () => [[setTasks, [...tasks]]]
  );

  // Helper functions
  const getBoardStats = (boardId) => {
    const activeTasks = tasks.filter(t => t.boardId === boardId && t.status === 'active').length;
    return `${activeTasks}/${MAX_ACTIVE_TASKS}`;
  };

  const switchBoard = (boardId) => {
    if (boardId !== currentBoard) {
      setSubtasks({});
      setCurrentBoard(boardId);
      setViewMode('board');
    }
  };

  // Journal functions
  const loadJournalEntries = async (page = 1) => {
    setJournalLoading(true);
    try {
      const data = await api.getJournalEntries(page);
      if (page === 1) {
        setJournalEntries(data.entries);
      } else {
        setJournalEntries(prev => [...prev, ...data.entries]);
      }
      setJournalHasMore(data.hasMore);
      setJournalPage(page);
    } catch (err) {
      setError('Failed to load journal entries: ' + err.message);
    } finally {
      setJournalLoading(false);
    }
  };

  const addJournalEntry = async () => {
    const content = newJournalEntry.trim();
    if (!content) return;
    try {
      const entry = await api.createJournalEntry(content, selectedJournalTag);
      setJournalEntries(prev => [entry, ...prev]);
      setNewJournalEntry('');
      setSelectedJournalTag(null);
    } catch (err) {
      setError('Failed to add journal entry: ' + err.message);
    }
  };

  const saveJournalEdit = async () => {
    const content = editingJournalContent.trim();
    if (!content || !editingJournalId) return;
    try {
      await api.updateJournalEntry(editingJournalId, content, editingJournalTag);
      setJournalEntries(prev => prev.map(e =>
        e.id === editingJournalId ? { ...e, content, tag: editingJournalTag, updatedAt: new Date().toISOString() } : e
      ));
      setEditingJournalId(null);
      setEditingJournalContent('');
      setEditingJournalTag(null);
    } catch (err) {
      setError('Failed to update journal entry: ' + err.message);
    }
  };

  const deleteJournalEntry = async (id) => {
    try {
      await api.deleteJournalEntry(id);
      setJournalEntries(prev => prev.filter(e => e.id !== id));
      setJournalDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete journal entry: ' + err.message);
    }
  };

  // Load/refresh journal entries when switching to journal view
  useEffect(() => {
    if (viewMode === 'journal') {
      loadJournalEntries(1);
    }
  }, [viewMode]);

  // ARIA tabs: arrow key navigation (Phase 3)
  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = activeTab === 'active' ? 'completed' : 'active';
      setActiveTab(next);
      const tabId = next === 'active' ? 'tab-active' : 'tab-completed';
      document.getElementById(tabId)?.focus();
    }
  };

  // Board menu keyboard handler (Phase 3)
  const handleBoardMenuKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setBoardMenuOpen(null);
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

  const viewingTask = viewingTaskId ? tasks.find(t => t.id === viewingTaskId) : null;

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
      <nav
        aria-label="Boards"
        className={`w-64 bg-slate-800 border-r border-slate-700 transition-transform duration-300 ease-in-out ${windowWidth >= DESKTOP_BREAKPOINT ? 'static shrink-0' : `fixed inset-y-0 left-0 z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Boards</h2>
          {windowWidth < DESKTOP_BREAKPOINT && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Close sidebar"
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
                      aria-label="Board options"
                      aria-expanded={boardMenuOpen === board.id}
                      aria-haspopup="true"
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
                    role="menu"
                    onKeyDown={handleBoardMenuKeyDown}
                  >
                    <button
                      onClick={() => {
                        setEditingBoard({ id: board.id, name: board.name });
                        setBoardMenuOpen(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center space-x-2 rounded-t-lg"
                      role="menuitem"
                    >
                      <Icon name="edit" size={14} />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={() => archiveBoard(board.id)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center space-x-2 rounded-b-lg"
                      role="menuitem"
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
                  <div key={board.id} className="p-2 text-slate-500 text-sm">
                    <span>{board.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar backdrop for mobile */}
      {sidebarOpen && windowWidth < DESKTOP_BREAKPOINT && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Visually-hidden h1 for screen readers (Phase 3) */}
        <h1 className="sr-only">SuperSix Task Manager</h1>

        {/* Mobile Header */}
        {windowWidth < DESKTOP_BREAKPOINT && (
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white"
              aria-label="Open sidebar menu"
            >
              <Icon name="menu" size={24} />
            </button>
            <img src="/SuperSix-Logo.png" alt="SuperSix" className="h-8" />
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => { setViewMode(viewMode === 'journal' ? 'board' : 'journal'); }}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'journal' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  aria-label="Toggle journal"
                  aria-pressed={viewMode === 'journal'}
                >
                  <Icon name="book-open" size={18} />
                </button>
              )}
              <UserHeader
                user={user}
                onLogout={handleLogout}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            </div>
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
            <div className="absolute right-6 top-6 flex items-center gap-3">
              {user && (
                <button
                  onClick={() => { setViewMode(viewMode === 'journal' ? 'board' : 'journal'); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${viewMode === 'journal' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  aria-label="Toggle journal"
                  aria-pressed={viewMode === 'journal'}
                >
                  <Icon name="book-open" size={16} />
                  <span className="text-sm font-medium">Journal</span>
                </button>
              )}
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

        {/* Error Toast (Phase 3: fix transient error bug — errors now visible) */}
        {error && boards.length > 0 && (
          <div
            role="alert"
            className="mx-4 mt-2 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg flex items-center justify-between"
          >
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 ml-4 flex-shrink-0"
              aria-label="Dismiss error"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {/* Email Verification Banner */}
        {showEmailBanner && (
          <EmailVerificationBanner user={user} />
        )}

        <div className="container mx-auto px-2 py-8 max-w-4xl overflow-x-hidden">
          {viewMode === 'board' ? (
          <>
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

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icon name="search" size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation with Add Button (Phase 3: ARIA tabs) */}
          <div className={`mb-6 ${windowWidth >= 768 ? 'relative flex justify-center' : 'flex justify-center items-center space-x-4'}`}>
            <button
              onClick={() => setShowQuickAddModal(true)}
              className={`w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-all hover:shadow-lg shadow-orange-500/20 ${windowWidth >= 768 ? 'absolute left-0 top-1/2 transform -translate-y-1/2' : ''}`}
              aria-label="Add new task"
            >
              <Icon name="plus" size={20} />
            </button>

            <div className="bg-slate-800 rounded-lg p-1" role="tablist" aria-label="Task views">
              <button
                id="tab-active"
                role="tab"
                aria-selected={activeTab === 'active'}
                aria-controls="tabpanel-active"
                tabIndex={activeTab === 'active' ? 0 : -1}
                onClick={() => setActiveTab('active')}
                onKeyDown={handleTabKeyDown}
                className={`px-6 py-2 rounded-md transition-all ${activeTab === 'active' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
              >
                Active & Queue
              </button>
              <button
                id="tab-completed"
                role="tab"
                aria-selected={activeTab === 'completed'}
                aria-controls="tabpanel-completed"
                tabIndex={activeTab === 'completed' ? 0 : -1}
                onClick={() => setActiveTab('completed')}
                onKeyDown={handleTabKeyDown}
                className={`px-6 py-2 rounded-md transition-all ${activeTab === 'completed' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-300 hover:text-white'}`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Content */}
          {searchQuery.trim() ? (
            /* Search Results View */
            (() => {
              const query = searchQuery.trim().toLowerCase();
              const matchActive = activeTasks.filter(t =>
                t.title.toLowerCase().includes(query) ||
                (t.description && t.description.toLowerCase().includes(query))
              );
              const matchQueued = queuedTasks.filter(t =>
                t.title.toLowerCase().includes(query) ||
                (t.description && t.description.toLowerCase().includes(query))
              );
              const matchCompleted = completedTasks.filter(t =>
                t.title.toLowerCase().includes(query) ||
                (t.description && t.description.toLowerCase().includes(query))
              );
              const totalResults = matchActive.length + matchQueued.length + matchCompleted.length;

              return (
                <div>
                  <p className="text-slate-400 text-sm mb-4" aria-live="polite">
                    {totalResults} {totalResults === 1 ? 'task' : 'tasks'} found
                  </p>

                  {totalResults === 0 && (
                    <div className="text-center py-12">
                      <div className="text-slate-500 mb-2">
                        <Icon name="search" size={40} />
                      </div>
                      <p className="text-slate-400">No tasks match your search</p>
                    </div>
                  )}

                  {matchActive.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                        Active ({matchActive.length})
                      </h3>
                      <div className="space-y-2">
                        {matchActive.map(task => (
                          <div
                            key={task.id}
                            className="bg-slate-800 rounded-lg p-3 border border-cyan-500/30 cursor-pointer hover:border-cyan-400/50 transition-colors"
                            onClick={() => viewTask(task.id)}
                          >
                            <h4 className="text-white font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-slate-400 text-sm mt-1 line-clamp-1">{task.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchQueued.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                        Queued ({matchQueued.length})
                      </h3>
                      <div className="space-y-2">
                        {matchQueued.map(task => (
                          <div
                            key={task.id}
                            className="bg-slate-800/50 rounded-lg p-3 border border-orange-500/30 cursor-pointer hover:border-orange-400/50 transition-colors"
                            onClick={() => viewTask(task.id)}
                          >
                            <h4 className="text-white font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-slate-400 text-sm mt-1 line-clamp-1">{task.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchCompleted.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Completed ({matchCompleted.length})
                      </h3>
                      <div className="space-y-2">
                        {matchCompleted.map(task => (
                          <div
                            key={task.id}
                            className="bg-slate-800/50 rounded-lg p-3 border border-green-500/30"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-white font-medium line-through opacity-75">{task.title}</h4>
                                {task.description && (
                                  <p className="text-slate-500 text-sm mt-1 line-clamp-1">{task.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => undoComplete(task.id)}
                                className="text-yellow-400 hover:text-yellow-300 text-sm flex-shrink-0 ml-2"
                                aria-label={`Undo completion of ${task.title}`}
                              >
                                Undo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : tasks.length === 0 && !loading ? (
            /* Empty State for New Boards */
            <div className="text-center py-16">
              {/* Clipboard illustration */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto mb-6">
                <rect x="25" y="20" width="70" height="85" rx="8" stroke="#475569" strokeWidth="2" fill="#1e293b" />
                <rect x="40" y="10" width="40" height="16" rx="4" stroke="#475569" strokeWidth="2" fill="#334155" />
                <circle cx="60" cy="18" r="3" fill="#22d3ee" />
                <rect x="38" y="42" width="44" height="4" rx="2" fill="#334155" />
                <rect x="38" y="54" width="36" height="4" rx="2" fill="#334155" />
                <rect x="38" y="66" width="40" height="4" rx="2" fill="#334155" />
                <rect x="38" y="78" width="28" height="4" rx="2" fill="#334155" />
                {/* Sparkle */}
                <path d="M90 25l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#f97316" opacity="0.8" />
                <path d="M20 70l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" fill="#22d3ee" opacity="0.6" />
              </svg>

              <h2 className="text-2xl font-semibold text-white mb-3">Ready to focus?</h2>
              <p className="text-slate-400 max-w-sm mx-auto mb-8">
                Add your first task to get started. SuperSix keeps you focused on what matters most.
              </p>
              <button
                onClick={() => setShowQuickAddModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <Icon name="plus" size={20} />
                <span>Add Your First Task</span>
              </button>
            </div>
          ) : activeTab === 'active' ? (
            <div
              id="tabpanel-active"
              role="tabpanel"
              aria-labelledby="tab-active"
              className="space-y-8"
            >
              {/* Active Focus Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3" aria-hidden="true"></span>
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
                        isCompleting={completingTask === task.id}
                        onComplete={completeTask}
                        onPostpone={postponeTask}
                        onEdit={editTask}
                        onView={viewTask}
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
                        className={`relative bg-slate-800 rounded-lg p-4 border-2 border-dashed transition-colors ${dragSource === 'queue' ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-slate-600'}`}
                        onDragOver={handleEmptySlotDragOver}
                        onDrop={handleEmptySlotDrop}
                      >
                        <div className="absolute left-0 -top-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-700 text-slate-300">
                          {slotIndex + 1}
                        </div>
                        <div className="ml-4 text-slate-500 italic">
                          {dragSource === 'queue' ? 'Drop here to activate' : 'Empty slot - promote from queue or add new task'}
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
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-3" aria-hidden="true"></span>
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
                          onView={viewTask}
                          onDelete={(taskId) => setDeleteConfirm(taskId)}
                          onMoveUp={moveTaskUp}
                          onMoveDown={moveTaskDown}
                          onPromote={promoteTask}
                          canMoveUp={index > 0}
                          canMoveDown={index < queuedTasks.length - 1}
                          isMoving={movingTask === task.id}
                          subtasks={subtasks}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
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
                        placeholder={activeTasks.length < MAX_ACTIVE_TASKS ? 'Add new task (auto-activates)...' : 'Add new task to queue...'}
                        aria-label="New task title"
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
            <div
              id="tabpanel-completed"
              role="tabpanel"
              aria-labelledby="tab-completed"
            >
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
                          aria-label={`Undo completion of ${task.title}`}
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
          </>
          ) : (
          /* Global Journal View */
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Icon name="book-open" size={24} />
                Journal
              </h2>
              <button
                onClick={() => setViewMode('board')}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Back to board
              </button>
            </div>

            {/* New entry input */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
              <textarea
                value={newJournalEntry}
                onChange={(e) => setNewJournalEntry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addJournalEntry();
                  }
                }}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 resize-none mb-3"
                aria-label="New journal entry"
              />
              {/* Tag selector */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { value: 'blocker', label: 'Blocker', color: 'red' },
                  { value: 'win', label: 'Win', color: 'green' },
                  { value: 'idea', label: 'Idea', color: 'yellow' },
                  { value: 'reflection', label: 'Reflection', color: 'blue' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedJournalTag(selectedJournalTag === value ? null : value)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      selectedJournalTag === value
                        ? `bg-${color}-500/20 border-${color}-500/50 text-${color}-300`
                        : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Ctrl+Enter to submit</span>
                <button
                  onClick={addJournalEntry}
                  disabled={!newJournalEntry.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Add Entry
                </button>
              </div>
            </div>

            {/* Entries feed */}
            {journalLoading && journalEntries.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Loading entries...</p>
            ) : journalEntries.length === 0 ? (
              <p className="text-slate-500 italic text-center py-8">No journal entries yet. Write your first one above!</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(() => {
                  let lastDateLabel = '';
                  return journalEntries.map((entry) => {
                    const entryDate = new Date(entry.createdAt);
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    let dateLabel;
                    if (entryDate.toDateString() === today.toDateString()) {
                      dateLabel = 'Today';
                    } else if (entryDate.toDateString() === yesterday.toDateString()) {
                      dateLabel = 'Yesterday';
                    } else {
                      dateLabel = entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                    }

                    const showHeader = dateLabel !== lastDateLabel;
                    lastDateLabel = dateLabel;

                    const isAuto = entry.entryType === 'auto';
                    const tagColors = { blocker: 'red', win: 'green', idea: 'yellow', reflection: 'blue' };

                    return (
                      <div key={entry.id}>
                        {showHeader && (
                          <h3 className="text-slate-400 text-sm font-medium mt-4 mb-1 first:mt-0">{dateLabel}</h3>
                        )}
                        <div className="py-1.5 px-2 rounded group hover:bg-slate-800/40 transition-colors">
                          {editingJournalId === entry.id ? (
                            <div>
                              <textarea
                                value={editingJournalContent}
                                onChange={(e) => setEditingJournalContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    saveJournalEdit();
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingJournalId(null);
                                    setEditingJournalContent('');
                                    setEditingJournalTag(null);
                                  }
                                }}
                                rows={3}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400 resize-none mb-2"
                                autoFocus
                              />
                              <div className="flex flex-wrap gap-2 mb-2">
                                {[
                                  { value: 'blocker', label: 'Blocker', color: 'red' },
                                  { value: 'win', label: 'Win', color: 'green' },
                                  { value: 'idea', label: 'Idea', color: 'yellow' },
                                  { value: 'reflection', label: 'Reflection', color: 'blue' },
                                ].map(({ value, label, color }) => (
                                  <button
                                    key={value}
                                    onClick={() => setEditingJournalTag(editingJournalTag === value ? null : value)}
                                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                      editingJournalTag === value
                                        ? `bg-${color}-500/20 border-${color}-500/50 text-${color}-300`
                                        : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => { setEditingJournalId(null); setEditingJournalContent(''); setEditingJournalTag(null); }}
                                  className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveJournalEdit}
                                  disabled={!editingJournalContent.trim()}
                                  className="px-3 py-1 text-sm bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded transition-colors"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm min-w-0">
                              <span className="text-slate-500 text-xs flex-shrink-0 w-16 text-right">
                                {entryDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                              </span>
                              {isAuto && (
                                <span className="text-slate-500 flex-shrink-0">
                                  <Icon name="clock" size={12} />
                                </span>
                              )}
                              {entry.tag && (
                                <span className={`flex-shrink-0 px-1.5 py-0 text-xs rounded-full bg-${tagColors[entry.tag]}-500/20 text-${tagColors[entry.tag]}-300`}>
                                  {entry.tag}
                                </span>
                              )}
                              <span className={`truncate flex-1 min-w-0 ${isAuto ? 'text-slate-400' : 'text-slate-200'}`} title={entry.content}>
                                {entry.content}
                              </span>
                              {isAuto && entry.boardName && (
                                <span className="text-slate-500 text-xs flex-shrink-0">
                                  · {entry.boardName}
                                </span>
                              )}
                              {!isAuto && entry.updatedAt !== entry.createdAt && (
                                <span className="text-slate-600 text-xs flex-shrink-0">edited</span>
                              )}
                              {!isAuto && (
                                <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => { setEditingJournalId(entry.id); setEditingJournalContent(entry.content); setEditingJournalTag(entry.tag); }}
                                    className="text-slate-400 hover:text-cyan-400 text-xs"
                                    aria-label="Edit entry"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setJournalDeleteConfirm(entry.id)}
                                    className="text-slate-400 hover:text-red-400 text-xs"
                                    aria-label="Delete entry"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}

                {journalHasMore && (
                  <button
                    onClick={() => loadJournalEntries(journalPage + 1)}
                    disabled={journalLoading}
                    className="w-full py-3 text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {journalLoading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </>
          )}
        </div>
      </div>

      {/* Modals */}

      {/* Quick Add Task Modal */}
      <QuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onAdd={async (taskTitle) => {
          if (currentBoard) {
            try {
              const activeCount = tasks.filter(t => t.status === 'active').length;
              const result = await api.createTask(currentBoard, taskTitle);
              // Auto-promote if there's room in active focus
              if (activeCount < MAX_ACTIVE_TASKS && result && result.id) {
                await api.promoteTask(result.id);
              }
              loadTasks();
            } catch (err) {
              setError('Failed to add task: ' + err.message);
            }
          }
        }}
        loading={loading}
        hasActiveRoom={activeTasks.length < MAX_ACTIVE_TASKS}
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
          <div
            ref={createBoardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-board-title"
            className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 w-full"
          >
            <h3 id="create-board-title" className="text-white font-semibold mb-4">Create New Board</h3>

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
          <div
            ref={editBoardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-board-title"
            className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 w-full"
          >
            <h3 id="edit-board-title" className="text-white font-semibold mb-4">Rename Board</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Board Name</label>
                <input
                  type="text"
                  value={editingBoard.name}
                  onChange={(e) => setEditingBoard({ ...editingBoard, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && editBoard(editingBoard.id, editingBoard.name)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
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

      {/* View Task Modal */}
      {viewingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={viewTaskRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-task-title"
            className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="view-task-title" className="text-white font-semibold">Task Details</h3>
              <button
                onClick={() => setViewingTaskId(null)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Title</label>
                <p className="text-white text-lg font-medium">{viewingTask.title}</p>
              </div>

              {viewingTask.description && (
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Description</label>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{viewingTask.description}</p>
                </div>
              )}

              {viewingTask.dueDate && (
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Due Date</label>
                  <div className="flex items-center space-x-2">
                    <Icon name="clock" size={14} />
                    <span className={`text-sm ${new Date(viewingTask.dueDate) < new Date() ? 'text-red-400' : 'text-slate-300'}`}>
                      {new Date(viewingTask.dueDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <SubtaskList
                taskId={viewingTask.id}
                subtasks={subtasks}
                onToggle={toggleSubtask}
                onUpdate={updateSubtaskTitle}
                loading={loadingSubtasks[viewingTask.id]}
                mode="view"
              />
            </div>

            <div className="flex space-x-2 justify-end mt-6">
              <button
                onClick={() => setViewingTaskId(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
              >
                Close
              </button>
              <button
                onClick={viewToEdit}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors flex items-center space-x-1"
              >
                <Icon name="edit-3" size={14} />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            ref={editTaskRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
            className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700 w-full"
          >
            <h3 id="edit-task-title" className="text-white font-semibold mb-4">Edit Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
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
                    aria-label="Due date"
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
                    aria-label="Due time"
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
                onUpdate={updateSubtaskTitle}
                loading={loadingSubtasks[editingTask.id]}
                mode="edit"
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
          <div
            ref={deleteConfirmRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            className="bg-slate-800 rounded-lg p-6 max-w-sm mx-4 border border-slate-700"
          >
            <h3 id="delete-confirm-title" className="text-white font-semibold mb-2">Delete Task</h3>
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

      {/* Journal Delete Confirmation */}
      {journalDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-slate-800 rounded-lg p-6 max-w-sm mx-4 border border-slate-700"
          >
            <h3 className="text-white font-semibold mb-2">Delete Journal Entry</h3>
            <p className="text-slate-300 mb-4">
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </p>
            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => setJournalDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJournalEntry(journalDeleteConfirm)}
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
