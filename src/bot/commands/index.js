import {
  authCommand,
  changeTokenCallback,
  handleNewToken,
} from "./authCommand.js";
import { setUserKeyboard } from "../../utils/keyboard.js";
import { tokenHandler } from "../middlewares/authMiddleware.js";
import { helpCommand, addCommandDescription } from "./helpCommand.js";
import {
  projectsCommand,
  handleInlineQuery,
  showRepositoryPage,
  showProjectPage,
  showPaginatedTasks,
  showTasksPage,
} from "./projectsCommand.js";
import { showTaskComments } from "./commentsCommand.js";

export async function registerCommands(
  bot,
  chatTokens,
  authState = new Map(),
  userStates = new Map()
) {
  bot.command("help", helpCommand);
  // Команда /auth
  bot.command("auth", async (ctx) => {
    const userState = userStates.get(ctx.chat.id) || "free";

    if (userState === "busy") {
      return ctx.reply(
        "Вы находитесь в процессе выполнения задачи. Завершите текущую задачу, чтобы использовать команды."
      );
    }

    await authCommand(ctx, chatTokens, authState); // Вызываем логику авторизации
    userStates.set(ctx.chat.id, "free"); // Устанавливаем состояние пользователя как свободное
    await setUserKeyboard(ctx, "free");
  });
  bot.command("project", projectsCommand);

  bot.command("amogus", async (ctx) => {
    const gifUrl =
      "https://media1.tenor.com/m/gQV5VzHLWQIAAAAd/among-us-sus.gif"; // URL вашей гифки

    try {
      await ctx.replyWithAnimation(gifUrl); // Отправляем гифку как анимацию
    } catch (error) {
      console.error("Ошибка отправки гифки:", error);
      await ctx.reply("Не удалось отправить гифку. Попробуйте позже.");
    }
  });

  // Обработчик inline-запросов
  bot.on("callback_query:data", async (ctx) => {
    const action = ctx.callbackQuery.data;
    console.log("Нажата кнопка:", action); // Логируем полученное действие

    if (action.startsWith("repo_")) {
      console.log("Нажата кнопка репозитория:", action);
      await handleInlineQuery(ctx); // Обрабатываем запрос для репозитория
    } else if (action.startsWith("page_")) {
      const page = parseInt(action.split("_")[1], 10);
      console.log("Переход на страницу:", page); // Проверяем, какая страница запрошена
      await showRepositoryPage(ctx, page);
    } else if (action.startsWith("project_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      return await showProjectPage(ctx, page);
    } else if (action.startsWith("project_")) {
      console.log("Нажата кнопка проекта:", action);
      await handleInlineQuery(ctx); // Обрабатываем запрос для проекта
    } else if (action.startsWith("task_")) {
      console.log("Нажата кнопка задачи:", action);
      await handleInlineQuery(ctx); // Обрабатываем запрос для задачи
    } else if (action.startsWith("show_comments_")) {
      console.log("Нажата кнопка комментариев:", action);
      await showTaskComments(ctx); // Вызов функции для комментариев
    } else if (action.startsWith("deadline_")) {
      console.log("Нажато поле дедлайна:", action);
      await handleInlineQuery(ctx); // Обрабатываем запрос для выбора поля дедлайна
    } else if (action.startsWith("tasks_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      const sortedTasks = ctx.session.sortedTasks || [];
      const deadlineField = ctx.session.deadlineField;
      if (!sortedTasks.length) {
        return ctx.reply("Задачи отсутствуют.");
      }
      await showTasksPage(ctx, sortedTasks, page, deadlineField);
    } else if (action.startsWith("skip_")) {
      console.log("Нажата кнопка пропустить:", action);
      await handleInlineQuery(ctx);
    } else if (action.startsWith("taskss_page")) {
      const actionParts = action.split("_");
      const projectId = `${actionParts[1]}_${actionParts[2]}`;
      const page = parseInt(actionParts[2]);
      const task = ctx.session.assignedTasks;
      console.log(page);

      // Сохраняем текущий проект в сессии
      ctx.session.projectId = projectId;

      // Вызываем обработчик из `projectsCommand.js`
      await showPaginatedTasks(ctx, task, page);
    } else if (action === "change_token") {
      await changeTokenCallback(ctx); // Обработка изменения токена
    }

    await ctx.answerCallbackQuery(); // Убираем индикатор загрузки
  });

  // Дополняем список доступных команд
  addCommandDescription(
    "/auth",
    "Авторизация через токен. Используйте эту команду, чтобы начать процесс авторизации."
  );
  addCommandDescription(
    "/help",
    "Вывод списка доступных команд и их описания."
  );
  // Обработка текстовых сообщений (например, токена)
  // Обработка текстовых сообщений
  bot.on("message:text", async (ctx) => {
    const userState = userStates.get(ctx.chat.id) || "free";
    const text = ctx.message.text.trim();
    const chatId = ctx.chat.id;
    const isAuthorized = chatTokens.has(chatId); // Проверка на авторизацию

    // Если пользователь в процессе выполнения задачи, возвращаем сообщение
    if (userState === "busy") {
      return ctx.reply("Вы находитесь в процессе выполнения задачи.");
    }

    // Проверка на состояние "ожидание токена"
    if (ctx.session.awaitingToken) {
      // Если ожидается ввод токена, обрабатываем его
      await handleNewToken(ctx, chatTokens, authState);
      return; // После обработки токена выходим из функции
    }

    // Обрабатываем текст, если пользователь авторизован
    if (isAuthorized) {
      // Обрабатываем команды
      if (text === "Помощь") {
        await helpCommand(ctx); // Обработка команды помощи
      } else if (text === "Проекты") {
        await projectsCommand(ctx); // Обработка команды проектов
      } else if (text === "Авторизация") {
        await ctx.reply("Вы уже авторизованы.");
      } else {
        // Если команда не распознана
        await ctx.reply("Я не понимаю такую команду. Попробуйте ещё раз.");
      }
    } else {
      // Если пользователь не авторизован
      if (text === "Авторизация") {
        await authCommand(ctx, chatTokens, authState); // Запускаем процесс авторизации
      } else if (text === "Помощь") {
        await helpCommand(ctx); // Обработка команды помощи
      } else if (text === "Проекты") {
        await projectsCommand(ctx); // Обработка команды проектов
      } else {
        // Если команду не распознали, отправляем сообщение о необходимости авторизации
        await ctx.reply(
          "Вы не авторизованы. Для начала используйте команду /auth."
        );
      }
    }
  });

  // Хранилище стикеров
  const stickerMemory = new Map();

  // Обработка стикеров
  bot.on("message", async (ctx) => {
    // Проверяем, если сообщение содержит стикер
    if (ctx.message.sticker) {
      const chatId = ctx.chat.id;
      const stickerId = ctx.message.sticker.file_id;

      // Если чат ещё не был добавлен, создаём для него новый список стикеров
      if (!stickerMemory.has(chatId)) {
        stickerMemory.set(chatId, []);
      }

      // Добавляем стикер в память
      stickerMemory.get(chatId).push(stickerId);

      // Отправляем случайный стикер
      const stickers = stickerMemory.get(chatId);
      const randomSticker =
        stickers[Math.floor(Math.random() * stickers.length)];

      // Отправляем случайный стикер из памяти
      await ctx.replyWithSticker(randomSticker);
    }
  });

  // Также, можно добавить команду для очистки памяти стикеров, если нужно
  bot.command("clear_stickers", (ctx) => {
    const chatId = ctx.chat.id;
    stickerMemory.delete(chatId);
    ctx.reply("Память стикеров была очищена.");
  });

  // Инициализация состояния пользователя
  bot.on("message", async (ctx) => {
    if (!userStates.has(ctx.chat.id)) {
      userStates.set(ctx.chat.id, "free"); // Устанавливаем начальное состояние как "свободен"
      await setUserKeyboard(ctx, "free");
    }
  });
}
