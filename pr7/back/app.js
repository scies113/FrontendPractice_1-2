const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;
const SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode}`);
  });
  next();
});

//SWAGGER
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Магазина с Авторизацией",
      version: "1.0.0",
      description: "Документация к API товаров и аутентификации (Практика 7)",
    },
    servers: [{ url: `http://localhost:${port}`, description: "Локальный сервер" }],
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let users = [];
let products = [
  { id: nanoid(6), title: "iPhone 17", category: "Электроника", description: "Новый смартфон", price: 90000 },
  { id: nanoid(6), title: "MacBook Air", category: "Ноутбуки", description: "Легкий ноутбук", price: 170000 },
  { id: nanoid(6), title: "AirPods Pro", category: "Аксессуары", description: "Наушники", price: 20000 },
];

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

//СХЕМЫ SWAGGER
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID пользователя
 *         email:
 *           type: string
 *           format: email
 *           description: Email (используется как логин)
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         password:
 *           type: string
 *           description: Хешированный пароль (никогда не возвращается клиенту)
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 */

//МАРШРУТЫ АВТОРИЗАЦИИ

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации или пользователь уже существует
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "Пользователь с таким email уже существует" });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const newUser = {
      id: nanoid(8),
      email,
      first_name,
      last_name,
      password: hashedPassword,
    };

    users.push(newUser);
    
    //возвращаем данные без пароля
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера при регистрации" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Неверный email или пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email и пароль обязательны" });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  const isMatch = await verifyPassword(password, user.password);
  
  if (!isMatch) {
    return res.status(401).json({ error: "Неверный пароль" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ message: "Вход выполнен успешно", user: userWithoutPassword });
});

//МАРШРУТЫ ТОВАРОВ

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Товар создан
 */
app.post("/api/products", (req, res) => {
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
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Товар не найден" });
  res.json(product);
});

app.put("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Товар не найден" });
  
  const { title, price, category, description } = req.body;
  if (title) product.title = title;
  if (price !== undefined) product.price = Number(price);
  if (category) product.category = category;
  if (description) product.description = description;
  
  res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);
  if (products.length === initialLength) return res.status(404).json({ error: "Товар не найден" });
  res.status(204).send();
});

//запуск
app.listen(port, () => {
  console.log(`Сервер: http://localhost:${port}`);
  console.log(`Swagger Docs: http://localhost:${port}/api-docs`);
});