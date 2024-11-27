import { InlineKeyboard } from "grammy";
import db from "../../db/models/index.js";
import axios from "axios";

function escapeMarkdownV2(text) {
  return text.replace(/([\\_*[\]()>#+.!$&|{}=])/g, "\\$1").replace(/-/g, "\\-");
}
// Команда для авторизации
export async function authCommand(ctx, chatTokens, authState) {
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
    chatTokens.set(ctx.chat.id, user.github_token); // Добавляем токен в chatTokens
  } else {
    ctx.session.awaitingToken = true;
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
// Callback для изменения токена
// Callback для изменения токена
export async function changeTokenCallback(ctx) {
  const userId = ctx.from.id;

  // Проверяем, авторизован ли пользователь
  const user = await db.User.findOne({ where: { telegram_id: userId } });

  if (user) {
    // Устанавливаем флаг ожидания нового токена
    ctx.session.awaitingToken = true; // Устанавливаем флаг ожидания токена
    await ctx.reply("Введите новый GitHub токен:");
  } else {
    await ctx.reply(
      "Вы ещё не авторизованы. Используйте /auth для начала авторизации."
    );
  }

  // Закрываем клавиатуру
  await ctx.answerCallbackQuery();
}

// Обработка нового токена
export async function handleNewToken(ctx, chatTokens, authState) {
  const chatId = ctx.chat.id;
  const token = ctx.message.text.trim();

  // Проверяем, если пользователь уже авторизован
  if (chatTokens.has(chatId)) {
    return ctx.reply("Вы уже авторизованы!");
  }

  // Проверка на введённый токен
  if (!token) {
    return ctx.reply("Введите валидный токен GitHub.");
  }

  try {
    // Проверяем токен через GitHub API
    const response = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const username = response.data.login;

    // Сохраняем токен в базе данных
    let user = await db.User.findOne({ where: { telegram_id: chatId } });

    if (!user) {
      // Если пользователя нет, создаем его
      user = await db.User.create({
        telegram_id: chatId,
        github_username: username,
        github_token: token,
      });
    } else {
      // Если пользователь есть, обновляем токен
      user.github_token = token;
      await user.save();
    }

    // Завершаем процесс авторизации, сохраняем токен
    chatTokens.set(chatId, token);
    authState.delete(chatId); // Убираем состояние ожидания авторизации
    ctx.session.awaitingToken = false; // Сбрасываем флаг в сессии

    ctx.reply(`Токен сохранен! Вы авторизованы как ${username}.`);
  } catch (error) {
    console.error("Ошибка проверки токена:", error.message);

    if (error.response?.status === 401) {
      return ctx.reply("Неверный токен. Попробуйте ввести правильный токен.");
    } else {
      return ctx.reply(
        "Произошла ошибка при проверке токена. Попробуйте позже."
      );
    }
  }
}
