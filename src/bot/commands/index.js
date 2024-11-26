import {
  authCommand,
  changeTokenCallback,
  handleNewToken,
} from "./authCommand.js";
import { setUserKeyboard } from "../../utils/keyboard.js";
import { tokenHandler } from "../middlewares/authMiddleware.js";
import { cancelAuth } from "./cancelAuth.js";
import { retryAuth } from "./retryAuth.js";
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

    await authCommand(ctx); // Вызываем логику авторизации
    userStates.set(ctx.chat.id, "free"); // Устанавливаем состояние пользователя как свободное
    await setUserKeyboard(ctx, "free");
  });
  bot.command("project", projectsCommand);

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
    } else if (action === "cancel_auth") {
      cancelAuth(ctx, authState); // Обработка отмены авторизации
    } else if (action === "retry_auth") {
      retryAuth(ctx); // Обработка повторной попытки авторизации
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
  addCommandDescription(
    "/retry",
    "Попробовать повторить последний шаг авторизации (если доступно)."
  );
  addCommandDescription(
    "/cancel",
    "Отменить текущий процесс авторизации или выполнения задачи."
  );
  // Обработка текстовых сообщений (например, токена)
  bot.on("message:text", async (ctx) => {
    const userState = userStates.get(ctx.chat.id) || "free";

    if (userState === "busy") {
      return ctx.reply("Вы находитесь в процессе выполнения задачи.");
    }

    // Обрабатываем новый токен или сообщение
    if (ctx.session.awaitingToken) {
      await handleNewToken(ctx);
    } else {
      tokenHandler(ctx, chatTokens, authState);
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
