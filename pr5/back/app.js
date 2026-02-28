const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

//логи
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode}`);
  });
  next();
});

//swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Магазина Товаров",
      version: "1.0.0",
      description: "Документация к API управления товарами (Практика 5)",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Локальный сервер разработки",
      },
    ],
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

//swagger интерфейс (../api-docs)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//товары
let products = [
  { id: nanoid(6), name: "iPhone 17", price: 90000, category: "Электроника", description: "Новый смартфон", stock: 10 },
  { id: nanoid(6), name: "MacBook Air", price: 170000, category: "Ноутбуки", description: "Легкий ноутбук", stock: 5 },
  { id: nanoid(6), name: "AirPods Pro", price: 20000, category: "Аксессуары", description: "Наушники", stock: 20 },
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID товара
 *           example: "aBc123"
 *         name:
 *           type: string
 *           description: Название товара
 *           example: "iPhone 17"
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *           example: 90000
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: "Электроника"
 *         description:
 *           type: string
 *           description: Краткое описание
 *           example: "Мощный смартфон"
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *           example: 10
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров успешно получен
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
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Уникальный ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации данных
 */
app.post("/api/products", (req, res) => {
  const { name, price, category, description, stock } = req.body;

  if (!name || typeof name !== "string" || !price || typeof price !== "number") {
    return res.status(400).json({ error: "Поля 'name' (строка) и 'price' (число) обязательны" });
  }

  const newProduct = {
    id: nanoid(6), //id-генератор
    name: name.trim(),
    price: Number(price),
    category: category || "Общее",
    description: description || "",
    stock: Number(stock) || 0,
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Частично обновить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Товар обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 *       400:
 *         description: Нет данных для обновления
 */
app.patch("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  const { name, price, category, description, stock } = req.body;

  //есть ли хоть одно поле для обновления(проверка)
  if (!name && price === undefined && !category && !description && stock === undefined) {
    return res.status(400).json({ error: "Нет данных для обновления" });
  }

  if (name) product.name = name.trim();
  if (price !== undefined) product.price = Number(price);
  if (category) product.category = category;
  if (description) product.description = description;
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Товар успешно удален (без тела ответа)
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", (req, res) => {
  const initialLength = products.length;
  products = products.filter((p) => p.id !== req.params.id);

  if (products.length === initialLength) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  //возврат 204 No Content 
  res.status(204).send();
});

//запуск сервера
app.listen(port, () => {
  console.log(`Сервер: http://localhost:${port}`);
  console.log(`Swagger-doc: http://localhost:${port}/api-docs`);
});