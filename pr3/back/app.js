const express = require("express");
const path = require("path");
const cors = require("cors"); // <--- ДОБАВЛЕНО: импорт cors
const app = express();
const port = 3000;

// <--- ДОБАВЛЕНО: использование cors
app.use(cors()); 

app.use(express.json());
// Если будешь класть index.html в папку public внутри backend, раскомментируй строку ниже:
app.use(express.static(path.join(__dirname, "..", "front"))); 

app.get("/", function (req, res) {
  // Если фронтенд лежит отдельно, этот маршрут можно оставить для проверки сервера
    res.sendFile(path.join(__dirname, "..", "front", "index.html"));
});

// Данные в памяти по умолч.
let products = [
  { id: 1, name: "iPhone 17", price: 90000 },
  { id: 2, name: "MacBook Air", price: 170000 },
  { id: 3, name: "AirPods Pro", price: 20000 },
];

// Вернуть все товары
app.get("/products", function (req, res) {
  res.json(products);
});

// Вернуть товар по id
app.get("/products/:id", function (req, res) {
  var id = parseInt(req.params.id);
  var product = products.find(function (p) {
    return p.id === id;
  });
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  res.json(product);
});

// Добавить товар
app.post("/products", function (req, res) {
  var name = req.body.name;
  var price = req.body.price;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Поле 'name' обязательно" });
  }
  if (price === undefined || typeof price !== "number" || price < 0) {
    return res
      .status(400)
      .json({ error: "Поле 'price' обязательно и должно быть >= 0" });
  }
  var newProduct = {
    id: Date.now(),
    name: name.trim(),
    price: price,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Редактировать товар (PATCH)
app.patch("/products/:id", function (req, res) {
  var id = parseInt(req.params.id);
  var product = products.find(function (p) {
    return p.id === id;
  });
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  var name = req.body.name;
  var price = req.body.price;
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Некорректное поле 'name'" });
    }
    product.name = name.trim();
  }
  if (price !== undefined) {
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Некорректное поле 'price'" });
    }
    product.price = price;
  }
  res.json(product);
});

// Удалить товар
app.delete("/products/:id", function (req, res) {
  var id = parseInt(req.params.id);
  var before = products.length;
  products = products.filter(function (p) {
    return p.id !== id;
  });
  if (products.length === before) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  res.json({ message: "Товар удалён" });
});

app.listen(port, function () {
  console.log("Сервер запущен: http://localhost:" + port);
});