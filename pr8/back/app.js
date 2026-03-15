const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); //jwt
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;
const SALT_ROUNDS = 10;

const JWT_SECRET = "super_secret_key_for_practice_8"; 
const TOKEN_EXPIRES_IN = "30s"; //ВРЕМЯ ЖИЗНИ ТОКЕНА!!

app.use(cors());
app.use(express.json());

let users = []; 
let products = [
  { id: nanoid(6), title: "iPhone 17", category: "Электроника", description: "Новый смартфон", price: 90000 },
  { id: nanoid(6), title: "MacBook Air", category: "Ноутбуки", description: "Легкий ноутбук", price: 170000 },
];

//НАСТРОЙКА SWAGGER
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Магазина с JWT Авторизацией",
      version: "1.0.0",
      description: "Документация к API с защитой маршрутов через JWT (Практика 8)",
    },
    servers: [{ url: `http://localhost:${port}`, description: "Локальный сервер" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется токен доступа (Authorization: Bearer <token>)" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; //добавляем данные пользователя в запрос (id, email)
    next();
  } catch (err) {
    return res.status(401).json({ error: "Неверный или истекший токен" });
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
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         title: { type: string }
 *         price: { type: number }
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
 *       201:
 *         description: Пользователь создан
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "Пользователь уже существует" });
  }

  const hashedPassword = await hashPassword(password);
  const newUser = {
    id: nanoid(8),
    email,
    first_name,
    last_name,
    password: hashedPassword,
  };

  users.push(newUser);
  const { password: _, ...userSafe } = newUser;
  res.status(201).json(userSafe);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход и получение JWT токена
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
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Неверные данные
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Неверный пароль" });
  }

  //генерация токена
  const accessToken = jwt.sign(
    { id: user.id, email: user.email }, //Payload
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

  const { password: _, ...userSafe } = user;
  res.json({ message: "Вход выполнен", accessToken, user: userSafe });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       401:
 *         description: Токен не предоставлен
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }
  const { password: _, ...userSafe } = user;
  res.json(userSafe);
});

//МАРШРУТЫ ТОВАРОВ

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров (Открытый)
 *     tags: [Products]
 *     security: [] <!-- Отключаем безопасность для этого метода -->
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (Защищено)
 *     security:
 *       - bearerAuth: []
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price]
 *             properties:
 *               title: { type: string }
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Товар создан
 *       401:
 *         description: Требуется авторизация
 */
app.post("/api/products", authMiddleware, (req, res) => {
  //доступно только для авторизованных
  const { title, price, category, description } = req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ error: "Название и цена обязательны" });
  }
  
  const newProduct = {
    id: nanoid(6),
    title,
    price: Number(price),
    category: category || "Общее",
    description: description || "",
    createdBy: req.user.email //запоминаем создателя
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);
  if (products.length === initialLength) return res.status(404).json({ error: "Товар не найден" });
  res.status(204).send();
});

//запуск
app.listen(port, () => {
  console.log(`Сервер: http://localhost:${port}`);
  console.log(`Swagger Docs: http://localhost:${port}/api-docs`);
  console.log(`JWT Secret: ${JWT_SECRET}`);
});