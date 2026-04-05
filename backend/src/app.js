const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./db');

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

const app = express();

app.use(cors({
  origin: [
    'https://app.nutrikris.ru',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
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

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ База данных подключена');
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`✅ API запущен на порту ${PORT}`));
  } catch (e) {
    console.error('❌ Ошибка запуска:', e);
    process.exit(1);
  }
}

start();
