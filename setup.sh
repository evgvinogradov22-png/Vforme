#!/bin/bash
# Запускать ОДИН РАЗ на чистом сервере
# ssh root@185.182.65.224 "bash <(curl -s https://raw.githubusercontent.com/evgvinogradov22-png/Vforme/main/setup.sh)"

set -e

echo "⚙️  Настройка сервера V Форме..."

# клонируем репо
mkdir -p /var/www/vforme
cd /var/www
git clone https://github.com/evgvinogradov22-png/Vforme.git vforme || (cd vforme && git pull)

# .env
cd /var/www/vforme/backend
if [ ! -f .env ]; then
  cp .env.example .env
  # генерируем случайные секреты
  JWT=$(openssl rand -hex 32)
  ADMIN=$(openssl rand -hex 32)
  sed -i "s/change_this_to_random_string_min_32_chars/$JWT/" .env
  sed -i "0,/change_this_to_random_string_min_32_chars/! s/change_this_to_random_string_min_32_chars/$ADMIN/" .env
  echo "✅ .env создан с случайными секретами"
fi

# устанавливаем зависимости
npm install --production

# создаём суперадмина
node src/seed.js

# запускаем
pm2 start src/app.js --name vforme-api
pm2 save
pm2 startup

echo ""
echo "✅ Сервер настроен!"
echo "📋 Проверь: curl https://app.nutrikris.ru/api/health"
