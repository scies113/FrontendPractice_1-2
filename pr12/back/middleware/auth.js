const jwt = require("jsonwebtoken");

//Blacklist - хранилище для заблок. токенов
const tokenBlacklist = new Set();

//секретные ключи для подписи токенов
const ACCESS_SECRET = "access_secret_pr10_11";
const REFRESH_SECRET = "refresh_secret_pr10_11";

//время жизни токенов (Access - короткий для теста, Refresh - длинный)
const ACCESS_EXPIRES_IN = "1m";
const REFRESH_EXPIRES_IN = "7d";

//генерация Access токена
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

//генерация Refresh токена
function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

//Middleware для проверки Access токена
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется токен доступа" });
  }

  const token = authHeader.split(" ")[1];

  //проверка blacklist
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: "Токен отозван (blacklisted)" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Неверный или истекший токен" });
  }
}

//добавление токена в blacklist
function addToBlacklist(token) {
  tokenBlacklist.add(token);
}

module.exports = {
  authMiddleware,
  addToBlacklist,
  generateAccessToken,
  generateRefreshToken,
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  tokenBlacklist,
};