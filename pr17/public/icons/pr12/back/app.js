const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const jwt = require("jsonwebtoken");
const {
  authMiddleware,
  addToBlacklist,
  generateAccessToken,
  generateRefreshToken,
  REFRESH_SECRET,
} = require("./middleware/auth");
const { roleMiddleware } = require("./middleware/rbac");

const app = express();
const port = 3000;
const SALT_ROUNDS = 10;

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode}`);
  });
  next();
});

let users = [
  {
    id: "admin-001",
    email: "admin@test.ru",
    first_name: "Админ",
    last_name: "Админов",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS),
    role: "admin",
  },
  {
    id: "mod-001",
    email: "mod@test.ru",
    first_name: "Модератор",
    last_name: "Модераторов",
    password: bcrypt.hashSync("mod123", SALT_ROUNDS),
    role: "moderator",
  },
  {
    id: "user-001",
    email: "user@test.ru",
    first_name: "Пользователь",
    last_name: "Пользователей",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user",
  },
];

let products = [
  { id: nanoid(6), title: "iPhone 17", category: "Электроника", price: 90000 },
  { id: nanoid(6), title: "MacBook Air", category: "Ноутбуки", price: 170000 },
  { id: nanoid(6), title: "AirPods Pro", category: "Наушники", price: 20000 },
];

//SWAGGER
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Магазина с RBAC и JWT",
      version: "1.0.0",
      description: "Практики 10-11: Токены, Роли и Blacklist",
    },
    servers: [{ url: `http://localhost:${port}` }],
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
 *               email: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [user, admin, moderator], default: user }
 *     responses:
 *       201: { description: Пользователь создан }
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "Пользователь уже существует" });
  }

  const newUser = {
    id: nanoid(8),
    email,
    first_name,
    last_name,
    password: await bcrypt.hash(password, SALT_ROUNDS),
    role: role || "user",
  };

  users.push(newUser);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход и получение токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *                 user: { type: object }
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ error: "Неверный пароль" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const { password: _, ...safeUser } = user;

  res.json({
    message: "Вход выполнен успешно",
    accessToken,
    refreshToken,
    user: safeUser,
  });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов
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
 *       200: { description: Новая пара токенов }
 *       401: { description: Неверный токен }
 */
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: "Неверный refresh токен" });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Выход (добавление токена в blacklist)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Auth]
 *     responses:
 *       200: { description: Токен отозван }
 */
app.post("/api/auth/logout", authMiddleware, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  addToBlacklist(token);
  res.json({ message: "Выход выполнен" });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Данные текущего пользователя
 *     security: [{ bearerAuth: [] }]
 *     tags: [Auth]
 *     responses:
 *       200: { description: Данные пользователя }
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров (Открыто)
 *     tags: [Products]
 *     security: []
 *     responses:
 *       200: { description: Список товаров }
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (Только admin/moderator)
 *     security: [{ bearerAuth: [] }]
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
 *               category: { type: string }
 *     responses:
 *       201: { description: Товар создан }
 *       403: { description: Недостаточно прав }
 */
app.post("/api/products", authMiddleware, roleMiddleware("admin", "moderator"), (req, res) => {
  const { title, price, category } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ error: "Название и цена обязательны" });
  }

  const newProduct = {
    id: nanoid(6),
    title,
    price: Number(price),
    category: category || "Общее",
    createdBy: req.user.email,
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (Только admin)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Товар удален }
 *       403: { description: Недостаточно прав }
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware("admin"), (req, res) => {
  const initialLength = products.length;
  products = products.filter((p) => p.id !== req.params.id);

  if (products.length === initialLength) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  res.status(204).send();
});

//запуск
app.listen(port, () => {
  console.log(`Сервер: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
  console.log(`\nТестовые пользователи:`);
  console.log(`   Admin:    admin@test.ru  /  admin123`);
  console.log(`   Moderator: mod@test.ru   /  mod123`);
  console.log(`   User:     user@test.ru   /  user123\n`);
});