import { InlineKeyboard } from "grammy";
import db from "../../db/models/index.js";

function escapeMarkdownV2(text) {
  return text.replace(/([\\_*[\]()>#+.!$&|{}=])/g, "\\$1").replace(/-/g, "\\-");
}
// Команда для авторизации
export async function authCommand(ctx) {
  const userId = ctx.from.id;

  // Ищем пользователя в базе данных
  let user = await db.User.findOne({ where: { telegram_id: userId } });

  if (user) {
    // Пользователь уже авторизован
    await ctx.reply(
      `Вы уже авторизованы. Ваш текущий GitHub токен: ${
        user.github_token || "не указан"
      }`,
      {
        reply_markup: new InlineKeyboard().text(
          "Изменить GitHub токен",
          "change_token"
        ),
      }
    );
  } else {
    // Пользователь не авторизован, отправляем инструкцию
    const message = `
  Вы еще не авторизованы. Для авторизации вам нужно создать личный токен доступа на GitHub.
  
  1. Перейдите по [ссылке](https://github.com/settings/tokens/new?scopes=repo,read:org,notifications,read:user,project) для создания токена.
  2. Убедитесь, что вы добавили следующие права:
	 - \`repo\` (доступ к вашим репозиториям)
	 - \`read:org\` (чтение информации о вашей организации)
	 - \`notifications\` (доступ к вашим уведомлениям)
	 - \`read:user\` (чтение информации о пользователе)
	 - \`project\` (доступ к проектам)
  
  После создания токена отправьте его мне для завершения авторизации.
	  `;

    await ctx.reply(escapeMarkdownV2(message), { parse_mode: "MarkdownV2" });
  }
}

// Callback для изменения токена
export async function changeTokenCallback(ctx) {
  const userId = ctx.from.id;

  const user = await db.User.findOne({ where: { telegram_id: userId } });

  if (user) {
    // Устанавливаем флаг ожидания нового токена
    await ctx.reply("Введите новый GitHub токен:");
    ctx.session.awaitingToken = true;
  } else {
    await ctx.reply(
      "Вы ещё не авторизованы. Используйте /auth для начала авторизации."
    );
  }

  // Закрываем клавиатуру
  await ctx.answerCallbackQuery();
}

// Обработка нового токена
export async function handleNewToken(ctx) {
  const userId = ctx.from.id;

  // Проверяем, ожидается ли токен
  if (ctx.session.awaitingToken) {
    const newToken = ctx.message.text;

    // Сохраняем или обновляем токен в базе данных
    const [user, created] = await db.User.findOrCreate({
      where: { telegram_id: userId },
      defaults: {
        telegram_id: userId,
        github_token: newToken,
        github_username: "Не указано", // Дополнительно можно запросить GitHub username
      },
    });

    if (!created) {
      user.github_token = newToken;
      await user.save();
    }

    ctx.session.awaitingToken = false; // Сбрасываем состояние

    await ctx.reply("Ваш GitHub токен успешно сохранён!");
  }
}
