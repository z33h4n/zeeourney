/* =========================================================
   Zeeourney — list.js
   Everything related to the List feature.
   ========================================================= */

let items = [];

let listFilter = 'all';    // all | uncompleted | completed
let listSortBy = 'name';   // name | priority | category
let listSortOrder = 'asc'; // asc | desc
let listSearchTerm = '';
let editingItemId = null;

const PRIORITY_ORDER = { Low: 1, Medium: 2, High: 3 };

/* ---------- Storage ---------- */

function loadLists() {
  const raw = localStorage.getItem('zeeourney_lists');
  items = raw ? JSON.parse(raw) : [];
}

function saveLists() {
  localStorage.setItem('zeeourney_lists', JSON.stringify(items));
}

/* ---------- CRUD ---------- */

function addListItem(data) {
  items.push({
    id: generateId(),
    name: data.name,
    category: data.category,
    quantity: data.quantity,
    priority: data.priority,
    notes: data.notes,
    completed: false
  });
  saveLists();
  renderLists();
  renderDashboard();
}

function editListItem(id, data) {
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.name = data.name;
  item.category = data.category;
  item.quantity = data.quantity;
  item.priority = data.priority;
  item.notes = data.notes;
  saveLists();
  renderLists();
  renderDashboard();
}

function deleteListItem(id) {
  items = items.filter(function (i) { return i.id !== id; });
  saveLists();
  renderLists();
  renderDashboard();
}

function toggleListItem(id) {
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;
  item.completed = !item.completed;
  saveLists();
  renderLists();
  renderDashboard();
}

/* ---------- Filter / sort / search ---------- */

function getFilteredSortedItems() {
  let list = items.slice();

  if (listFilter === 'uncompleted') {
    list = list.filter(function (i) { return !i.completed; });
  } else if (listFilter === 'completed') {
    list = list.filter(function (i) { return i.completed; });
  }

  if (listSearchTerm.trim() !== '') {
    const term = listSearchTerm.trim().toLowerCase();
    list = list.filter(function (i) { return i.name.toLowerCase().includes(term); });
  }

  list.sort(function (a, b) {
    let result = 0;
    if (listSortBy === 'name') {
      result = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    } else if (listSortBy === 'priority') {
      result = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    } else if (listSortBy === 'category') {
      result = a.category.toLowerCase().localeCompare(b.category.toLowerCase());
    }
    return listSortOrder === 'asc' ? result : -result;
  });

  return list;
}

/* ---------- Rendering ---------- */

function renderLists() {
  const container = document.getElementById('item-list');
  container.textContent = '';

  const list = getFilteredSortedItems();
  document.getElementById('item-empty').classList.toggle('hidden', list.length > 0);

  list.forEach(function (item) {
    container.append(buildListCard(item));
  });
}

function buildListCard(item) {
  const card = document.createElement('div');
  card.className = 'list-card';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'list-checkbox';
  checkbox.checked = item.completed;
  checkbox.setAttribute('aria-label', 'Mark "' + item.name + '" as done');
  checkbox.addEventListener('change', function () { toggleListItem(item.id); });

  const main = document.createElement('div');
  main.className = 'list-main';

  const name = document.createElement('p');
  name.className = 'item-name' + (item.completed ? ' completed' : '');
  name.textContent = item.name;
  main.append(name);

  const meta = document.createElement('div');
  meta.className = 'item-meta';

  const qty = document.createElement('span');
  qty.className = 'badge-meta';
  qty.textContent = 'x' + item.quantity;
  meta.append(qty);

  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'badge badge-category';
  categoryBadge.textContent = item.category;
  meta.append(categoryBadge);

  const priorityBadge = document.createElement('span');
  priorityBadge.className = 'badge badge-prio-' + item.priority.toLowerCase();
  priorityBadge.textContent = item.priority;
  meta.append(priorityBadge);

  main.append(meta);

  if (item.notes && item.notes.trim() !== '') {
    const notes = document.createElement('p');
    notes.className = 'item-notes';
    notes.textContent = item.notes;
    main.append(notes);
  }

  const actions = document.createElement('div');
  actions.className = 'list-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn btn-ghost btn-sm';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function () { openEditItemModal(item.id); });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger-ghost btn-sm';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', function () {
    if (confirm('Delete "' + item.name + '"?')) deleteListItem(item.id);
  });

  actions.append(editBtn, deleteBtn);
  card.append(checkbox, main, actions);
  return card;
}

/* ---------- Modal ---------- */

function clearItemFormErrors() {
  document.querySelectorAll('#item-form .form-error').forEach(function (el) {
    el.classList.remove('show');
  });
}

function validateItemForm(data) {
  clearItemFormErrors();
  let valid = true;

  if (!data.name.trim()) {
    document.getElementById('item-name-error').classList.add('show');
    valid = false;
  }
  if (!data.category) {
    document.getElementById('item-category-error').classList.add('show');
    valid = false;
  }
  if (!data.quantity || data.quantity < 1) {
    document.getElementById('item-quantity-error').classList.add('show');
    valid = false;
  }
  if (!data.priority) {
    document.getElementById('item-priority-error').classList.add('show');
    valid = false;
  }
  return valid;
}

function openAddItemModal() {
  editingItemId = null;
  document.getElementById('item-modal-title').textContent = 'Add Item';
  document.getElementById('item-form').reset();
  document.getElementById('item-quantity-input').value = 1;
  clearItemFormErrors();
  openModal('item-modal');
}

function openEditItemModal(id) {
  const item = items.find(function (i) { return i.id === id; });
  if (!item) return;

  editingItemId = id;
  document.getElementById('item-modal-title').textContent = 'Edit Item';
  document.getElementById('item-name-input').value = item.name;
  document.getElementById('item-category-input').value = item.category;
  document.getElementById('item-quantity-input').value = item.quantity;
  document.getElementById('item-priority-input').value = item.priority;
  document.getElementById('item-notes-input').value = item.notes || '';
  clearItemFormErrors();
  openModal('item-modal');
}

/* ---------- Wiring ---------- */

function setupListPage() {
  document.getElementById('add-item-btn').addEventListener('click', openAddItemModal);
  document.getElementById('item-cancel-btn').addEventListener('click', function () {
    closeModal('item-modal');
  });

  document.getElementById('item-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const data = {
      name: document.getElementById('item-name-input').value,
      category: document.getElementById('item-category-input').value,
      quantity: Number(document.getElementById('item-quantity-input').value),
      priority: document.getElementById('item-priority-input').value,
      notes: document.getElementById('item-notes-input').value.trim()
    };

    if (!validateItemForm(data)) return;
    data.name = data.name.trim();

    if (editingItemId) {
      editListItem(editingItemId, data);
    } else {
      addListItem(data);
    }
    closeModal('item-modal');
  });

  document.querySelectorAll('.list-filter-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.list-filter-tab').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');
      listFilter = tab.dataset.filter;
      renderLists();
    });
  });

  document.getElementById('list-sort-select').addEventListener('change', function (event) {
    listSortBy = event.target.value;
    renderLists();
  });

  document.getElementById('list-order-toggle').addEventListener('click', function () {
    listSortOrder = listSortOrder === 'asc' ? 'desc' : 'asc';
    this.textContent = listSortOrder === 'asc' ? '↑ Ascending' : '↓ Descending';
    renderLists();
  });

  document.getElementById('list-search-input').addEventListener('input', function (event) {
    listSearchTerm = event.target.value;
    renderLists();
  });
}
