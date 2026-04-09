#!/bin/bash
# Запускать на сервере: bash deploy.sh "описание изменений"
# Описание — опциональный аргумент, берётся также из $1 или последнего commit'а.

DESC="${1:-$(cd /var/www/vforme && git log -1 --pretty=%s 2>/dev/null || echo 'deploy')}"
DESC="${DESC//\'/}"  # защита от одинарных кавычек в SQL

log_to_db() {
  local STATUS="$1"
  local ERR="$2"
  # .env лежит в /var/www/vforme/backend/.env
  # Читаем .env один раз через source в subshell
  local UUID=$(cat /proc/sys/kernel/random/uuid)
  local NOW=$(date -u +"%Y-%m-%d %H:%M:%S")
  local COMMIT=$(cd /var/www/vforme && git rev-parse --short HEAD 2>/dev/null || echo '')
  local FULL_DESC="${DESC} [${COMMIT}]"
  local SAFE_ERR="${ERR//\'/}"
  (
    set -a
    . /var/www/vforme/backend/.env 2>/dev/null
    set +a
    PGPASSWORD="$DB_PASSWORD" psql -h "${DB_HOST:-localhost}" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=0 -c \
      "INSERT INTO \"DeployHistories\" (\"id\",\"env\",\"action\",\"desc\",\"status\",\"errorMsg\",\"userName\",\"userEmail\",\"createdAt\",\"updatedAt\") VALUES ('$UUID','prod','deploy','$FULL_DESC','$STATUS','$SAFE_ERR','Shell','deploy.sh','$NOW','$NOW');" 2>/dev/null
  )
}

set -e
trap 'log_to_db "error" "$BASH_COMMAND failed"' ERR

echo "🚀 Деплой V Форме: $DESC"

cd /var/www/vforme
git pull origin main

cd backend
cp -n .env.example .env 2>/dev/null || true
npm install --production
node src/seed.js 2>/dev/null || true

cd ../frontend
npm install
npm run build

cd ../admin
npm install
npm run build

pm2 restart vforme-api 2>/dev/null || pm2 start /var/www/vforme/backend/src/app.js --name vforme-api
pm2 save

log_to_db "ok" ""

echo "✅ Деплой завершён!"
echo "🌐 https://app.nutrikris.ru"
