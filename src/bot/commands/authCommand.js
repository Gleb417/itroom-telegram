import { InlineKeyboard } from "grammy";

export function authCommand(ctx) {
  // Создаем клавиатуру с кнопкой для авторизации
  const keyboard = new InlineKeyboard().url(
    "Авторизоваться через GitHub",
    "https://github.com/settings/tokens" // Ссылка для создания токена
  );

  // Отправляем сообщение с кнопкой
  ctx.reply(
    "Для авторизации создайте персональный токен GitHub и отправьте его мне. Нажмите на кнопку ниже, чтобы создать токен.",
    { reply_markup: keyboard }
  );
}
