// ===== DOM ЭЛЕМЕНТЫ =====
let noteForm, noteInput, notesList, emptyState, statusEl;

// ===== ЗАГРУЗКА ЗАМЕТОК ИЗ LOCALSTORAGE =====
function loadNotes() {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  return notes;
}

// ===== СОХРАНЕНИЕ ЗАМЕТОК В LOCALSTORAGE =====
function saveNotes(notes) {
  localStorage.setItem('notes', JSON.stringify(notes));
}

// ===== ОТРИСОВКА СПИСКА ЗАМЕТОК =====
function renderNotes() {
  const notes = loadNotes();
  notesList.innerHTML = '';

  if (notes.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  notes.forEach((note, index) => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.innerHTML = `
      <span class="note-item__text">${escapeHtml(note.text)}</span>
      <button class="note-item__delete" data-index="${index}">Удалить</button>
    `;
    notesList.appendChild(li);
  });

  document.querySelectorAll('.note-item__delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      deleteNote(index);
    });
  });
}

// ===== ЭКРАНИРОВАНИЕ HTML (защита от XSS) =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== ДОБАВЛЕНИЕ ЗАМЕТКИ =====
function addNote(text) {
  const notes = loadNotes();
  notes.unshift({
    id: Date.now(),
    text: text.trim(),
    createdAt: new Date().toISOString()
  });
  saveNotes(notes);
  renderNotes();
}

// ===== УДАЛЕНИЕ ЗАМЕТКИ =====
function deleteNote(index) {
  const notes = loadNotes();
  notes.splice(index, 1);
  saveNotes(notes);
  renderNotes();
}

// ===== ОБНОВЛЕНИЕ СТАТУСА ОНЛАЙН/ОФФЛАЙН =====
function updateOnlineStatus() {
  if (navigator.onLine) {
    statusEl.classList.remove('offline');
    statusEl.querySelector('.status__text').textContent = 'Онлайн';
  } else {
    statusEl.classList.add('offline');
    statusEl.querySelector('.status__text').textContent = 'Офлайн';
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  noteForm = document.getElementById('noteForm');
  noteInput = document.getElementById('noteInput');
  notesList = document.getElementById('notesList');
  emptyState = document.getElementById('emptyState');
  statusEl = document.getElementById('status');

  renderNotes();
  updateOnlineStatus();

  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = noteInput.value.trim();
    if (text) {
      addNote(text);
      noteInput.value = '';
      noteInput.focus();
    }
  });

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});
