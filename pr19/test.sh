#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "--- Тестирование API Пользователей ---"

# 1. Создание
echo "1. Создание пользователя..."
CREATE_RES=$(curl -s -X POST "$BASE_URL/users" \
     -H "Content-Type: application/json" \
     -d '{"first_name": "Тест", "last_name": "Тестович", "age": 30}')
echo "Ответ: $CREATE_RES"
USER_ID=$(echo $CREATE_RES | grep -oP '(?<="id":)\d+')

if [ -z "$USER_ID" ]; then
    echo "Ошибка: Не удалось создать пользователя или получить ID"
    exit 1
fi

# 2. Список
echo -e "\n2. Получение списка пользователей..."
curl -s -X GET "$BASE_URL/users"

# 3. Один пользователь
echo -e "\n3. Получение пользователя по ID ($USER_ID)..."
curl -s -X GET "$BASE_URL/users/$USER_ID"

# 4. Обновление
echo -e "\n4. Обновление возраста пользователя..."
curl -s -X PATCH "$BASE_URL/users/$USER_ID" \
     -H "Content-Type: application/json" \
     -d '{"age": 35}'

# 5. Удаление
echo -e "\n5. Удаление пользователя..."
curl -s -X DELETE "$BASE_URL/users/$USER_ID"

echo -e "\n--- Тестирование завершено ---"
