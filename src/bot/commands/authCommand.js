import { InlineKeyboard } from "grammy";

export function authCommand(ctx, chatTokens) {
  // Очистить возможный ранее сохраненный токен для текущего чата
  chatTokens.delete(ctx.chat.id);

  const keyboard = new InlineKeyboard().url(
    "Создать токен GitHub",
    "https://github.com/settings/tokens" // Ссылка для создания токена
  );

  ctx.reply(
    "Для авторизации введите персональный токен GitHub. Нажмите на кнопку ниже, чтобы создать токен.",
    { reply_markup: keyboard }
  );
}
