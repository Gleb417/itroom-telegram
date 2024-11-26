import { InlineKeyboard } from "grammy";
import {
  getRepositories,
  getProjectsV2,
  getTasks,
  getTaskDetails,
  getProjectFields,
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

      // Получаем поля проекта
      const projectFields = await getProjectFields(userToken, projectId);

      // Фильтруем поля, чтобы оставить только те, у которых dataType === 'DATE'
      const dateFields = projectFields.filter(
        (field) => field.dataType === "DATE"
      );

      const keyboard = new InlineKeyboard();

      // Формируем кнопки для каждого поля с типом DATE
      dateFields.forEach((field) => {
        if (field.id && field.name) {
          const buttonData = `deadline_${field.id}_${projectId}`;
          // Убедитесь, что buttonData не содержит нежелательных символов или пробелов
          if (buttonData && buttonData.length < 64) {
            // Telegram API ограничивает длину строки
            keyboard.text(field.name, buttonData).row();
          } else {
            console.error("Некорректные данные для кнопки:", buttonData);
          }
        } else {
          console.error("Поле не содержит id или name:", field);
        }
      });

      // Отправляем клавиатуру с кнопками
      await ctx.answerCallbackQuery();
      return ctx.reply("Выберите поле для сортировки по дедлайну:", {
        reply_markup: keyboard,
      });
    }

    // Обработка выбора поля для дедлайна
    if (action.startsWith("deadline_")) {
      const actionWithoutPrefix = action.slice(9); // Получаем строку без "deadline_"

      // Разделяем строку по символу "_"
      const actionParts = actionWithoutPrefix.split("_");

      // fieldId - это все части до последних двух
      const fieldId = actionParts.slice(0, actionParts.length - 2).join("_");

      // projectId - это последние две части
      const projectId = actionParts.slice(actionParts.length - 2).join("_");

      console.log("Полный полученный айди:", action);
      console.log("Айди поля:", fieldId); // Например, PVTF_lADOC06YzM4AtG5Yzgj7GLI
      console.log("Айди проекта:", projectId); // Например, PVT_kwDOC06YzM4AtG5Y

      // Получаем задачи и сортируем по выбранному полю
      const tasks = await getTasks(userToken, projectId);
      const projectFields = await getProjectFields(userToken, projectId);

      // Находим выбранное поле
      const deadlineField = projectFields.find((field) => field.id === fieldId);

      if (!deadlineField) {
        return ctx.reply("Не удалось найти выбранное поле.");
      }

      // Фильтрация задач по назначенному пользователю
      const tasksWithDetails = await Promise.all(
        tasks.map(async (task) => {
          const taskDetails = await getTaskDetails(userToken, task.id);
          return { ...task, details: taskDetails }; // Добавляем подробности задачи
        })
      );

      // Фильтруем задачи по назначенному пользователю
      const assignedTasks = tasksWithDetails.filter((task) => {
        const assigneesString = task.details?.assignees;
        if (!assigneesString) return false; // Если исполнители отсутствуют, исключаем задачу

        // Преобразуем строку исполнителей в массив логинов
        const assignees = assigneesString
          .split(",")
          .map((assignee) => assignee.trim());

        // Проверяем, есть ли текущий пользователь среди исполнителей
        return assignees.includes(user.github_username);
      });

      if (assignedTasks.length === 0) {
        return ctx.reply("Вы не назначены на задачи в этом проекте.");
      }

      // Сортируем задачи по дедлайну
      const sortedTasks = assignedTasks.sort((a, b) => {
        const deadlineA = a.fields[deadlineField.name];
        const deadlineB = b.fields[deadlineField.name];

        if (!deadlineA || !deadlineB) return 0;

        return new Date(deadlineA) - new Date(deadlineB);
      });

      // Показываем отсортированные задачи с дедлайнами
      const keyboard = new InlineKeyboard();
      sortedTasks.forEach((task) => {
        const taskText = task.title || "Без названия"; // Используем резервное название
        const deadline = task.fields[deadlineField.name]; // Получаем дедлайн из задачи

        // Если есть дедлайн, добавляем его в текст задачи
        const taskDisplayText = deadline
          ? `${taskText} (Дедлайн: ${new Date(deadline).toLocaleDateString()})`
          : taskText;

        keyboard.text(taskDisplayText, `task_${task.id}`).row();
      });

      await ctx.reply("Задачи отсортированы по дедлайну:", {
        reply_markup: keyboard,
      });
    }

    // Обработка задачи (показ всей информации о задаче)
    if (action.startsWith("task_")) {
      const taskId = action.split("_").slice(1).join("_"); // Получаем правильный taskId
      console.log("Полученный taskId:", taskId);

      const task = await getTaskDetails(userToken, taskId);

      if (!task) {
        await ctx.answerCallbackQuery();
        return ctx.reply(
          "Задача не найдена или имеет неверную структуру данных."
        );
      }

      const taskDetails = `
📋 *Задача*: ${escapeMarkdown(task.title)}

📝 *Описание*: ${escapeMarkdown(task.body || "Нет описания")}

🔗 *Ссылка*: [Открыть задачу](${task.url})

🕒 *Создана*: ${escapeMarkdown(new Date(task.createdAt).toLocaleString())}
🔄 *Обновлена*: ${escapeMarkdown(new Date(task.updatedAt).toLocaleString())}

👤 *Ответственный*: ${escapeMarkdown(task.assignee || "Не назначен")}`;

      // Кнопка для комментариев
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
    console.error("Ошибка в handleInlineQuery:", error);
    await ctx.answerCallbackQuery();
    ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
}

// Экранирование Markdown
function escapeMarkdown(text) {
  return text.replace(/([_\*\[\]()~`>#+\-=|{}.!-])/g, "\\$1");
}
