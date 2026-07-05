// State / Memory
    let tasks = [];
    let isDarkMode = false;
    let selectedStatusFilter = 'all';
    let currentCalendarDate = new Date();
    let deleteTargetId = null;

    // Inspirational Quotes
    const quotes = [
      "Setiap hari adalah kesempatan baru untuk tumbuh.",
      "Lakukan hari ini apa yang orang lain pikirkan untuk besok.",
      "Kunci sukses adalah fokus pada tujuan, bukan hambatan.",
      "Sedikit kemajuan setiap hari menambah hasil yang besar.",
      "Cara terbaik untuk memulai adalah berhenti berbicara dan mulai melakukan.",
      "Waktu Anda terbatas, jangan sia-siakan dengan menjalani hidup orang lain.",
      "Satu-satunya batasan untuk pencapaian kita hari ini adalah keraguan kita hari ini."
    ];

    // DOM Elements
    const elements = {
      digitalClock: document.getElementById('digital-clock'),
      currentDate: document.getElementById('current-date'),
      greetingText: document.getElementById('greeting-text'),
      motivationalQuote: document.getElementById('motivational-quote'),
      themeBtn: document.getElementById('theme-btn'),
      taskForm: document.getElementById('task-form'),
      tasksContainer: document.getElementById('tasks-list-container'),
      searchInput: document.getElementById('search-input'),
      filterCategory: document.getElementById('filter-category'),
      filterPriority: document.getElementById('filter-priority'),
      sortBy: document.getElementById('sort-by'),
      statusTabs: document.querySelectorAll('.status-tab'),
      
      // Progress UI
      circleFill: document.getElementById('circle-fill'),
      progressPercent: document.getElementById('progress-percent'),
      statTotal: document.getElementById('stat-total'),
      statCompleted: document.getElementById('stat-completed'),
      statPending: document.getElementById('stat-pending'),

      // Calendar
      calendarMonthYear: document.getElementById('calendar-month-year'),
      calendarDays: document.getElementById('calendar-days'),
      prevMonthBtn: document.getElementById('prev-month-btn'),
      nextMonthBtn: document.getElementById('next-month-btn'),

      // Modals
      editModal: document.getElementById('edit-modal'),
      editModalClose: document.getElementById('edit-modal-close'),
      editModalCancel: document.getElementById('edit-modal-cancel'),
      editTaskForm: document.getElementById('edit-task-form'),
      deleteModal: document.getElementById('delete-modal'),
      deleteModalCancel: document.getElementById('delete-modal-cancel'),
      deleteModalConfirm: document.getElementById('delete-modal-confirm'),

      // Toast Notification
      toastContainer: document.getElementById('toast-container')
    };

    // Initialize Application
    window.onload = function() {
      initTimeAndGreetings();
      loadDataFromLocalStorage();
      renderApp();
      setupEventHandlers();
      generateRandomQuote();
    };

    // Initialize Realtime Clock & Dynamic Greeting
    function initTimeAndGreetings() {
      function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        elements.digitalClock.textContent = `${hours}:${minutes}:${seconds}`;

        // Dynamic Greeting
        const hourInt = now.getHours();
        let greeting = 'Selamat Malam!';
        if (hourInt >= 5 && hourInt < 11) {
          greeting = 'Selamat Pagi!';
        } else if (hourInt >= 11 && hourInt < 15) {
          greeting = 'Selamat Siang!';
        } else if (hourInt >= 15 && hourInt < 18) {
          greeting = 'Selamat Sore!';
        }
        elements.greetingText.textContent = greeting;
      }

      updateTime();
      setInterval(updateTime, 1000);

      // Display Indonesian formatted Date
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      elements.currentDate.textContent = new Date().toLocaleDateString('id-ID', options);
    }

    // Generate random quote on load
    function generateRandomQuote() {
      const index = Math.floor(Math.random() * quotes.length);
      elements.motivationalQuote.textContent = `"${quotes[index]}"`;
    }

    // Local Storage Persistance
    function loadDataFromLocalStorage() {
      const storedTasks = localStorage.getItem('zen_tasks');
      if (storedTasks) {
        tasks = JSON.parse(storedTasks);
      } else {
        // Fallback default mock data
        tasks = [
          {
            id: '1',
            title: 'Mengerjakan Proyek Portofolio ZenTask',
            desc: 'Menyusun arsitektur front-end To-Do List modern dan memastikan UI responsif.',
            deadline: new Date().toISOString().split('T')[0],
            priority: 'high',
            category: 'Study',
            completed: false,
            favorite: true,
            pinned: true,
            order: 0
          },
          {
            id: '2',
            title: 'Beli bahan makanan mingguan',
            desc: 'Beli sayur, susu, roti, kopi, dan camilan sehat.',
            deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            priority: 'low',
            category: 'Shopping',
            completed: false,
            favorite: false,
            pinned: false,
            order: 1
          }
        ];
        saveTasksToLocalStorage();
      }

      const storedDarkMode = localStorage.getItem('zen_dark_mode');
      if (storedDarkMode === 'true') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        elements.themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      }
    }

    function saveTasksToLocalStorage() {
      localStorage.setItem('zen_tasks', JSON.stringify(tasks));
    }

    // Core Rendering Orchestrator
    function renderApp() {
      renderTasks();
      updateProgressTracker();
      renderCalendar();
    }

    /* ==========================================================================
       TASK RENDERING LOGIC WITH FILTERS & DRAG-AND-DROP
       ========================================================================== */
    function renderTasks() {
      const searchQuery = elements.searchInput.value.toLowerCase().trim();
      const categoryFilter = elements.filterCategory.value;
      const priorityFilter = elements.filterPriority.value;
      const sortingOption = elements.sortBy.value;

      // Filter tasks array
      let filteredTasks = tasks.filter(task => {
        // Search matching
        const matchesSearch = task.title.toLowerCase().includes(searchQuery) || 
                              task.desc.toLowerCase().includes(searchQuery);
        
        // Category matching
        const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;

        // Priority matching
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

        // Status matching
        let matchesStatus = true;
        if (selectedStatusFilter === 'pending') {
          matchesStatus = !task.completed;
        } else if (selectedStatusFilter === 'completed') {
          matchesStatus = task.completed;
        } else if (selectedStatusFilter === 'favorites') {
          matchesStatus = task.favorite;
        }

        return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
      });

      // Pin Sort Rule: Pinned tasks always float to the very top in custom view
      if (sortingOption === 'custom') {
        filteredTasks.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return a.order - b.order;
        });
      } else if (sortingOption === 'deadline-asc') {
        filteredTasks.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
      } else if (sortingOption === 'deadline-desc') {
        filteredTasks.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.deadline) - new Date(a.deadline);
        });
      }

      // Render tasks UI
      elements.tasksContainer.innerHTML = '';

      if (filteredTasks.length === 0) {
        elements.tasksContainer.innerHTML = `
          <div class="empty-state animate-scale-in">
            <div class="empty-state-icon">
              <i class="fa-regular fa-folder-open"></i>
            </div>
            <h4>Tidak ada tugas ditemukan</h4>
            <p>Cobalah untuk memperbarui filter Anda, mencari kata kunci lain, atau membuat tugas baru.</p>
          </div>
        `;
        return;
      }

      filteredTasks.forEach(task => {
        const isOverdue = new Date(task.deadline) < new Date().setHours(0,0,0,0) && !task.completed;
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.completed ? 'completed' : ''} ${task.pinned ? 'pinned' : ''}`;
        taskCard.setAttribute('draggable', 'true');
        taskCard.setAttribute('data-id', task.id);

        // Date beautifier
        const deadlineDate = new Date(task.deadline);
        const deadlineStr = deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        taskCard.innerHTML = `
          <div class="task-header">
            <div class="task-info-left">
              <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleComplete('${task.id}')">
                <i class="fa-solid fa-check"></i>
              </div>
              <div class="task-details">
                <span class="task-title">${task.title}</span>
                ${task.desc ? `<p class="task-desc">${task.desc}</p>` : ''}
                <div class="task-badges">
                  <span class="badge badge-${task.priority}">
                    <i class="fa-solid fa-circle" style="font-size:0.5rem"></i> ${capitalizeFirstLetter(task.priority)}
                  </span>
                  <span class="badge badge-category">
                    <i class="fa-solid fa-tag"></i> ${task.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="task-actions">
            <span class="task-deadline ${isOverdue ? 'overdue' : ''}">
              <i class="fa-regular fa-calendar-days"></i> ${deadlineStr} ${isOverdue ? '(Overdue)' : ''}
            </span>
            <div class="action-buttons">
              <button class="btn-action btn-pin ${task.pinned ? 'active' : ''}" onclick="togglePin('${task.id}')" title="Pin Task">
                <i class="fa-solid fa-thumbtack"></i>
              </button>
              <button class="btn-action btn-fav ${task.favorite ? 'active' : ''}" onclick="toggleFavorite('${task.id}')" title="Favorite Task">
                <i class="fa-solid fa-heart"></i>
              </button>
              <button class="btn-action btn-edit" onclick="openEditModal('${task.id}')" title="Edit Task">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-action btn-delete" onclick="triggerDeleteTask('${task.id}')" title="Delete Task">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `;

        // Register Drag & Drop event handlers to this item
        setupDragAndDropEvents(taskCard);

        elements.tasksContainer.appendChild(taskCard);
      });
    }

    // Capitalize priority text helper
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /* ==========================================================================
       PROGRESS TRACKER & CIRCULAR PROGRESS
       ========================================================================== */
    function updateProgressTracker() {
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const pending = total - completed;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Animate Counter Statistics
      animateValue(elements.statTotal, total);
      animateValue(elements.statCompleted, completed);
      animateValue(elements.statPending, pending);

      // Circle SVG calculation: r=40 -> 2 * PI * r = 251.2
      const strokeOffset = 251.2 - (251.2 * percentage) / 100;
      elements.circleFill.style.strokeDashoffset = strokeOffset;
      elements.progressPercent.textContent = `${percentage}%`;
    }

    function animateValue(obj, end, duration = 400) {
      let start = parseInt(obj.textContent) || 0;
      if (start === end) return;
      let range = end - start;
      let current = start;
      let increment = end > start ? 1 : -1;
      let stepTime = Math.abs(Math.floor(duration / range));
      
      let timer = setInterval(function() {
        current += increment;
        obj.textContent = current;
        if (current == end) {
          clearInterval(timer);
        }
      }, stepTime || 1);
    }

    /* ==========================================================================
       MINI CALENDAR ENGINE
       ========================================================================== */
    function renderCalendar() {
      const year = currentCalendarDate.getFullYear();
      const month = currentCalendarDate.getMonth();
      
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      elements.calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

      elements.calendarDays.innerHTML = '';

      // Get list of deadlines
      const deadlineDays = tasks
        .filter(t => !t.completed)
        .map(t => {
          const date = new Date(t.deadline);
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        });

      // Day names row
      const daysAbbr = ["M", "S", "S", "R", "K", "J", "S"];
      daysAbbr.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-name';
        dayHeader.textContent = day;
        elements.calendarDays.appendChild(dayHeader);
      });

      // Calendar structural logic
      const firstDayIndex = new Date(year, month, 1).getDay();
      const lastDay = new Date(year, month + 1, 0).getDate();

      // Days from previous month empty spaces
      for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        elements.calendarDays.appendChild(emptyCell);
      }

      // Current month dates
      const today = new Date();
      for (let day = 1; day <= lastDay; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        // Is Today highlight
        if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
          dayCell.classList.add('today');
        }

        // Deadline check dot indicator
        const compareDateStr = `${year}-${month}-${day}`;
        if (deadlineDays.includes(compareDateStr)) {
          dayCell.classList.add('has-deadline');
        }

        // Filter task dynamic link on calendar day click
        dayCell.addEventListener('click', () => {
          const paddedMonth = String(month + 1).padStart(2, '0');
          const paddedDay = String(day).padStart(2, '0');
          const clickedDateStr = `${year}-${paddedMonth}-${paddedDay}`;
          elements.searchInput.value = clickedDateStr;
          showToast(`Menampilkan tugas dengan tenggat waktu ${clickedDateStr}`, 'info');
          renderTasks();
        });

        elements.calendarDays.appendChild(dayCell);
      }
    }

    /* ==========================================================================
       DRAG AND DROP HANDLERS
       ========================================================================== */
    let draggedElement = null;

    function setupDragAndDropEvents(el) {
      el.addEventListener('dragstart', (e) => {
        draggedElement = el;
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      el.addEventListener('dragend', () => {
        draggedElement = null;
        el.classList.remove('dragging');
        
        // Save new order index
        const cardElements = elements.tasksContainer.querySelectorAll('.task-card');
        cardElements.forEach((card, index) => {
          const taskId = card.getAttribute('data-id');
          const taskObj = tasks.find(t => t.id === taskId);
          if (taskObj) taskObj.order = index;
        });

        saveTasksToLocalStorage();
        updateProgressTracker();
      });

      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(elements.tasksContainer, e.clientY);
        if (afterElement == null) {
          elements.tasksContainer.appendChild(draggedElement);
        } else {
          elements.tasksContainer.insertBefore(draggedElement, afterElement);
        }
      });
    }

    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /* ==========================================================================
       CRUD / EVENT MUTATORS
       ========================================================================== */
    
    // Add New Task
    elements.taskForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('task-name').value.trim();
      const desc = document.getElementById('task-desc').value.trim();
      const deadline = document.getElementById('task-deadline').value;
      const priority = document.getElementById('task-priority').value;
      const category = document.getElementById('task-category').value;

      if (!name || !deadline) return;

      const newTask = {
        id: Date.now().toString(),
        title: name,
        desc: desc,
        deadline: deadline,
        priority: priority,
        category: category,
        completed: false,
        favorite: false,
        pinned: false,
        order: tasks.length
      };

      tasks.push(newTask);
      saveTasksToLocalStorage();
      renderApp();

      elements.taskForm.reset();
      showToast(`Tugas "${name}" berhasil dibuat!`, 'success');
    });

    // Toggle Complete State
    window.toggleComplete = function(id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        saveTasksToLocalStorage();
        renderApp();
        
        const stateWord = task.completed ? 'diselesaikan' : 'ditunda kembali';
        showToast(`Tugas "${task.title}" telah ${stateWord}`, task.completed ? 'success' : 'info');
      }
    };

    // Toggle Pin (Floating to top)
    window.togglePin = function(id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.pinned = !task.pinned;
        saveTasksToLocalStorage();
        renderApp();
        showToast(task.pinned ? 'Tugas disematkan di paling atas' : 'Sematkan tugas dilepas', 'info');
      }
    };

    // Toggle Favorite Flag
    window.toggleFavorite = function(id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.favorite = !task.favorite;
        saveTasksToLocalStorage();
        renderApp();
        showToast(task.favorite ? 'Tugas ditambahkan ke Favorit' : 'Tugas dihapus dari Favorit', 'info');
      }
    };

    // Open Edit Modal Form with filled states
    window.openEditModal = function(id) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        document.getElementById('edit-task-id').value = task.id;
        document.getElementById('edit-task-name').value = task.title;
        document.getElementById('edit-task-desc').value = task.desc;
        document.getElementById('edit-task-deadline').value = task.deadline;
        document.getElementById('edit-task-priority').value = task.priority;
        document.getElementById('edit-task-category').value = task.category;

        elements.editModal.classList.add('open');
      }
    };

    // Close Edit Modal Handlers
    function closeEditModal() {
      elements.editModal.classList.remove('open');
    }
    elements.editModalClose.addEventListener('click', closeEditModal);
    elements.editModalCancel.addEventListener('click', closeEditModal);

    // Save Edited Changes
    elements.editTaskForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const id = document.getElementById('edit-task-id').value;
      const task = tasks.find(t => t.id === id);

      if (task) {
        task.title = document.getElementById('edit-task-name').value.trim();
        task.desc = document.getElementById('edit-task-desc').value.trim();
        task.deadline = document.getElementById('edit-task-deadline').value;
        task.priority = document.getElementById('edit-task-priority').value;
        task.category = document.getElementById('edit-task-category').value;

        saveTasksToLocalStorage();
        renderApp();
        closeEditModal();
        showToast('Tugas berhasil diperbarui!', 'success');
      }
    });

    // Delete Operations
    window.triggerDeleteTask = function(id) {
      deleteTargetId = id;
      elements.deleteModal.classList.add('open');
    };

    function closeDeleteModal() {
      elements.deleteModal.classList.remove('open');
      deleteTargetId = null;
    }
    elements.deleteModalCancel.addEventListener('click', closeDeleteModal);

    elements.deleteModalConfirm.addEventListener('click', function() {
      if (deleteTargetId) {
        const taskIndex = tasks.findIndex(t => t.id === deleteTargetId);
        if (taskIndex > -1) {
          const taskTitle = tasks[taskIndex].title;
          tasks.splice(taskIndex, 1);
          saveTasksToLocalStorage();
          renderApp();
          showToast(`Tugas "${taskTitle}" telah dihapus`, 'danger');
        }
      }
      closeDeleteModal();
    });

    /* ==========================================================================
       UI INTERACTIVITY & NOTIFICATIONS
       ========================================================================== */

    // Toast Generator system
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      let iconClass = 'fa-circle-info';
      if (type === 'success') iconClass = 'fa-circle-check';
      if (type === 'warning') iconClass = 'fa-triangle-exclamation';
      if (type === 'danger') iconClass = 'fa-circle-exclamation';

      toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <span class="toast-message">${message}</span>
      `;

      elements.toastContainer.appendChild(toast);

      // Remove Toast after timeout
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px) scale(0.9)';
        setTimeout(() => toast.remove(), 400);
      }, 4000);
    }

    // Interactive Ripple Effect trigger
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('ripple-btn') || e.target.closest('.ripple-btn')) {
        const btn = e.target.classList.contains('ripple-btn') ? e.target : e.target.closest('.ripple-btn');
        const circle = document.createElement('span');
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        const radius = diameter / 2;

        const rect = btn.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.className = 'ripple';

        const existingRipple = btn.querySelector('.ripple');
        if (existingRipple) {
          existingRipple.remove();
        }

        btn.appendChild(circle);
      }
    });

    // Dark / Light Mode Switch
    elements.themeBtn.addEventListener('click', function() {
      isDarkMode = !isDarkMode;
      document.body.classList.toggle('dark-mode', isDarkMode);
      localStorage.setItem('zen_dark_mode', isDarkMode);

      if (isDarkMode) {
        elements.themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        showToast('Mode gelap diaktifkan', 'info');
      } else {
        elements.themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        showToast('Mode terang diaktifkan', 'info');
      }
    });

    // Filtering & Sorting listeners
    function setupEventHandlers() {
      elements.searchInput.addEventListener('input', renderTasks);
      elements.filterCategory.addEventListener('change', renderTasks);
      elements.filterPriority.addEventListener('change', renderTasks);
      elements.sortBy.addEventListener('change', renderTasks);

      // Status Tabs Logic
      elements.statusTabs.forEach(tab => {
        tab.addEventListener('click', function() {
          elements.statusTabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          selectedStatusFilter = this.getAttribute('data-status');
          renderTasks();
        });
      });

      // Calendar controls
      elements.prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
      });

      elements.nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
      });
    }