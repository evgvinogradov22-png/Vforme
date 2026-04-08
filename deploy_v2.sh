#!/bin/bash

APP_DIR="/var/www/vforme"
BACKUP_DIR="/var/www/vforme_backups"
LOG_FILE="/var/log/vforme_deploy.log"
MAX_BACKUPS=10

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()   { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; }

mkdir -p "$BACKUP_DIR"

# ОТКАТ
if [ "$1" = "rollback" ]; then
  VERSIONS=($(ls -t "$BACKUP_DIR"))
  if [ ${#VERSIONS[@]} -eq 0 ]; then
    error "Нет доступных версий для отката"
    exit 1
  fi
  
  # Если передан номер версии — откатываемся к ней
  if [ -n "$2" ]; then
    TARGET="${VERSIONS[$2-1]}"
  else
    TARGET="${VERSIONS[0]}"
  fi
  
  log "Откат к версии: $TARGET"
  cp -r "$BACKUP_DIR/$TARGET/backend_src/." "$APP_DIR/backend/src/"
  [ -d "$BACKUP_DIR/$TARGET/frontend_dist" ] && cp -r "$BACKUP_DIR/$TARGET/frontend_dist/." "$APP_DIR/frontend/dist/"
  [ -d "$BACKUP_DIR/$TARGET/admin_dist" ] && cp -r "$BACKUP_DIR/$TARGET/admin_dist/." "$APP_DIR/admin/dist/"
  pm2 restart vforme-api --update-env
  log "Откат выполнен успешно"
  exit 0
fi

# СПИСОК ВЕРСИЙ
if [ "$1" = "list" ]; then
  echo "Доступные версии:"
  ls -t "$BACKUP_DIR" | nl
  exit 0
fi

# ДЕПЛОЙ
VERSION=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$VERSION"
log "=== Деплой $VERSION ==="

# Бэкап
mkdir -p "$BACKUP_PATH"
cp -r "$APP_DIR/backend/src" "$BACKUP_PATH/backend_src"
cp -r "$APP_DIR/frontend/dist" "$BACKUP_PATH/frontend_dist" 2>/dev/null
cp -r "$APP_DIR/admin/dist" "$BACKUP_PATH/admin_dist" 2>/dev/null
log "Бэкап создан"

# Проверка синтаксиса
node --check "$APP_DIR/backend/src/app.js" 2>&1
if [ $? -ne 0 ]; then
  error "Синтаксическая ошибка! Деплой отменён."
  exit 1
fi

# Зависимости
cd "$APP_DIR/backend" && npm install --production 2>&1 | tail -3

# Билд фронта
log "Сборка frontend..."
cd "$APP_DIR/frontend" && npm run build 2>&1 | tail -3
if [ $? -ne 0 ]; then error "Ошибка frontend!"; exit 1; fi

# Билд админки
log "Сборка admin..."
cd "$APP_DIR/admin" && npm run build 2>&1 | tail -3
if [ $? -ne 0 ]; then error "Ошибка admin!"; exit 1; fi

# Перезапуск
log "Перезапуск API..."
pm2 restart vforme-api --update-env
sleep 3

# Проверка
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$HEALTH" != "200" ]; then
  error "API не отвечает! Автооткат..."
  cp -r "$BACKUP_PATH/backend_src/." "$APP_DIR/backend/src/"
  pm2 restart vforme-api --update-env
  exit 1
fi

# Удаляем старые бэкапы
ls -t "$BACKUP_DIR" | tail -n +$((MAX_BACKUPS + 1)) | xargs -I{} rm -rf "$BACKUP_DIR/{}"

log "=== Деплой успешен: $VERSION ==="
bash /var/www/deploy.sh list
