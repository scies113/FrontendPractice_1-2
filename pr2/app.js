const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//данные в памяти по умолч.
let products = [
  { id: 1, name: "iPhone 17", price: 90000 },
  { id: 2, name: "MacBook Air", price: 170000 },
  { id: 3, name: "AirPods Pro", price: 20000 },
];

//вернуть все товары
app.get("/products", function (req, res) {
  res.json(products);
});

//вернуть по id товар
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

// добавить товар
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

//ред. товар
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

//удалить товар
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
  console.log("сервер http://localhost:" + port);
});