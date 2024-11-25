import { InlineKeyboard } from "grammy";
import {
  getRepositories,
  getProjectsV2,
  getTasks,
  getTaskDetails,
} from "../../services/githubService.js";
import db from "../../db/models/index.js";

// Команда для отображения репозиториев
export async function projectsCommand(ctx) {
  console.log("Команда /project вызвана");
  const chatId = ctx.chat.id;

  try {
    const user = await db.User.findOne({ where: { telegram_id: chatId } });
    if (!user || !user.github_token) {
      console.log("Пользователь не авторизован");
      return ctx.reply(
        "Вы не авторизованы. Используйте /auth для авторизации."
      );
    }

    const userToken = user.github_token;
    const repositories = await getRepositories(userToken);

    if (!repositories.length) {
      return ctx.reply("У вас нет доступных репозиториев.");
    }

    const keyboard = new InlineKeyboard();
    repositories.forEach((repo) => {
      keyboard.text(repo.name, `repo_${repo.id}`).row();
    });

    await ctx.reply("Выберите репозиторий:", { reply_markup: keyboard });
  } catch (error) {
    console.error("Ошибка в projectsCommand:", error.message);
    ctx.reply("Произошла ошибка при обработке команды. Попробуйте позже.");
  }
}

// Обработка inline-запросов (выбор репозитория, проекта и задачи)
// Обработка проекта (получение задач)
// Обработка проекта (получение задач)
// Обработка проекта (получение задач)
// Обработка проекта (получение задач)
export async function handleInlineQuery(ctx) {
  const action = ctx.callbackQuery.data;

  try {
    const chatId = ctx.chat.id;
    const user = await db.User.findOne({ where: { telegram_id: chatId } });

    if (!user || !user.github_token) {
      await ctx.answerCallbackQuery();
      return ctx.reply(
        "Вы не авторизованы. Используйте /auth для авторизации."
      );
    }

    const userToken = user.github_token;

    // Обработка репозитория
    if (action.startsWith("repo_")) {
      const repoId = action.split("_")[1];
      const repositories = await getRepositories(userToken);
      const selectedRepo = repositories.find(
        (repo) => String(repo.id) === repoId
      );

      if (!selectedRepo) {
        console.error("Репозиторий не найден. repoId:", repoId);
        await ctx.answerCallbackQuery();
        return ctx.reply("Репозиторий не найден.");
      }

      const projects = await getProjectsV2(
        userToken,
        selectedRepo.owner.login,
        selectedRepo.name
      );

      if (!projects.length) {
        await ctx.answerCallbackQuery();
        return ctx.reply("В этом репозитории нет проектов.");
      }

      const keyboard = new InlineKeyboard();
      projects.forEach((project) => {
        keyboard.text(project.title, `project_${project.id}_${repoId}`).row();
      });

      await ctx.answerCallbackQuery();
      return ctx.reply("Выберите проект:", { reply_markup: keyboard });
    }

    // Обработка проекта (получение задач)
    if (action.startsWith("project_")) {
      const lastUnderscoreIndex = action.lastIndexOf("_");
      const projectId = action.slice(8, lastUnderscoreIndex); // "project_" (8 символов)
      const repoId = action.slice(lastUnderscoreIndex + 1);

      const repositories = await getRepositories(userToken);
      const selectedRepo = repositories.find(
        (repo) => String(repo.id) === repoId
      );

      if (!selectedRepo) {
        console.error("Репозиторий не найден. repoId:", repoId);
        await ctx.answerCallbackQuery();
        return ctx.reply("Репозиторий не найден.");
      }

      const tasks = await getTasks(userToken, projectId);
      console.log("Полученные задачи:", tasks);

      if (!tasks.length) {
        return ctx.reply("В этом проекте нет задач.");
      }

      // Логируем все задачи перед фильтрацией
      tasks.forEach((task) => {
        console.log(
          "Задача перед фильтрацией:",
          task.title,
          task.content?.assignees
        );
      });

      // Получаем подробности по каждой задаче (включая назначенных пользователей)
      const tasksWithDetails = await Promise.all(
        tasks.map(async (task) => {
          const taskDetails = await getTaskDetails(userToken, task.id);
          return { ...task, details: taskDetails }; // Добавляем подробности задачи
        })
      );
      console.log(tasksWithDetails);

      // Фильтруем задачи по назначенному пользователю
      const assignedTasks = tasksWithDetails.filter((task) => {
        // Проверяем, если задача имеет назначенного пользователя (строку с именем)
        const assignee = task.details?.assignee; // Это строка, а не объект
        return assignee === user.github_username; // Сравниваем с логином пользователя
      });

      // Логируем задачи после фильтрации
      console.log(
        "Задачи после фильтрации по назначенному пользователю:",
        assignedTasks
      );

      if (assignedTasks.length === 0) {
        return ctx.reply("Вы не назначены на задачи в этом проекте.");
      }

      const keyboard = new InlineKeyboard();
      assignedTasks.forEach((task) => {
        const taskText = task.title || "Без названия"; // Используем резервное название
        keyboard.text(taskText, `task_${task.id}`).row();
      });

      return ctx.reply("Выберите задачу:", { reply_markup: keyboard });
    }

    // Обработка задачи (показ всей информации о задаче)
    if (action.startsWith("task_")) {
      const taskId = action.split("_").slice(1).join("_"); // Получаем правильный taskId
      console.log("Полученный taskId:", taskId);

      const task = await getTaskDetails(userToken, taskId);

      // Проверяем, если задача не найдена или в ответе нет нужных данных
      if (!task) {
        await ctx.answerCallbackQuery();
        return ctx.reply(
          "Задача не найдена или имеет неверную структуру данных."
        );
      }

      const taskDetails = `
          **Задача:** ${escapeMarkdown(task.title)}
          **Описание:** ${escapeMarkdown(task.body || "Нет описания")}
          **Ссылка:** [Открыть задачу](${escapeMarkdown(task.url)})
          **Создана:** ${escapeMarkdown(task.createdAt)}
          **Обновлена:** ${escapeMarkdown(task.updatedAt)}
          **Ответственный:** ${escapeMarkdown(
            task.assignee?.login || "Не назначен"
          )}
        `;

      // Кнопка для комментариев
      console.log("АЙди задачи:", taskId);
      const keyboard = new InlineKeyboard().text(
        "Показать комментарии",
        `show_comments_${taskId}`
      );

      await ctx.answerCallbackQuery();
      return ctx.reply(taskDetails, {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    console.error(
      "Ошибка в handleInlineQuery:",
      error.response?.data || error.message
    );
    await ctx.answerCallbackQuery();
    ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
}

// Экранирование Markdown
function escapeMarkdown(text) {
  return text.replace(/([_\*\[\]()~`>#+\-=|{}.!-])/g, "\\$1");
}
