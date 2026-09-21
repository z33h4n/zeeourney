/* =========================================================
   Zeeourney — main.js
   Shared utilities, navigation, and dashboard rendering.
   Loaded before task.js and list.js.
   ========================================================= */

/* ---------- Small helpers ---------- */

// Creates a reasonably unique id without needing a library.
function generateId() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Returns today's date as "YYYY-MM-DD" in the user's local time zone,
// so it can be compared directly with <input type="date"> values.
function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// Turns "2026-09-15" into a friendly "Sep 15, 2026".
function formatDateDisplay(isoDate) {
  if (!isoDate) return '-';
  const parts = isoDate.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ---------- Navigation ---------- */

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function (page) {
    page.classList.add('hidden');
  });

  const target = document.getElementById(pageId);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.classList.toggle('active', link.dataset.target === pageId);
  });

  // Close the mobile menu after navigating.
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');

  if (pageId === 'dashboard') renderDashboard();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupNav() {
  document.querySelector('.brand').addEventListener('click', function () {
    showPage('dashboard');
  });

  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      showPage(link.dataset.target);
    });
  });

  document.getElementById('hamburger').addEventListener('click', function () {
    document.getElementById('nav-links').classList.toggle('open');
    this.classList.toggle('open');
  });
}

/* ---------- Modal helpers ---------- */

function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function setupModalOverlays() {
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) overlay.classList.add('hidden');
    });
  });
}

/* ---------- Dashboard ---------- */

function getGreetingWord() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Good morning';
  if (hour < 15) return 'Good afternoon';
  if (hour < 19) return 'Good evening';
  return 'Good night';
}

function renderDashboard() {
  setText('dash-greeting-text', getGreetingWord() + ', Zee');
  setText('dash-date', new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }));

  // Task summary
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(function (t) { return t.completed; }).length;
  const overdueTasks = tasks.filter(isTaskOverdue).length;
  const pendingTasks = totalTasks - completedTasks;

  setText('stat-task-total', totalTasks);
  setText('stat-task-pending', pendingTasks);
  setText('stat-task-completed', completedTasks);
  setText('stat-task-overdue', overdueTasks);

  // List summary
  const totalItems = items.length;
  const neededItems = items.filter(function (i) { return !i.completed; }).length;
  const completedItems = items.filter(function (i) { return i.completed; }).length;

  setText('stat-list-total', totalItems);
  setText('stat-list-needed', neededItems);
  setText('stat-list-completed', completedItems);

  renderUpcomingTasksPreview();
  renderNeededItemsPreview();
}

function renderUpcomingTasksPreview() {
  const container = document.getElementById('preview-tasks');
  container.textContent = '';

  const upcoming = tasks
    .filter(function (t) { return !t.completed; })
    .slice()
    .sort(function (a, b) { return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0; })
    .slice(0, 4);

  if (upcoming.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'preview-empty';
    empty.textContent = 'No pending tasks. Nice.';
    container.append(empty);
    return;
  }

  upcoming.forEach(function (task) {
    const row = document.createElement('div');
    row.className = 'preview-row';

    const name = document.createElement('span');
    name.textContent = task.name;

    const date = document.createElement('span');
    date.textContent = formatDateDisplay(task.deadline);
    if (isTaskOverdue(task)) date.style.color = 'var(--color-level-high)';

    row.append(name, date);
    container.append(row);
  });
}

function renderNeededItemsPreview() {
  const container = document.getElementById('preview-items');
  container.textContent = '';

  const needed = items.filter(function (i) { return !i.completed; }).slice(0, 4);

  if (needed.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'preview-empty';
    empty.textContent = 'All items ready.';
    container.append(empty);
    return;
  }

  needed.forEach(function (item) {
    const row = document.createElement('div');
    row.className = 'preview-row';

    const name = document.createElement('span');
    name.textContent = item.name;

    const qty = document.createElement('span');
    qty.textContent = 'x' + item.quantity;

    row.append(name, qty);
    container.append(row);
  });
}

function setupDashboardShortcuts() {
  document.getElementById('preview-tasks-link').addEventListener('click', function () {
    showPage('task');
  });
  document.getElementById('preview-items-link').addEventListener('click', function () {
    showPage('list');
  });
}

/* ---------- App init ---------- */

function initApp() {
  loadTasks();
  loadLists();

  setupNav();
  setupModalOverlays();
  setupDashboardShortcuts();
  setupTaskPage();
  setupListPage();

  renderTasks();
  renderLists();
  renderDashboard();
}

document.addEventListener('DOMContentLoaded', initApp);
