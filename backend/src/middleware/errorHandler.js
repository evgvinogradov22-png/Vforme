// Кастомный класс для бизнес-ошибок
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.isAppError = true;
  }
}

// Централизованный error handler — подключается последним в app.js
function errorHandler(err, req, res, next) {
  // Бизнес-ошибка (валидация, доступ и т.д.)
  if (err.isAppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Sequelize ошибки
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ error: 'Запись уже существует' });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: 'Связанная запись не найдена' });
  }

  // JWT ошибки
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Токен недействителен' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Токен истёк' });
  }

  // CORS ошибка
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS: запрос запрещён' });
  }

  // Системная ошибка — логируем и скрываем детали от клиента
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}

module.exports = { AppError, errorHandler };
