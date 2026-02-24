const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json());

//товары в памяти
let products = [
  { id: 1, name: "iPhone 17", price: 90000, category: "Электроника", description: "Новый смартфон", stock: 10 },
  { id: 2, name: "MacBook Air", price: 170000, category: "Ноутбуки", description: "Легкий ноутбук", stock: 5 },
  { id: 3, name: "AirPods Pro", price: 20000, category: "Аксессуары", description: "Наушники", stock: 20 },
];

app.get("/products", (req, res) => {
  res.json(products);
});

app.get("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find((p) => p.id === id);
  if (!product) return res.status(404).json({ error: "Товар не найден" });
  res.json(product);
});

//добавить товар
app.post("/products", (req, res) => {
  const { name, price, category, description, stock } = req.body;
  
  //простая валидация
  if (!name || !price) {
    return res.status(400).json({ error: "Название и цена обязательны" });
  }

  const newProduct = {
    id: Date.now(),
    name: name.trim(),
    price: Number(price),
    category: category || "Общее",
    description: description || "",
    stock: Number(stock) || 0
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

//PATCH
app.patch("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find((p) => p.id === id);
  
  if (!product) return res.status(404).json({ error: "Товар не найден" });

  const { name, price, category, description, stock } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (price !== undefined) product.price = Number(price);
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

//удалить товар
app.delete("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = products.length;
  products = products.filter((p) => p.id !== id);
  
  if (products.length === initialLength) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  
  res.json({ message: "Товар удалён" });
});

app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
});