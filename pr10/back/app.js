const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;
const SALT_ROUNDS = 10;

//КОНФИГУРАЦИЯ ТОКЕНОВ
const ACCESS_SECRET = "access_secret_key_pr9";
const REFRESH_SECRET = "refresh_secret_key_pr9"; //отдельный секрет для refresh

// ВРЕМЯ ЖИЗНИ ТОКЕНОВ!!!: Access - короткий (для теста 60 секунд), Refresh - длинный (для теста 150 секунд)
const ACCESS_EXPIRES_IN = "1m"; 
const REFRESH_EXPIRES_IN = "30m";

app.use(cors());
app.use(express.json());

//ДАННЫЕ (В памяти)
let users = []; 
//хранилище выданных Refresh-токенов
const issuedRefreshTokens = new Set(); 

let products = [
  { id: nanoid(6), title: "iPhone 17", category: "Электроника", price: 90000 },
  { id: nanoid(6), title: "MacBook Air", category: "Ноутбуки", price: 170000 },
];

//НАСТРОЙКА SWAGGER
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API с Refresh Токенами",
      version: "1.0.0",
      description: "Реализация ротации токенов (Практика 9)",
    },
    servers: [{ url: `http://localhost:${port}`, description: "Локальный сервер" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

//генерация Access токена
function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

//генерация Refresh токена
function generateRefreshToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

//Middleware для проверки Access токена
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется токен доступа" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Неверный или истекший Access токен" });
  }
}

//СХЕМЫ SWAGGER
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         email: { type: string }
 *         first_name: { type: string }
 *         last_name: { type: string }
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken: { type: string }
 *         refreshToken: { type: string }
 *         user: { $ref: '#/components/schemas/User' }
 */

//МАРШРУТЫ АВТОРИЗАЦИИ

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email: { type: string, example: "user@test.com" }
 *               first_name: { type: string, example: "Иван" }
 *               last_name: { type: string, example: "Иванов" }
 *               password: { type: string, example: "12345" }
 *     responses:
 *       201: { description: Пользователь создан }
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
  if (users.find((u) => u.email === email)) return res.status(400).json({ error: "Пользователь существует" });

  const newUser = {
    id: nanoid(8),
    email, first_name, last_name,
    password: await hashPassword(password),
  };
  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход и получение пары токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "user@test.com" }
 *               password: { type: string, example: "12345" }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  
  if (!user || !(await verifyPassword(password, user.password))) {
    return res.status(401).json({ error: "Неверные данные" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  //сохраняем refresh токен в хранилище сервера
  issuedRefreshTokens.add(refreshToken);

  const { password: _, ...safeUser } = user;
  res.json({ accessToken, refreshToken, user: safeUser });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары токенов по Refresh токену
 *     description: Принимает валидный Refresh токен, удаляет его и выдает новую пару.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Неверный или отозванный Refresh токен
 */
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh токен обязателен" });
  }

  //проверяем, есть ли токен в нашем хранилище выданных
  if (!issuedRefreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: "Токен не найден или был использован (отозван)" });
  }

  try {
    //верифицируем подпись и срок действия
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    
    const user = users.find((u) => u.id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    //РОТАЦИЯ: удаляем старый токен из хранилища
    issuedRefreshTokens.delete(refreshToken);

    //генерируем новую пару
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    //сохраняем новый Refresh токен
    issuedRefreshTokens.add(newRefreshToken);

    const { password: _, ...safeUser } = user;
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, user: safeUser });

  } catch (err) {
    return res.status(401).json({ error: "Неверный или истекший Refresh токен" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Данные текущего пользователя (Защищено Access токеном)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Auth]
 *     responses:
 *       200: { description: Данные пользователя }
 *       401: { description: Ошибка токена }
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

//простой тестовый маршрут товаров
app.get("/api/products", (req, res) => res.json(products));

app.listen(port, () => {
  console.log(`Сервер: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
  console.log(`Access токен живет: ${ACCESS_EXPIRES_IN}`);
});