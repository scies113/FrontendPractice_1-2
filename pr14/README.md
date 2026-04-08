# Практическая работа №14: Web App Manifest

## Описание
Настройка Web App Manifest — JSON-файла с метаданными о веб-приложении. Манифест позволяет браузерам и ОС понимать, как обрабатывать сайт при добавлении на домашний экран: устанавливать иконку, запускать в полноэкранном режиме, задавать цвета темы и ориентацию экрана.

## Что реализовано
- **manifest.json** — поля: `name`, `short_name`, `start_url`, `display`, `background_color`, `theme_color`, `description`, `orientation`, `icons` (7 иконок разных размеров)
- **Иконки** — набор PNG от 16×16 до 512×512 в папке `public/icons/`
- **Подключение манифеста** — `<link rel="manifest">` в `<head>`
- **Мета-теги для мобильных платформ** — `mobile-web-app-capable`, `theme-color`, `apple-touch-icon`, `apple-mobile-web-app-status-bar-style`
- **Service Worker** — обновлён для кэширования иконок и манифеста
- **Приложение «Заметки»** — добавление, удаление, сохранение в LocalStorage, индикатор онлайн/офлайн

## Технологии
- HTML5 + CSS3 (SCSS/SASS)
- JavaScript (ES6+)
- Web App Manifest
- Service Worker API + Cache API
- LocalStorage API
- PWA (Progressive Web App)
- npm (скрипты сборки)

## Запуск
1. Переходим в папку проекта:
   ```
   cd pr14
   ```
2. Устанавливаем зависимости:
   ```
   npm install
   ```
3. Запускаем локальный сервер:
   ```
   npm run dev
   ```
4. Открываем браузер по адресу `http://127.0.0.1:8080/`