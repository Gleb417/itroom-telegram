import axios from "axios";
import { InlineKeyboard } from "grammy";

export async function tokenHandler(ctx, chatTokens, authState) {
  const chatId = ctx.chat.id;

  // Проверяем, ожидает ли чат токен
  if (!authState.has(chatId)) {
    return; // Если не ожидает, игнорируем сообщение
  }

  const token = ctx.message.text.trim();

  if (!token) {
    return ctx.reply("Введите валидный токен GitHub.");
  }

  try {
    // Проверяем токен через GitHub API
    const response = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const username = response.data.login;

    // Сохраняем токен и завершаем состояние ожидания
    chatTokens.set(chatId, token);
    authState.delete(chatId);

    ctx.reply(`Токен успешно сохранен! Вы авторизованы как ${username}.`);
  } catch (error) {
    console.error("Ошибка проверки токена:", error.message);

    if (error.response && error.response.status === 401) {
      // Неверный токен: предлагаем повторить ввод или отменить
      const keyboard = new InlineKeyboard()
        .text("Попробовать снова", "retry_auth")
        .row()
        .text("Отмена", "cancel_auth");

      await ctx.reply("Неверный токен. Выберите, что хотите сделать:", {
        reply_markup: keyboard,
      });
    } else {
      ctx.reply("Произошла ошибка при проверке токена. Попробуйте позже.");
    }
  }
}
