import { authCommand } from "./authCommand.js";
import { setUserKeyboard } from "../../utils/keyboard.js";
import { tokenHandler } from "../middlewares/authMiddleware.js";
import { cancelAuth } from "./cancelAuth.js";
import { retryAuth } from "./retryAuth.js";

export function registerCommands(bot, chatTokens, authState, userStates) {
  // Команда /auth
  bot.command("auth", async (ctx) => {
    if (userStates.get(ctx.chat.id) === "busy") {
      return ctx.reply(
        "Вы находитесь в процессе выполнения задачи. Завершите текущую задачу, чтобы использовать команды."
      );
    }
    authCommand(ctx, chatTokens, authState);
    await setUserKeyboard(ctx, "free");
  });

  // Обработка текстовых сообщений (например, токена)
  bot.on("message:text", async (ctx) => {
    if (userStates.get(ctx.chat.id) === "busy") {
      return ctx.reply("Вы находитесь в процессе выполнения задачи.");
    }
    tokenHandler(ctx, chatTokens, authState);
  });

  // Обработка inline-кнопок
  bot.on("callback_query:data", async (ctx) => {
    const action = ctx.callbackQuery.data;

    if (action === "cancel_auth") {
      cancelAuth(ctx, authState);
    } else if (action === "retry_auth") {
      retryAuth(ctx);
    }

    await ctx.answerCallbackQuery(); // Убираем индикатор загрузки на кнопке
  });

  // Инициализация состояния пользователя
  bot.on("message", async (ctx) => {
    if (!userStates.has(ctx.chat.id)) {
      userStates.set(ctx.chat.id, "free"); // Устанавливаем начальное состояние как "свободен"
      await setUserKeyboard(ctx, "free");
    }
  });
}
