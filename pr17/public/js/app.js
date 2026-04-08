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

//VAPID PUBLIC KEY
const VAPID_PUBLIC_KEY = 'BLhxkSLa215lTBmUUvx_TtTmeQh02GQ2LjiJkfhLyYliMp0MtPTxi8Mc7v9PFZJJCSEJr2E68TVRUMNurPCMZDM';

//SOCKET.IO ПОДКЛЮЧЕНИЕ
const socket = io('http://localhost:3002');

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

//WEBSOCKET: ПОЛУЧЕНИЕ СОБЫТИЙ
socket.on('taskAdded', (task) => {
  //всплывающее уведомление
  const notification = document.createElement('div');
  notification.className = 'ws-notification';
  notification.textContent = `📨 Новая задача: ${task.text}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
});

socket.on('reminderAdded', (data) => {
  const prefix = data.snoozed ? '⏰ Отложенное напоминание' : '⏰ Напоминание';
  const notification = document.createElement('div');
  notification.className = 'ws-notification reminder';
  notification.textContent = `${prefix}: ${data.text}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
  alert(`${prefix}: ${data.text}`);
});

//PUSH: КОНВЕРТАЦИЯ КЛЮЧА
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

//PUSH: ПОДПИСКА
async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    await fetch('http://localhost:3002/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('Подписка на push отправлена');
  } catch (err) {
    console.error('Ошибка подписки на push:', err);
  }
}

//PUSH: ОТПИСКА
async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch('http://localhost:3002/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      await subscription.unsubscribe();
      console.log('Отписка выполнена');
    }
  } catch (err) {
    console.error('Ошибка отписки:', err);
  }
}

//PUSH: КНОПКИ
async function initPushButtons() {
  const enableBtn = document.getElementById('enable-push');
  const disableBtn = document.getElementById('disable-push');
  if (!enableBtn || !disableBtn) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    enableBtn.style.display = 'none';
    disableBtn.style.display = 'inline-block';
  }

  enableBtn.addEventListener('click', async () => {
    if (Notification.permission === 'denied') return alert('Уведомления запрещены.');
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return alert('Необходимо разрешить уведомления.');
    }
    await subscribeToPush();
    enableBtn.style.display = 'none';
    disableBtn.style.display = 'inline-block';
  });

  disableBtn.addEventListener('click', async () => {
    await unsubscribeFromPush();
    disableBtn.style.display = 'none';
    enableBtn.style.display = 'inline-block';
  });
}

//ИНИЦИАЛИЗАЦИЯ ЗАМЕТОК
function initNotes() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  const reminderForm = document.getElementById('reminder-form');
  const reminderText = document.getElementById('reminder-text');
  const reminderTime = document.getElementById('reminder-time');
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

      let reminderInfo = '';
      if (note.reminder) {
        const date = new Date(note.reminder);
        reminderInfo = `<br><small class="note-reminder">⏰ Напоминание: ${date.toLocaleString()}</small>`;
      }

      li.innerHTML = `
        <span class="note-item__text">${escapeHtml(note.text)}${reminderInfo}</span>
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

  function addNote(text, reminderTimestamp = null) {
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const newNote = { id: Date.now(), text: text.trim(), reminder: reminderTimestamp };
    notes.unshift(newNote);
    localStorage.setItem('notes', JSON.stringify(notes));
    loadNotes();

    if (reminderTimestamp) {
      socket.emit('newReminder', { id: newNote.id, text: text.trim(), reminderTime: reminderTimestamp });
    } else {
      //отправляем событие через WebSocket
      socket.emit('newTask', { text: text.trim(), timestamp: Date.now() });
    }
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

  //обычная форма
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) { addNote(text); input.value = ''; input.focus(); }
  });

  //форма с напоминанием — срабатывает через 1 минуту после отправки
  reminderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = reminderText.value.trim();

    if (text) {
      // напоминание через 1 минуту
      const reminderTimestamp = Date.now() + 60 * 1000;
      addNote(text, reminderTimestamp);
      reminderText.value = '';
    }
  });

  loadNotes();
}

//ИНИЦИАЛИЗАЦИЯ
loadContent('home');
initPushButtons();
