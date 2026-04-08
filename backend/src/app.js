require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const sequelize = require('./db');
const { initWebSocket } = require('./ws');

require('./models/User');
require('./models/Program');
require('./models/Module');
require('./models/Lecture');
require('./models/Recipe');
require('./models/Comment');
require('./models/Supplement');
require('./models/SupplementScheme');
require('./models/UserProgress');
require('./models/UserProfile');
require('./models/HabitLog');
require('./models/Task');
require('./models/Points');
require('./models/Promo');
require('./models/Order');
require('./models/EmailToken');
require('./models/EmailLog');
require('./models/Protocol');
require('./models/ProtocolAccess');
require('./models/ChatSettings');
require('./models/ChatMessage');
require('./models/UserEvent');

const app = express();
const ALLOWED_ORIGINS = [
  'https://app.nutrikris.ru',
  'https://test.nutrikris.ru',
  process.env.NODE_ENV !== 'production' && 'http://localhost:5173',
  process.env.NODE_ENV !== 'production' && 'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error('CORS: origin не разрешён'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/programs',    require('./routes/programs'));
app.use('/api/recipes',     require('./routes/recipes'));
app.use('/api/supplements', require('./routes/supplements'));
app.use('/api/tracker',     require('./routes/tracker'));
app.use('/api/profile',     require('./routes/profile'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/points',      require('./routes/points'));
app.use('/api/payment',     require('./routes/payment'));
app.use('/api/promo',       require('./routes/promo'));
app.use('/api/stats',       require('./routes/stats'));
app.use('/api/protocols',   require('./routes/protocols'));
app.use('/api/upload',      require('./routes/upload'));
app.use('/api/telegram',    require('./routes/telegram'));
app.use('/api/broadcast',   require('./routes/broadcast'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/events',      require('./routes/events'));
app.use('/api/admin/deploy', require('./routes/deploy'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Централизованный error handler — ДОЛЖЕН быть последним
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ База данных подключена');
    const PORT = process.env.PORT || 3001;
    const server = http.createServer(app);
    initWebSocket(server);
    server.listen(PORT, () => console.log('✅ API запущен на порту ' + PORT));
  } catch (e) { console.error('❌ Ошибка:', e); process.exit(1); }
}
start();
