# itroom-telegram

markdown
Копировать код

# Telegram-бот для управления GitHub Project V2

Данный бот позволяет взаимодействовать с задачами, проектами и комментариями в GitHub через Telegram. Он интегрируется с API GraphQL GitHub, предоставляя удобный интерфейс для управления проектами прямо из мессенджера.

## Возможности

- Получение списка задач для GitHub Project V2.
- Просмотр комментариев к задачам и pull requests.
- Список доступных репозиториев и связанных проектов.
- Уведомления о новых комментариях и изменениях статусов задач.
- Управление сессиями пользователей и аутентификация.

## Содержание

- [Установка](#установка)
- [Конфигурация](#конфигурация)
- [Использование](#использование)
- [Структура проекта](#структура-проекта)
- [Описание команд](#описание-команд)
- [Лицензия](#лицензия)

## Установка

### Предварительные требования

1. **Node.js** (>= 18.0.0)
2. **Telegram Bot Token** (через [BotFather](https://core.telegram.org/bots#botfather))
3. **Персональный токен GitHub** с правами `read:project` и `repo`.
4. **Docker** (опционально, для запуска базы данных).

### Инструкция

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/your-repository.git
   Перейдите в папку проекта:
   ```

bash
Копировать код
cd your-repository
Установите зависимости:

bash
Копировать код
npm install
Создайте файл .env в корневой папке и добавьте следующие переменные:

env
Копировать код
BOT*API_KEY=ваш*токен*бота
GITHUB_API_TOKEN=ваш*персональный_токен_github
Запустите бота:

bash
Копировать код
npm start
Конфигурация
Основные переменные окружения
BOT_API_KEY — API токен Telegram бота.
GITHUB_API_TOKEN — персональный токен для взаимодействия с API GitHub.
Использование
Команды бота
/start — приветственное сообщение, начало работы с ботом.
/projects — вывод списка GitHub проектов, связанных с вашим репозиторием.
/comments <id> — получение комментариев для задачи или pull request.
/help — справка по всем доступным командам.
Уведомления
Бот отправляет уведомления о новых комментариях к задачам, изменениях статусов задач, а также других событиях, связанных с проектами.

Структура проекта
bash
Копировать код
📁src
├── 📁bot
│ ├── 📁commands # Команды бота
│ │ ├── authCommand.js # Аутентификация
│ │ ├── commentsCommand.js # Команда для получения комментариев
│ │ ├── helpCommand.js # Команда для помощи
│ │ ├── index.js # Регистрация всех команд
│ │ └── projectsCommand.js # Команда для списка проектов
│ ├── 📁middlewares # Middleware для обработки запросов
│ │ └── authMiddleware.js
│ ├── 📁notifications # Логика уведомлений
│ │ ├── commentNotifications.js
│ │ ├── index.js
│ │ ├── projectCardStatusNotifications.js
│ │ ├── statusAction.js
│ │ └── taskNotifications.js
│ ├── bot.js # Основной файл инициализации бота
│ └── webhook.js # Настройка вебхуков для Telegram
├── 📁config
│ └── database.js # Конфигурация базы данных
├── 📁db
│ └── 📁models
│ ├── index.js # Инициализация моделей
│ └── User.js # Модель пользователя
├── 📁services
│ └── githubService.js # Логика взаимодействия с GitHub API
└── 📁utils
├── config.js # Утилиты для конфигурации
├── keyboard.js # Создание клавиатуры для Telegram
└── session.js # Управление сессиями
Описание команд
Команда Описание
/start Отображает приветственное сообщение.
/projects Выводит список GitHub проектов.
/comments <id> Получает список комментариев для задачи или pull request.
/help Показывает список всех доступных команд.
Лицензия
Этот проект лицензирован под лицензией MIT. Подробности можно найти в файле LICENSE.

yaml
Копировать код

---

### Особенности:

- Добавлены разделы про уведомления и middleware.
- Файл `.env` подчеркнут как обязательный для запуска.
- Указано, где найти основные команды и модули.
