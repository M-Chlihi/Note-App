class TaskManager {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    this.currentFilter = 'all';
    this.editingTaskId = null;
    
    this.pomodoroTimer = {
      isRunning: false,
      isPaused: false,
      currentSession: 'focus',
      timeRemaining: 25 * 60, 
      totalTime: 25 * 60,
      sessionsCompleted: parseInt(localStorage.getItem('pomodoroSessions') || '0'),
      totalFocusTime: parseInt(localStorage.getItem('pomodoroFocusTime') || '0'),
      intervalId: null
    };
    
    this.initializeElements();
    this.bindEvents();
    this.loadTasks();
    this.updateStats();
    this.initializeTheme();
    this.initializePomodoro();
  }

  initializeElements() {
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modal = document.querySelector('.modal');
    this.modalTitle = document.getElementById('modal-title');
    this.closeBtn = document.getElementById('close-modal');
    this.cancelBtn = document.getElementById('cancel-btn');
    this.taskForm = document.getElementById('task-form');
    
    this.taskTitle = document.getElementById('task-title');
    this.taskDescription = document.getElementById('task-description');
    this.taskPriority = document.getElementById('task-priority');
    this.taskCategory = document.getElementById('task-category');
    this.taskDueDate = document.getElementById('task-due-date');
    
    this.addTaskBtn = document.getElementById('add-task-btn');
    this.tasksGrid = document.getElementById('tasks-grid');
    this.navItems = document.querySelectorAll('.nav-item');
    this.themeSwitch = document.getElementById('theme-switch');
    
    
    this.totalTasksEl = document.getElementById('total-tasks');
    this.completedTasksEl = document.getElementById('completed-tasks');
    this.pendingTasksEl = document.getElementById('pending-tasks');
    
    this.pomodoroBtn = document.getElementById('pomodoro-btn');
    this.pomodoroModal = document.getElementById('pomodoro-modal');
    this.pomodoroCloseBtn = document.getElementById('pomodoro-close-btn');
    this.timerTime = document.getElementById('timer-time');
    this.timerSession = document.getElementById('timer-session');
    this.timerProgress = document.getElementById('timer-progress');
    this.sessionBtns = document.querySelectorAll('.session-btn');
    this.startBtn = document.getElementById('start-timer');
    this.pauseBtn = document.getElementById('pause-timer');
    this.resetBtn = document.getElementById('reset-timer');
    this.completedSessionsEl = document.getElementById('completed-sessions');
    this.totalFocusTimeEl = document.getElementById('total-focus-time');
    this.currentTaskSection = document.getElementById('current-task-section');
    this.currentTaskName = document.getElementById('current-task-name');
    
    if (!this.addTaskBtn) {
      console.error('Add task button not found');
    }
    if (!this.tasksGrid) {
      console.error('Tasks grid not found');
    }
    if (!this.taskForm) {
      console.error('Task form not found');
    }
    if (!this.modalOverlay) {
      console.error('Modal overlay not found');
    }
  }

  bindEvents() {
    if (this.addTaskBtn) {
      this.addTaskBtn.addEventListener('click', () => this.openModal());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) this.closeModal();
      });
    }
    
    if (this.taskForm) {
      this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveFilter(item.dataset.filter);
      });
    });
    
    if (this.themeSwitch) {
      this.themeSwitch.addEventListener('click', () => this.toggleTheme());
    }
    
    if (this.pomodoroBtn) {
      this.pomodoroBtn.addEventListener('click', () => this.openPomodoroModal());
    }
    if (this.pomodoroCloseBtn) {
      this.pomodoroCloseBtn.addEventListener('click', () => this.closePomodoroModal());
    }
    if (this.pomodoroModal) {
      this.pomodoroModal.addEventListener('click', (e) => {
        if (e.target === this.pomodoroModal) this.closePomodoroModal();
      });
    }
    
    this.sessionBtns.forEach(btn => {
      btn.addEventListener('click', () => this.selectSession(btn.dataset.session, parseInt(btn.dataset.duration)));
    });
    
    
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.startTimer());
    }
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.pauseTimer());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetTimer());
    }
    
    if (this.tasksGrid) {
      this.tasksGrid.addEventListener('click', (e) => {
        const button = e.target.closest('.task-action-btn');
        if (button) {
          const taskCard = button.closest('.task-card');
          const taskId = taskCard.dataset.taskId;
          const action = button.dataset.action;
          
          switch (action) {
            case 'focus':
              this.startPomodoroWithTask(taskId);
              break;
            case 'edit':
              this.openModal(taskId);
              break;
            case 'delete':
              this.deleteTask(taskId);
              break;
            case 'toggle':
              this.toggleTaskComplete(taskId);
              break;
          }
        }
      });
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closePomodoroModal();
      }
      if (e.key === ' ' && this.pomodoroModal && this.pomodoroModal.classList.contains('show')) {
        e.preventDefault();
        if (this.pomodoroTimer.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      }
    });
  }

  openModal(taskId = null) {
    this.editingTaskId = taskId;
    
    if (taskId !== null) {
      const task = this.tasks.find(t => t.id === taskId);
      this.modalTitle.textContent = 'Edit Task';
      this.taskTitle.value = task.title;
      this.taskDescription.value = task.description;
      this.taskPriority.value = task.priority;
      this.taskCategory.value = task.category;
      this.taskDueDate.value = task.dueDate || '';
    } else {
      this.modalTitle.textContent = 'Add New Task';
      this.taskForm.reset();
    }
    
    this.modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.taskTitle.focus();
  }

  closeModal() {
    this.modalOverlay.classList.remove('show');
    document.body.style.overflow = 'auto';
    this.editingTaskId = null;
    this.taskForm.reset();
  }

  handleSubmit(e) {
    e.preventDefault();
    
    const taskData = {
      title: this.taskTitle.value.trim(),
      description: this.taskDescription.value.trim(),
      priority: this.taskPriority.value,
      category: this.taskCategory.value,
      dueDate: this.taskDueDate.value || null,
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (!taskData.title) {
      alert('Please enter a task title');
      return;
    }

    if (this.editingTaskId !== null) {
      // Update existing task
      const taskIndex = this.tasks.findIndex(t => t.id === this.editingTaskId);
      this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
    } else {
      // Add new task
      taskData.id = Date.now().toString();
      this.tasks.unshift(taskData);
    }

    this.saveTasks();
    this.closeModal();
  }

  deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(task => task.id !== taskId);
      this.saveTasks();
    }
  }

  toggleTaskComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
    }
  }

  setActiveFilter(filter) {
    this.currentFilter = filter;
    
    // Upd navig
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.filter === filter);
    });
    
    this.loadTasks();
  }

  loadTasks() {
    let filteredTasks = this.tasks;
    
    switch (this.currentFilter) {
      case 'pending':
        filteredTasks = this.tasks.filter(task => !task.completed);
        break;
      case 'completed':
        filteredTasks = this.tasks.filter(task => task.completed);
        break;
      default:
        filteredTasks = this.tasks;
    }

    this.renderTasks(filteredTasks);
  }

  renderTasks(tasks) {
    this.tasksGrid.innerHTML = '';
    
    if (tasks.length === 0) {
      this.tasksGrid.innerHTML = `
        <div class="empty-state">
          <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
            <i class="uil uil-clipboard-notes" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
            <h3 style="margin-bottom: 0.5rem;">No tasks found</h3>
            <p>${this.currentFilter === 'all' ? 'Create your first task to get started!' : 
               this.currentFilter === 'pending' ? 'All tasks are completed!' : 
               'No completed tasks yet.'}</p>
          </div>
        </div>
      `;
      return;
    }

    tasks.forEach(task => {
      const taskCard = this.createTaskCard(task);
      this.tasksGrid.appendChild(taskCard);
    });
  }

  createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.dataset.taskId = task.id; // Store task id in data attribute
    
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    
    card.innerHTML = `
      <div class="task-header">
        <div class="task-title">${this.escapeHtml(task.title)}</div>
        <div class="task-actions">
          <button class="task-action-btn focus" data-action="focus" title="Start Pomodoro for this task">
            <i class="uil uil-clock"></i>
          </button>
          <button class="task-action-btn edit" data-action="edit" title="Edit task">
            <i class="uil uil-pen"></i>
          </button>
          <button class="task-action-btn delete" data-action="delete" title="Delete task">
            <i class="uil uil-trash"></i>
          </button>
          <button class="task-action-btn ${task.completed ? 'uncomplete' : 'complete'}" 
                  data-action="toggle" 
                  title="${task.completed ? 'Mark as pending' : 'Mark as completed'}">
            <i class="uil ${task.completed ? 'uil-redo' : 'uil-check'}"></i>
          </button>
        </div>
      </div>
      
      ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
      
      <div class="task-meta">
        <span class="task-priority ${task.priority}">
          <i class="uil ${this.getPriorityIcon(task.priority)}"></i>
          ${task.priority}
        </span>
        <span class="task-category ${task.category}">
          <i class="uil ${this.getCategoryIcon(task.category)}"></i>
          ${task.category}
        </span>
      </div>
      
      <div class="task-footer">
        <span class="task-date">Created ${this.formatDate(new Date(task.createdAt))}</span>
        ${dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">
          <i class="uil uil-calendar-alt"></i>
          Due ${this.formatDate(dueDate)}
        </span>` : ''}
      </div>
    `;
    
    return card;
  }

  getPriorityIcon(priority) {
    const icons = {
      low: 'uil-arrow-down',
      medium: 'uil-minus',
      high: 'uil-arrow-up'
    };
    return icons[priority] || 'uil-minus';
  }

  getCategoryIcon(category) {
    const icons = {
      work: 'uil-briefcase',
      personal: 'uil-user',
      shopping: 'uil-shopping-cart',
      health: 'uil-heart',
      other: 'uil-folder'
    };
    return icons[category] || 'uil-folder';
  }

  formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    this.totalTasksEl.textContent = total;
    this.completedTasksEl.textContent = completed;
    this.pendingTasksEl.textContent = pending;
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    this.loadTasks();
    this.updateStats();
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  // Pomodoro Timer Methods
  initializePomodoro() {
    this.updatePomodoroDisplay();
    this.updatePomodoroStats();
    this.setupCurrentTaskDisplay();
  }

  openPomodoroModal() {
    this.pomodoroModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    this.updatePomodoroDisplay();
  }

  closePomodoroModal() {
    this.pomodoroModal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }

  selectSession(sessionType, duration) {
    if (this.pomodoroTimer.isRunning) {
      this.resetTimer();
    }
    
    this.pomodoroTimer.currentSession = sessionType;
    this.pomodoroTimer.timeRemaining = duration * 60;
    this.pomodoroTimer.totalTime = duration * 60;
    
    this.sessionBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.session === sessionType);
    });
    
    this.updatePomodoroDisplay();
  }

  startTimer() {
    if (this.pomodoroTimer.isPaused) {
      this.pomodoroTimer.isPaused = false;
    } else {
      this.pomodoroTimer.isRunning = true;
      this.pomodoroModal.classList.add('timer-running');
    }
    
    this.startBtn.style.display = 'none';
    this.pauseBtn.style.display = 'flex';
    
    this.pomodoroTimer.intervalId = setInterval(() => {
      this.pomodoroTimer.timeRemaining--;
      this.updatePomodoroDisplay();
      
      if (this.pomodoroTimer.timeRemaining <= 0) {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer() {
    this.pomodoroTimer.isRunning = false;
    this.pomodoroTimer.isPaused = true;
    
    clearInterval(this.pomodoroTimer.intervalId);
    this.pomodoroModal.classList.remove('timer-running');
    
    this.startBtn.style.display = 'flex';
    this.pauseBtn.style.display = 'none';
  }

  resetTimer() {
    this.pomodoroTimer.isRunning = false;
    this.pomodoroTimer.isPaused = false;
    
    clearInterval(this.pomodoroTimer.intervalId);
    this.pomodoroModal.classList.remove('timer-running');
    
    this.pomodoroTimer.timeRemaining = this.pomodoroTimer.totalTime;
    
    this.startBtn.style.display = 'flex';
    this.pauseBtn.style.display = 'none';
    
    this.updatePomodoroDisplay();
  }

  completeSession() {
    clearInterval(this.pomodoroTimer.intervalId);
    this.pomodoroModal.classList.remove('timer-running');
    
    // Update stats
    if (this.pomodoroTimer.currentSession === 'focus') {
      this.pomodoroTimer.sessionsCompleted++;
      this.pomodoroTimer.totalFocusTime += this.pomodoroTimer.totalTime / 60;
      localStorage.setItem('pomodoroSessions', this.pomodoroTimer.sessionsCompleted);
      localStorage.setItem('pomodoroFocusTime', this.pomodoroTimer.totalFocusTime);
    }
    
    this.updatePomodoroStats();
    
    this.showNotification(this.getSessionCompleteMessage());
    
    this.autoAdvanceSession();
    
    this.resetTimer();
  }

  autoAdvanceSession() {
    if (this.pomodoroTimer.currentSession === 'focus') {
      const breakType = this.pomodoroTimer.sessionsCompleted % 4 === 0 ? 'long-break' : 'short-break';
      const duration = breakType === 'long-break' ? 15 : 5;
      this.selectSession(breakType, duration);
    } else {
      this.selectSession('focus', 25);
    }
  }

  getSessionCompleteMessage() {
    switch (this.pomodoroTimer.currentSession) {
      case 'focus':
        return '🎉 Focus session completed! Time for a break!';
      case 'short-break':
        return '☕ Short break completed! Ready to focus again?';
      case 'long-break':
        return '🍽️ Long break completed! You\'re refreshed and ready!';
      default:
        return 'Session completed!';
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'pomodoro-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="uil uil-bell"></i>
        <span>${message}</span>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 3000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
    
    this.playNotificationSound();
  }

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  updatePomodoroDisplay() {
    const minutes = Math.floor(this.pomodoroTimer.timeRemaining / 60);
    const seconds = this.pomodoroTimer.timeRemaining % 60;
    
    this.timerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const sessionLabels = {
      focus: 'Focus Time',
      'short-break': 'Short Break',
      'long-break': 'Long Break'
    };
    this.timerSession.textContent = sessionLabels[this.pomodoroTimer.currentSession];
    
    const progress = (this.pomodoroTimer.totalTime - this.pomodoroTimer.timeRemaining) / this.pomodoroTimer.totalTime;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (progress * circumference);
    
    this.timerProgress.style.strokeDashoffset = offset;
    this.timerProgress.className = `timer-progress ${this.pomodoroTimer.currentSession}`;
  }

  updatePomodoroStats() {
    this.completedSessionsEl.textContent = this.pomodoroTimer.sessionsCompleted;
    this.totalFocusTimeEl.textContent = Math.floor(this.pomodoroTimer.totalFocusTime);
  }

  setupCurrentTaskDisplay() {
    const selectedTaskId = localStorage.getItem('selectedTaskForPomodoro');
    if (selectedTaskId) {
      const task = this.tasks.find(t => t.id === selectedTaskId);
      if (task) {
        this.currentTaskSection.style.display = 'block';
        this.currentTaskName.textContent = task.title;
      } else {
        this.currentTaskSection.style.display = 'none';
        localStorage.removeItem('selectedTaskForPomodoro');
      }
    }
  }

  startPomodoroWithTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      localStorage.setItem('selectedTaskForPomodoro', taskId);
      this.openPomodoroModal();
      this.setupCurrentTaskDisplay();
    }
  }
}

let taskManager;
document.addEventListener('DOMContentLoaded', () => {
  try {
    taskManager = new TaskManager();
  } catch (error) {
    console.error('Error initializing TaskManager:', error);
  }
});

window.taskManager = taskManager;