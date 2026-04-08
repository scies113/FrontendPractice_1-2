//ИНДИКАТОР СЕТИ (Онлайн/Офлайн)
const statusEl = document.getElementById('status');

function updateOnlineStatus() {
  if (navigator.onLine) {
    statusEl.classList.remove('offline');
    statusEl.querySelector('.status__text').textContent = 'Онлайн';
  } else {
    statusEl.classList.add('offline');
    statusEl.querySelector('.status__text').textContent = 'Офлайн';
  }
}

updateOnlineStatus();

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');

//ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeId).classList.add('active');
}

//ЗАГРУЗКА КОНТЕНТА
async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;
    if (page === 'home') initNotes();
  } catch (err) {
    contentDiv.innerHTML = `<p class="error-text">Ошибка загрузки страницы.</p>`;
    console.error(err);
  }
}

//ОБРАБОТЧИКИ ВКЛАДОК
homeBtn.addEventListener('click', () => { setActiveButton('home-btn'); loadContent('home'); });
aboutBtn.addEventListener('click', () => { setActiveButton('about-btn'); loadContent('about'); });

//ИНИЦИАЛИЗАЦИЯ ЗАМЕТОК
function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const list = document.getElementById('notes-list');
  const emptyState = document.getElementById('empty-state');

  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    list.innerHTML = '';

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
      list.appendChild(li);
    });

    document.querySelectorAll('.note-item__delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.dataset.index;
        deleteNote(idx);
      });
    });
  }

  function addNote(text) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.unshift({ id: Date.now(), text: text.trim(), createdAt: new Date().toISOString() });
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
  }

  function deleteNote(index) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) { addNote(text); input.value = ''; input.focus(); }
  });

  loadNotes();
}

//ЗАГРУЗКА ГЛАВНОЙ СТРАНИЦЫ(home)
loadContent('home');
