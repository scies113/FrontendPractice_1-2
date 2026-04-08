//Middleware для проверки роли пользователя
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Роль не определена" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Доступ запрещён. Требуется роль: ${allowedRoles.join(" или ")}` 
      });
    }

    next();
  };
}

module.exports = { roleMiddleware };