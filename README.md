# V Форме — приложение нутрициолога Кристины Виноградовой

## Стек
- **Backend**: Node.js + Express + PostgreSQL + Sequelize
- **Frontend**: React + Vite
- **Admin**: React + Vite
- **Сервер**: Timeweb VPS, Ubuntu 22.04
- **Домен**: app.nutrikris.ru

## Структура
```
vforme/
├── backend/          # API (порт 3001)
│   └── src/
│       ├── app.js
│       ├── db.js
│       ├── seed.js   # создать суперадмина
│       ├── models/
│       ├── routes/
│       └── middleware/
├── frontend/         # Приложение для пользователей
├── admin/            # Панель управления для Кристины
├── deploy.sh         # Деплой обновлений
└── setup.sh          # Первоначальная настройка сервера
```

## Первый запуск на сервере

```bash
ssh root@185.182.65.224
cd /var/www/vforme
bash setup.sh
```

Суперадмин создаётся автоматически:
- Email: `admin@nutrikris.ru`
- Пароль: `Admin123!`
- **Смени пароль после первого входа!**

## Деплой обновлений

```bash
# локально
git add .
git commit -m "описание изменений"
git push

# на сервере
ssh root@185.182.65.224 "cd /var/www/vforme && bash deploy.sh"
```

## API endpoints

### Auth
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход
- `GET /api/auth/me` — текущий пользователь

### Programs
- `GET /api/programs` — все программы
- `GET /api/programs/:id` — программа с модулями и лекциями

### Recipes
- `GET /api/recipes` — все рецепты
- `GET /api/recipes/:id` — рецепт с комментариями
- `POST /api/recipes` — добавить рецепт (с фото)
- `POST /api/recipes/:id/like` — лайк
- `POST /api/recipes/:id/comment` — комментарий

### Supplements
- `GET /api/supplements` — схемы БАДов

### Tracker
- `GET /api/tracker/habits` — лог привычек
- `POST /api/tracker/habits` — сохранить день
- `GET /api/tracker/tasks` — задачи
- `POST /api/tracker/tasks` — добавить задачу
- `PATCH /api/tracker/tasks/:id` — обновить задачу

### Profile
- `GET /api/profile` — профиль (анкета)
- `POST /api/profile` — сохранить анкету (история сохраняется)
- `GET /api/profile/progress` — прогресс по урокам
- `POST /api/profile/progress` — сохранить прогресс

### Admin (требует роль admin или superadmin)
- CRUD для программ, модулей, лекций, рецептов, схем БАДов
- `/api/admin/users` — управление пользователями (только superadmin)

## Роли
- `user` — обычный пользователь
- `admin` — может управлять контентом
- `superadmin` — полный доступ + управление пользователями

## Логи
```bash
pm2 logs vforme-api        # логи в реальном времени
pm2 monit                  # дашборд
tail -f /var/log/nginx/error.log
```
