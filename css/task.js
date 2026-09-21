/* =========================================================
   Zeeourney — task.js
   Everything related to the Task feature.
   ========================================================= */

let tasks = [];

let taskFilter = 'all';       // all | pending | completed | overdue
let taskSortBy = 'deadline';  // deadline | difficulty | name
let taskSortOrder = 'asc';    // asc | desc
let taskSearchTerm = '';
let editingTaskId = null;

const DIFFICULTY_ORDER = { Easy: 1, Medium: 2, Hard: 3 };

/* ---------- Storage ---------- */

function loadTasks() {
  const raw = localStorage.getItem('zeeourney_tasks');
  tasks = raw ? JSON.parse(raw) : [];
}

function saveTasks() {
  localStorage.setItem('zeeourney_tasks', JSON.stringify(tasks));
}

/* ---------- Helpers ---------- */

function isTaskOverdue(task) {
  return !task.completed && task.deadline < todayISO();
}

/* ---------- CRUD ---------- */

function addTask(data) {
  tasks.push({
    id: generateId(),
    name: data.name,
    deadline: data.deadline,
    difficulty: data.difficulty,
    completed: false
  });
  saveTasks();
  renderTasks();
  renderDashboard();
}

function editTask(id, data) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;
  task.name = data.name;
  task.deadline = data.deadline;
  task.difficulty = data.difficulty;
  saveTasks();
  renderTasks();
  renderDashboard();
}

function deleteTask(id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  renderTasks();
  renderDashboard();
}

function toggleTask(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  renderDashboard();
}

/* ---------- Filter / sort / search ---------- */

function getFilteredSortedTasks() {
  let list = tasks.slice();

  if (taskFilter === 'pending') {
    list = list.filter(function (t) { return !t.completed; });
  } else if (taskFilter === 'completed') {
    list = list.filter(function (t) { return t.completed; });
  } else if (taskFilter === 'overdue') {
    list = list.filter(isTaskOverdue);
  }

  if (taskSearchTerm.trim() !== '') {
    const term = taskSearchTerm.trim().toLowerCase();
    list = list.filter(function (t) { return t.name.toLowerCase().includes(term); });
  }

  list.sort(function (a, b) {
    let result = 0;
    if (taskSortBy === 'deadline') {
      result = a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
    } else if (taskSortBy === 'difficulty') {
      result = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
    } else if (taskSortBy === 'name') {
      result = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
    return taskSortOrder === 'asc' ? result : -result;
  });

  return list;
}

/* ---------- Rendering ---------- */

function renderTasks() {
  const container = document.getElementById('task-list');
  container.textContent = '';

  const list = getFilteredSortedTasks();
  document.getElementById('task-empty').classList.toggle('hidden', list.length > 0);

  list.forEach(function (task) {
    container.append(buildTaskCard(task));
  });
}

function buildTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card diff-' + task.difficulty.toLowerCase();

  const main = document.createElement('div');
  main.className = 'task-main';

  const name = document.createElement('p');
  name.className = 'task-name' + (task.completed ? ' completed' : '');
  name.textContent = task.name;
  main.append(name);

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  const deadlineSpan = document.createElement('span');
  deadlineSpan.className = 'badge-meta';
  deadlineSpan.textContent = formatDateDisplay(task.deadline);
  meta.append(deadlineSpan);

  const diffBadge = document.createElement('span');
  diffBadge.className = 'badge badge-diff-' + task.difficulty.toLowerCase();
  diffBadge.textContent = task.difficulty;
  meta.append(diffBadge);

  if (isTaskOverdue(task)) {
    const overdueBadge = document.createElement('span');
    overdueBadge.className = 'badge badge-overdue';
    overdueBadge.textContent = 'Overdue';
    meta.append(overdueBadge);
  } else if (!task.completed && task.deadline === todayISO()) {
    const todayBadge = document.createElement('span');
    todayBadge.className = 'badge badge-today';
    todayBadge.textContent = 'Due today';
    meta.append(todayBadge);
  }

  if (task.completed) {
    const doneBadge = document.createElement('span');
    doneBadge.className = 'badge badge-completed';
    doneBadge.textContent = 'Completed';
    meta.append(doneBadge);
  }

  main.append(meta);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const completeBtn = document.createElement('button');
  completeBtn.type = 'button';
  completeBtn.className = 'btn btn-secondary btn-sm';
  completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
  completeBtn.addEventListener('click', function () { toggleTask(task.id); });

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn-ghost btn-sm';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function () { openEditTaskModal(task.id); });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger-ghost btn-sm';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', function () {
    if (confirm('Delete "' + task.name + '"?')) deleteTask(task.id);
  });

  actions.append(completeBtn, editBtn, deleteBtn);
  card.append(main, actions);
  return card;
}

/* ---------- Modal ---------- */

function clearTaskFormErrors() {
  document.querySelectorAll('#task-form .form-error').forEach(function (el) {
    el.classList.remove('show');
  });
}

function validateTaskForm(data) {
  clearTaskFormErrors();
  let valid = true;

  if (!data.name.trim()) {
    document.getElementById('task-name-error').classList.add('show');
    valid = false;
  }
  if (!data.deadline) {
    document.getElementById('task-deadline-error').classList.add('show');
    valid = false;
  }
  if (!data.difficulty) {
    document.getElementById('task-difficulty-error').classList.add('show');
    valid = false;
  }
  return valid;
}

function openAddTaskModal() {
  editingTaskId = null;
  document.getElementById('task-modal-title').textContent = 'Add Task';
  document.getElementById('task-form').reset();
  clearTaskFormErrors();
  openModal('task-modal');
}

function openEditTaskModal(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;

  editingTaskId = id;
  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-name-input').value = task.name;
  document.getElementById('task-deadline-input').value = task.deadline;
  document.getElementById('task-difficulty-input').value = task.difficulty;
  clearTaskFormErrors();
  openModal('task-modal');
}

/* ---------- Wiring ---------- */

function setupTaskPage() {
  document.getElementById('add-task-btn').addEventListener('click', openAddTaskModal);
  document.getElementById('task-cancel-btn').addEventListener('click', function () {
    closeModal('task-modal');
  });

  document.getElementById('task-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const data = {
      name: document.getElementById('task-name-input').value,
      deadline: document.getElementById('task-deadline-input').value,
      difficulty: document.getElementById('task-difficulty-input').value
    };

    if (!validateTaskForm(data)) return;
    data.name = data.name.trim();

    if (editingTaskId) {
      editTask(editingTaskId, data);
    } else {
      addTask(data);
    }
    closeModal('task-modal');
  });

  document.querySelectorAll('.task-filter-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.task-filter-tab').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');
      taskFilter = tab.dataset.filter;
      renderTasks();
    });
  });

  document.getElementById('task-sort-select').addEventListener('change', function (event) {
    taskSortBy = event.target.value;
    renderTasks();
  });

  document.getElementById('task-order-toggle').addEventListener('click', function () {
    taskSortOrder = taskSortOrder === 'asc' ? 'desc' : 'asc';
    this.textContent = taskSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending';
    renderTasks();
  });

  document.getElementById('task-search-input').addEventListener('input', function (event) {
    taskSearchTerm = event.target.value;
    renderTasks();
  });
}
