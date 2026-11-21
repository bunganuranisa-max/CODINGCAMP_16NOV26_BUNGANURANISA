document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. THEME (LIGHT / DARK MODE)
  // ==========================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('dashboard_theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️ Light Mode';
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('dashboard_theme', isDark ? 'dark' : 'light');
  });

  // ==========================================
  // 2. GREETING, CLOCK & CUSTOM NAME
  // ==========================================
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greetingTextEl = document.getElementById('greeting-text');
  const editNameBtn = document.getElementById('edit-name-btn');
  const nameInputContainer = document.getElementById('name-input-container');
  const userNameInput = document.getElementById('user-name-input');
  const saveNameBtn = document.getElementById('save-name-btn');

  let userName = localStorage.getItem('dashboard_username') || '';

  function updateClockAndGreeting() {
    const now = new Date();

    // Format Time (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds}`;

    // Format Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);

    // Greeting based on time of day
    const hourNum = now.getHours();
    let greeting = 'Good Evening';
    if (hourNum >= 5 && hourNum < 12) {
      greeting = 'Good Morning';
    } else if (hourNum >= 12 && hourNum < 18) {
      greeting = 'Good Afternoon';
    }

    greetingTextEl.textContent = userName ? `${greeting}, ${userName}` : greeting;
  }

  editNameBtn.addEventListener('click', () => {
    nameInputContainer.classList.toggle('hidden');
    userNameInput.value = userName;
    userNameInput.focus();
  });

  saveNameBtn.addEventListener('click', () => {
    userName = userNameInput.value.trim();
    localStorage.setItem('dashboard_username', userName);
    nameInputContainer.classList.add('hidden');
    updateClockAndGreeting();
  });

  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);

  // ==========================================
  // 3. FOCUS TIMER (POMODORO)
  // ==========================================
  const timerDisplay = document.getElementById('timer-display');
  const startTimerBtn = document.getElementById('start-timer');
  const stopTimerBtn = document.getElementById('stop-timer');
  const resetTimerBtn = document.getElementById('reset-timer');
  const customMinutesInput = document.getElementById('custom-minutes');
  const setTimerBtn = document.getElementById('set-timer-btn');

  let defaultSeconds = 25 * 60;
  let remainingSeconds = defaultSeconds;
  let timerInterval = null;

  function renderTimer() {
    const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
    const secs = String(remainingSeconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }

  startTimerBtn.addEventListener('click', () => {
    if (timerInterval) return; // Prevent multiple intervals
    timerInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        renderTimer();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        alert('Focus session complete! Time for a break.');
      }
    }, 1000);
  });

  stopTimerBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
  });

  resetTimerBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    remainingSeconds = defaultSeconds;
    renderTimer();
  });

  setTimerBtn.addEventListener('click', () => {
    const mins = parseInt(customMinutesInput.value, 10);
    if (mins && mins >= 1 && mins <= 120) {
      clearInterval(timerInterval);
      timerInterval = null;
      defaultSeconds = mins * 60;
      remainingSeconds = defaultSeconds;
      renderTimer();
    }
  });

  // ==========================================
  // 4. TO-DO LIST (CRUD, SORT, NO DUPLICATES)
  // ==========================================
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');
  const taskError = document.getElementById('task-error');
  const sortTasksSelect = document.getElementById('sort-tasks');

  let tasks = JSON.parse(localStorage.getItem('dashboard_tasks')) || [];

  function saveTasks() {
    localStorage.setItem('dashboard_tasks', JSON.stringify(tasks));
  }

  function renderTasks() {
    taskList.innerHTML = '';

    // Copy array for sorting
    const sortedTasks = [...tasks];
    const sortBy = sortTasksSelect.value;

    if (sortBy === 'newest') {
      sortedTasks.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'oldest') {
      sortedTasks.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'az') {
      sortedTasks.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortBy === 'status') {
      sortedTasks.sort((a, b) => Number(a.completed) - Number(b.completed));
    }

    sortedTasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-item';

      // Checkbox + Task Text
      const leftDiv = document.createElement('div');
      leftDiv.className = 'task-left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      const span = document.createElement('span');
      span.className = `task-text ${task.completed ? 'completed' : ''}`;
      span.textContent = task.text;

      leftDiv.appendChild(checkbox);
      leftDiv.appendChild(span);

      // Edit & Delete Buttons
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'task-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        const newText = prompt('Edit your task:', task.text);
        if (newText !== null) {
          const trimmed = newText.trim();
          if (!trimmed) return;

          // Prevent duplicate on edit
          const isDuplicate = tasks.some(
            (t) => t.id !== task.id && t.text.toLowerCase() === trimmed.toLowerCase()
          );
          if (isDuplicate) {
            alert('Task with this name already exists!');
            return;
          }

          task.text = trimmed;
          saveTasks();
          renderTasks();
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(leftDiv);
      li.appendChild(actionsDiv);
      taskList.appendChild(li);
    });
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    // Challenge: Prevent duplicate tasks
    const isDuplicate = tasks.some((t) => t.text.toLowerCase() === text.toLowerCase());
    if (isDuplicate) {
      taskError.classList.remove('hidden');
      return;
    }

    taskError.classList.add('hidden');
    tasks.push({
      id: Date.now(),
      text: text,
      completed: false
    });

    taskInput.value = '';
    saveTasks();
    renderTasks();
  });

  taskInput.addEventListener('input', () => {
    taskError.classList.add('hidden');
  });

  sortTasksSelect.addEventListener('change', renderTasks);
  renderTasks();

  // ==========================================
  // 5. QUICK LINKS
  // ==========================================
  const linkForm = document.getElementById('link-form');
  const linkNameInput = document.getElementById('link-name');
  const linkUrlInput = document.getElementById('link-url');
  const linksContainer = document.getElementById('links-container');

  // Default starter links if Local Storage is empty
  const defaultLinks = [
    { id: 1, name: 'Google', url: 'https://www.google.com' },
    { id: 2, name: 'Gmail', url: 'https://mail.google.com' },
    { id: 3, name: 'Calendar', url: 'https://calendar.google.com' }
  ];

  let quickLinks = JSON.parse(localStorage.getItem('dashboard_links'));
  if (!quickLinks) {
    quickLinks = defaultLinks;
    localStorage.setItem('dashboard_links', JSON.stringify(quickLinks));
  }

  function saveLinks() {
    localStorage.setItem('dashboard_links', JSON.stringify(quickLinks));
  }

  function renderLinks() {
    linksContainer.innerHTML = '';
    quickLinks.forEach((link) => {
      const anchor = document.createElement('a');
      anchor.className = 'link-pill';
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-link';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove link';
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent opening link when clicking X
        quickLinks = quickLinks.filter((l) => l.id !== link.id);
        saveLinks();
        renderLinks();
      });

      anchor.appendChild(removeBtn);
      linksContainer.appendChild(anchor);
    });
  }

  linkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = linkNameInput.value.trim();
    let url = linkUrlInput.value.trim();

    if (!name || !url) return;

    // Ensure valid protocol
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    quickLinks.push({
      id: Date.now(),
      name: name,
      url: url
    });

    linkNameInput.value = '';
    linkUrlInput.value = '';
    saveLinks();
    renderLinks();
  });

  renderLinks();
});