// Здесь хранится команда для авторизации
import { InlineKeyboard } from "grammy";

export function authCommand(ctx, chatTokens, authState) {
  // Удалить предыдущий токен и состояние
  chatTokens.delete(ctx.chat.id);
  authState.add(ctx.chat.id);

  const keyboard = new InlineKeyboard()
    .url("Создать токен GitHub", "https://github.com/settings/tokens")
    .row()
    .text("Отмена", "cancel_auth"); // Inline-кнопка "Отмена"

  ctx.reply(
    "Введите ваш персональный токен GitHub. Нажмите на кнопку ниже, чтобы создать токен или отменить процесс.",
    { reply_markup: keyboard }
  );
}
