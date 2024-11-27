import {
  authCommand,
  changeTokenCallback,
  handleNewToken,
} from "./authCommand.js";
import { setUserKeyboard } from "../../utils/keyboard.js";
import { tokenHandler } from "../middlewares/authMiddleware.js";
import { helpCommand, addCommandDescription } from "./helpCommand.js";
import { projectsCommand, handleInlineQuery } from "./projectsCommand.js";
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
    } else if (action.startsWith("skip_")) {
      console.log("Нажата кнопка Пропустить", action);
      await handleInlineQuery(ctx); // Обработка кнопки "Пропустить"
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

  // Инициализация состояния пользователя
  bot.on("message", async (ctx) => {
    if (!userStates.has(ctx.chat.id)) {
      userStates.set(ctx.chat.id, "free"); // Устанавливаем начальное состояние как "свободен"
      await setUserKeyboard(ctx, "free");
    }
  });
}
