#!/bin/bash
# Запускать на сервере: bash deploy.sh

set -e

echo "🚀 Деплой V Форме..."

cd /var/www/vforme

# тянем обновления
git pull origin main

# бэкенд
cd backend
cp -n .env.example .env 2>/dev/null || true
npm install --production
node src/seed.js 2>/dev/null || true

# фронтенд
cd ../frontend
npm install
npm run build

# админка
cd ../admin
npm install
npm run build

# перезапускаем
pm2 restart vforme-api 2>/dev/null || pm2 start /var/www/vforme/backend/src/app.js --name vforme-api
pm2 save

echo "✅ Деплой завершён!"
echo "🌐 https://app.nutrikris.ru"
