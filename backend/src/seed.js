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
  await sequelize.sync({ alter: true });
  const exists = await User.findOne({ where: { role: 'superadmin' } });
  if (exists) { console.log('Суперадмин уже существует:', exists.email); process.exit(0); }
  const hash = await bcrypt.hash('Admin123!', 10);
  const user = await User.create({ email: 'admin@nutrikris.ru', password: hash, name: 'Кристина', role: 'superadmin' });
  console.log('✅ Суперадмин создан!');
  console.log('   Email:', user.email);
  console.log('   Пароль: Admin123!');
  console.log('⚠️  ОБЯЗАТЕЛЬНО СМЕНИТЕ ПАРОЛЬ ПОСЛЕ ПЕРВОГО ВХОДА!');
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
