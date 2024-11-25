// src/bot/commands/commentsCommand.js

import { InlineKeyboard } from "grammy";
import { getComments } from "../../services/githubService.js"; // Импортируем функцию для получения комментариев
import { getTaskDetails } from "../../services/githubService.js"; // Если нужно для других задач
import db from "../../db/models/index.js";

// Функция для экранирования символов MarkdownV2
// Функция для экранирования символов MarkdownV2
function escapeMarkdownV2(text) {
  return text.replace(/([\\_*[\]()>#+.!$&|{}])/g, "\\$1").replace(/-/g, "\\-"); // Экранирование дефиса
}

// Функция для проверки авторизации пользователя
async function checkUserAuthorization(ctx) {
  const chatId = ctx.chat.id;
  const user = await db.User.findOne({ where: { telegram_id: chatId } });
  if (!user || !user.github_token) {
    console.log("Пользователь не авторизован");
    return null; // Возвращаем null, если пользователь не авторизован
  }
  return user.github_token; // Возвращаем токен пользователя
}

// Функция для получения комментариев задачи и создания кнопки
export async function showTaskComments(ctx) {
  const action = ctx.callbackQuery.data;
  const taskId = action.split("_").slice(2).join("_"); // Извлекаем ID задачи

  console.log("Получен taskId:", taskId);

  try {
    const userToken = await checkUserAuthorization(ctx); // Получаем токен
    if (!userToken) return; // Если токен не получен, выходим
    const comments = await getComments(userToken, taskId); // Функция для получения комментариев

    let commentsText = "Комментариев нет."; // Сообщение, если комментариев нет

    if (comments && comments.length > 0) {
      commentsText = "";
      const chunkSize = 4000; // Максимальное количество символов для одного сообщения
      let currentChunk = "";

      for (const comment of comments) {
        const commentText = `
              **Автор:** ${escapeMarkdownV2(comment.user.login)}
              **Дата:** ${escapeMarkdownV2(
                new Date(comment.createdAt).toLocaleString()
              )}
              **Комментарий:** ${escapeMarkdownV2(comment.body)}
            `;

        // Если текущий блок слишком длинный, отправляем его и начинаем новый
        if (currentChunk.length + commentText.length > chunkSize) {
          await ctx.reply(currentChunk, { parse_mode: "MarkdownV2" });
          currentChunk = commentText; // Новый блок
        } else {
          currentChunk += commentText;
        }
      }

      // Отправляем последний блок, если есть остатки
      if (currentChunk) {
        await ctx.reply(currentChunk, { parse_mode: "MarkdownV2" });
      }
    } else {
      // Если комментариев нет, отправляем это сообщение
      await ctx.reply(commentsText, { parse_mode: "MarkdownV2" });
    }

    await ctx.answerCallbackQuery(); // Подтверждаем действие
  } catch (error) {
    console.error("Ошибка при получении комментариев:", error);
    await ctx.reply(`Не удалось загрузить комментарии: ${error.message}`);
  }
}
