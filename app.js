(() => {
  const STORAGE_KEY = 'todo-app-tasks';

  const input = document.getElementById('todo-input');
  const addBtn = document.getElementById('add-btn');
  const list = document.getElementById('todo-list');
  const taskCount = document.getElementById('task-count');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let todos = loadTodos();
  let currentFilter = 'all';
  let dragSrcIndex = null;

  function loadTodos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.push({ id: Date.now(), text: trimmed, completed: false });
    saveTodos();
    render();
    input.value = '';
    input.focus();
  }

  function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) todo.completed = !todo.completed;
    saveTodos();
    render();
  }

  function deleteTodo(id) {
    const item = list.querySelector(`[data-id="${id}"]`);
    if (item) {
      item.classList.add('removing');
      item.addEventListener('animationend', () => {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        render();
      });
    }
  }

  function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    render();
  }

  function getFilteredTodos() {
    if (currentFilter === 'active') return todos.filter(t => !t.completed);
    if (currentFilter === 'completed') return todos.filter(t => t.completed);
    return todos;
  }

  function updateCount() {
    const active = todos.filter(t => !t.completed).length;
    taskCount.textContent = `${active} 件の未完了タスク`;
  }

  function createTodoElement(todo, index) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;
    li.draggable = true;
    li.dataset.index = index;

    const checkbox = document.createElement('div');
    checkbox.className = 'todo-checkbox';
    checkbox.addEventListener('click', () => toggleTodo(todo.id));

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-delete';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', '削除');
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    // Drag & Drop
    li.addEventListener('dragstart', e => {
      dragSrcIndex = todos.indexOf(todo);
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    li.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', e => {
      e.preventDefault();
      li.classList.remove('drag-over');
      const targetIndex = todos.indexOf(todo);
      if (dragSrcIndex !== null && dragSrcIndex !== targetIndex) {
        const [moved] = todos.splice(dragSrcIndex, 1);
        todos.splice(targetIndex, 0, moved);
        saveTodos();
        render();
      }
    });

    li.append(checkbox, text, deleteBtn);
    return li;
  }

  function render() {
    const filtered = getFilteredTodos();
    list.innerHTML = '';
    filtered.forEach((todo, i) => list.appendChild(createTodoElement(todo, i)));
    updateCount();
  }

  // Event listeners
  let isComposing = false;

  input.addEventListener('compositionstart', () => { isComposing = true; });
  input.addEventListener('compositionend', () => { isComposing = false; });

  addBtn.addEventListener('click', () => addTodo(input.value));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !isComposing) addTodo(input.value);
  });

  clearCompletedBtn.addEventListener('click', clearCompleted);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  render();
})();
