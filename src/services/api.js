const API_BASE_URL = '/api';

const api = {
  onAuthFailure: null,
  csrfToken: null,

  setAuthFailureCallback(callback) {
    this.onAuthFailure = callback;
  },

  async fetchCsrfToken() {
    if (!this.csrfToken) {
      const res = await fetch(`${API_BASE_URL}/auth.php?action=csrf`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        this.csrfToken = data.csrf_token;
      }
    }
    return this.csrfToken;
  },

  clearCsrfToken() {
    this.csrfToken = null;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const isMutating = ['POST', 'PUT', 'DELETE'].includes(method);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (isMutating) {
      const token = await this.fetchCsrfToken();
      if (token) {
        headers['X-CSRF-Token'] = token;
      }
    }

    const config = {
      ...options,
      headers,
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      if (this.onAuthFailure) {
        this.onAuthFailure('session_expired');
      }
      throw new Error('Session expired');
    }

    if (response.status === 403) {
      // CSRF token may have expired — clear and retry once
      this.clearCsrfToken();
      const retryToken = await this.fetchCsrfToken();
      if (retryToken) {
        headers['X-CSRF-Token'] = retryToken;
        const retryResponse = await fetch(url, { ...config, headers });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || `HTTP ${retryResponse.status}`);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  // Auth endpoints
  async register(name, email, password, remember = false) {
    return this.request('/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, remember }),
    });
  },

  async login(email, password, remember = false) {
    return this.request('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    });
  },

  async logout() {
    return this.request('/auth.php?action=logout', {
      method: 'POST',
    });
  },

  async getCurrentUser() {
    return this.request('/auth.php?action=me');
  },

  async resendVerification() {
    return this.request('/auth.php?action=resend');
  },

  // Board endpoints
  async getBoards() {
    return this.request('/boards.php');
  },

  async createBoard(name, color) {
    return this.request('/boards.php', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
  },

  async updateBoard(id, name) {
    return this.request('/boards.php', {
      method: 'PUT',
      body: JSON.stringify({ id, name }),
    });
  },

  async deleteBoard(id) {
    return this.request(`/boards.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // Task endpoints
  async getTasks(boardId) {
    return this.request(`/tasks.php?board_id=${boardId}`);
  },

  async createTask(boardId, title, description = '', dueDate = null) {
    return this.request('/tasks.php', {
      method: 'POST',
      body: JSON.stringify({
        board_id: boardId,
        title,
        description,
        dueDate
      }),
    });
  },

  async updateTask(id, title, description, dueDate) {
    return this.request('/tasks.php', {
      method: 'PUT',
      body: JSON.stringify({ id, title, description, dueDate }),
    });
  },

  async deleteTask(id) {
    return this.request(`/tasks.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  async completeTask(id) {
    return this.request('/tasks.php?action=complete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  async promoteTask(id) {
    return this.request('/tasks.php?action=promote', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  async demoteTask(id) {
    return this.request('/tasks.php?action=demote', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  async postponeTask(id) {
    return this.request('/tasks.php?action=postpone', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  async reorderTask(id, direction) {
    return this.request('/tasks.php?action=reorder', {
      method: 'POST',
      body: JSON.stringify({ id, direction }),
    });
  },

  async undoCompleteTask(id) {
    return this.request('/tasks.php?action=undo', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  // Subtask endpoints
  async getSubtasks(taskId) {
    return this.request(`/subtasks.php?task_id=${taskId}`);
  },

  async createSubtask(taskId, title) {
    return this.request('/subtasks.php', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, title }),
    });
  },

  async toggleSubtask(subtaskId) {
    return this.request('/subtasks.php?action=toggle', {
      method: 'POST',
      body: JSON.stringify({ id: subtaskId }),
    });
  },

  async deleteSubtask(subtaskId) {
    return this.request(`/subtasks.php?id=${subtaskId}`, {
      method: 'DELETE',
    });
  },
};

export default api;
