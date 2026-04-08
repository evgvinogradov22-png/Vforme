require('dotenv').config();
const bcrypt = require('bcryptjs');
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
const User = require('./models/User');

async function seed() {
  // Берём данные из .env — никаких захардкоженных паролей
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Кристина';

  if (!email || !password) {
    console.error('❌ Укажи ADMIN_EMAIL и ADMIN_PASSWORD в .env');
    process.exit(1);
  }

  await sequelize.sync();
  const exists = await User.findOne({ where: { role: 'superadmin' } });
  if (exists) { console.log('Суперадмин уже существует:', exists.email); process.exit(0); }

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password: hash, name, role: 'superadmin', emailVerified: true });
  console.log('✅ Суперадмин создан:', user.email);
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
