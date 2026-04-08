# Практические работы №10-11: JWT Tokens + RBAC + Blacklist

## Описание
реализация системы аутентификации с JWT токенами (Access + Refresh), 
ролевой моделью доступа (admin, user, moderator) и механизмом отзыва токенов.

## Технологии
- Node.js + Express
- JWT (Access + Refresh токены)
- bcrypt (хеширование паролей)
- Axios Interceptors (автоматическое обновление токенов)
- localStorage (хранение токенов на клиенте)
- Blacklist (отзыв токенов при выходе)
- RBAC middleware (проверка ролей)

## Тестовые пользователи
- **Admin**: admin@test.ru / admin123 (может всё: создавать, удалять товары)
- **Moderator**: mod@test.ru / mod123 (может создавать товары)
- **User**: user@test.ru / user123 (только просмотр)

## Запуск
1. Бэкенд:
   переходим в папку back(cd back)
   npm install(зависимости)
   npm run dev(запуск)

2. Фронтенд:
   переходим в папку client(cd client)
   npm install(зависимости)
   npm run dev(запуск)

3. Открыть http://localhost:5173
