const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

//VAPID ключи (те же, что в pr16)
const vapidKeys = {
  publicKey: 'BLhxkSLa215lTBmUUvx_TtTmeQh02GQ2LjiJkfhLyYliMp0MtPTxi8Mc7v9PFZJJCSEJr2E68TVRUMNurPCMZDM',
  privateKey: '4t3Y5ZVFKIGGtZjt2Ra5A1vFj3BoKCmWV7GFAVVYe9I'
};

webpush.setVapidDetails('mailto:student@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let subscriptions = [];

//хранилище запланированных напоминаний
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

io.on('connection', (socket) => {
  console.log('Клиент подключён:', socket.id);

  //обычная задача (без напоминания)
  socket.on('newTask', (task) => {
    console.log('Новая задача:', task.text);
    socket.broadcast.emit('taskAdded', task);

    const payload = JSON.stringify({ title: 'Новая задача', body: task.text });
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
  });

  //задача с напоминанием
  socket.on('newReminder', (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();

    if (delay <= 0) {
      console.log('Время напоминания уже прошло:', text);
      return;
    }

    console.log(`Напоминание запланировано: "${text}" через ${Math.round(delay / 1000)}с`);

    const timeoutId = setTimeout(() => {
      console.log('Сработало напоминание:', text);
      const payload = JSON.stringify({
        title: '!!! Напоминание',
        body: text,
        reminderId: id
      });

      //отправляем через Socket.IO (работает всегда)
      io.emit('reminderAdded', { text, reminderId: id });

      //отправляем через Web Push (если есть подписки)
      subscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
      });
      reminders.delete(id);
    }, delay);

    reminders.set(id, { timeoutId, text, reminderTime });
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключён:', socket.id);
  });
});

//подписка на push
app.post('/subscribe', (req, res) => {
  subscriptions.push(req.body);
  console.log('Подписка сохранена. Всего:', subscriptions.length);
  res.status(201).json({ message: 'Подписка сохранена' });
});

//отписка от push
app.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
  console.log('Подписка удалена. Осталось:', subscriptions.length);
  res.status(200).json({ message: 'Подписка удалена' });
});

//отложить напоминание на 5 минут
app.post('/snooze', (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const newDelay = 60 * 1000; //1 минута
  console.log(`Напоминание "${reminder.text}" отложено на 1 минуту`);

  const newTimeoutId = setTimeout(() => {
    console.log('Отложенное напоминание сработало:', reminder.text);
    const payload = JSON.stringify({
      title: 'Напоминание отложено',
      body: reminder.text,
      reminderId: reminderId
    });

    //отправляем через Socket.IO (работает всегда)
    io.emit('reminderAdded', { text: reminder.text, reminderId, snoozed: true });

    //отправляем через Web Push (если есть подписки)
    subscriptions.forEach(sub => {
      webpush.sendNotification(sub, payload).catch(err => console.error('Push error:', err));
    });
    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay
  });

  res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

//статус напоминаний
app.get('/reminders', (req, res) => {
  const list = [];
  reminders.forEach((val, key) => {
    list.push({
      id: key,
      text: val.text,
      reminderTime: val.reminderTime
    });
  });
  res.json(list);
});

const PORT = 3002;
server.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
