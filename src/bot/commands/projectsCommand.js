import { InlineKeyboard } from "grammy";
import {
  getRepositories,
  getProjectsV2,
  getTasks,
  getTaskDetails,
  getProjectFields,
} from "../../services/githubService.js";
import db from "../../db/models/index.js";

const ITEMS_PER_PAGE = 3;

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

    // Сохраняем репозитории в сессии (или в базе данных)
    ctx.session.repositories = repositories;

    // Показываем первую страницу
    await showRepositoryPage(ctx, 1);
  } catch (error) {
    console.error("Ошибка в projectsCommand:", error.message);
    ctx.reply("Произошла ошибка при обработке команды. Попробуйте позже.");
  }
}

// Функция для отображения страницы с репозиториями
export async function showRepositoryPage(ctx, page) {
  const repositories = ctx.session.repositories || [];
  const totalPages = Math.ceil(repositories.length / ITEMS_PER_PAGE);

  // Проверяем, что номер страницы корректен
  if (page < 1 || page > totalPages) {
    return ctx.reply("Недействительный номер страницы.");
  }

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageRepositories = repositories.slice(startIndex, endIndex);

  const keyboard = new InlineKeyboard();
  pageRepositories.forEach((repo) => {
    keyboard.text(repo.name, `repo_${repo.id}`).row();
  });

  // Добавляем кнопки "Назад" и "Вперед"
  if (page > 1) {
    keyboard.text("⬅ Назад", `page_${page - 1}`);
  }
  if (page < totalPages) {
    keyboard.text("Вперед ➡", `page_${page + 1}`);
  }

  // Показываем текущую страницу
  await ctx.reply(`Страница ${page} из ${totalPages}`, {
    reply_markup: keyboard,
  });
}

// Показать проекты с пагинацией
export async function showProjectPage(ctx, page) {
  const projects = ctx.session.projects || [];
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);

  if (page < 1 || page > totalPages) {
    return ctx.reply("Недействительный номер страницы.");
  }

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageProjects = projects.slice(startIndex, endIndex);

  const keyboard = new InlineKeyboard();
  pageProjects.forEach((project) => {
    const repoId = ctx.session.currentRepoId; // Получаем текущий репозиторий из сессии
    keyboard.text(project.title, `project_${project.id}_${repoId}`).row();
  });

  if (page > 1) {
    keyboard.text("⬅ Назад", `project_page_${page - 1}`);
  }
  if (page < totalPages) {
    keyboard.text("Вперед ➡", `project_page_${page + 1}`);
  }

  await ctx.reply(`Проекты. Страница ${page} из ${totalPages}`, {
    reply_markup: keyboard,
  });
}

export async function showTasksPage(ctx, tasks, page, deadlineField) {
  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);

  if (page < 1 || page > totalPages) {
    return ctx.reply("Недействительный номер страницы.");
  }

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageTasks = tasks.slice(startIndex, endIndex);

  const keyboard = new InlineKeyboard();

  pageTasks.forEach((task) => {
    const taskName = task.title || "Без названия";
    const deadline = task.fields[deadlineField.name]
      ? new Date(task.fields[deadlineField.name]).toLocaleDateString()
      : "Нет дедлайна";

    keyboard
      .text(`${taskName} (Дедлайн: ${deadline})`, `task_${task.id}`)
      .row();
  });

  if (page > 1) {
    keyboard.text("⬅ Назад", `tasks_page_${page - 1}`);
  }
  if (page < totalPages) {
    keyboard.text("Вперед ➡", `tasks_page_${page + 1}`);
  }

  await ctx.editMessageText(`Страница ${page} из ${totalPages}`, {
    reply_markup: keyboard,
  });
}

export async function showPaginatedTasks(ctx, tasks, page) {
  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);

  if (page < 1 || page > totalPages) {
    return ctx.reply("Недействительный номер страницы.");
  }

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageTasks = tasks.slice(startIndex, endIndex);

  const keyboard = new InlineKeyboard();

  pageTasks.forEach((task) => {
    const taskName = task.title || "Без названия";
    keyboard.text(taskName, `task_${task.id}`).row();
  });

  if (page > 1) {
    keyboard.text("⬅️ Назад", `taskss_page_${page - 1}`);
  }
  if (page < totalPages) {
    keyboard.text("Вперёд ➡️", `taskss_page_${page + 1}`);
  }

  await ctx.editMessageText(`Страница ${page} из ${totalPages}`, {
    reply_markup: keyboard,
  });
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

    if (action.startsWith("page_")) {
      // Обработка кнопок для перехода по страницам
      const page = parseInt(action.split("_")[1], 10);
      return await showRepositoryPage(ctx, page);
    }

    // Обработка репозитория
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

      // Сохраняем проекты в сессии
      ctx.session.projects = projects;
      ctx.session.currentRepoId = repoId; // Сохраняем текущий репозиторий для контекста

      // Показываем первую страницу проектов
      await showProjectPage(ctx, 1);
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

      if (dateFields.length > 0) {
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
      }

      // Добавляем кнопку "Пропустить" в любом случае
      keyboard.text("Пропустить", `skip_${projectId}`).row();
      // Отправляем клавиатуру с кнопками
      await ctx.answerCallbackQuery();
      return ctx.reply("Выберите поле для сортировки по дедлайну:", {
        reply_markup: keyboard,
      });
    }

    // Обработка выбора поля для дедлайна или кнопки "Пропустить"
    if (action.startsWith("deadline_")) {
      const actionWithoutPrefix = action.slice(9);

      const actionParts = actionWithoutPrefix.split("_");
      const fieldId = actionParts.slice(0, actionParts.length - 2).join("_");
      const projectId = actionParts.slice(actionParts.length - 2).join("_");

      console.log("Полный полученный айди:", action);
      console.log("Айди поля:", fieldId);
      console.log("Айди проекта:", projectId);

      const tasks = await getTasks(userToken, projectId);
      const projectFields = await getProjectFields(userToken, projectId);
      const deadlineField = projectFields.find((field) => field.id === fieldId);

      if (!deadlineField) {
        return ctx.reply("Не удалось найти выбранное поле.");
      }

      const tasksWithDetails = await Promise.all(
        tasks.map(async (task) => {
          const taskDetails = await getTaskDetails(userToken, task.id);
          return { ...task, details: taskDetails };
        })
      );

      const assignedTasks = tasksWithDetails.filter((task) => {
        const assigneesString = task.details?.assignees;
        if (!assigneesString) return false;

        const assignees = assigneesString
          .split(",")
          .map((assignee) => assignee.trim());

        return assignees.includes(user.github_username);
      });

      if (assignedTasks.length === 0) {
        return ctx.reply("Вы не назначены на задачи в этом проекте.");
      }

      const sortedTasks = assignedTasks.sort((a, b) => {
        const deadlineA = a.fields[deadlineField.name];
        const deadlineB = b.fields[deadlineField.name];

        if (!deadlineA || !deadlineB) return 0;

        return new Date(deadlineA) - new Date(deadlineB);
      });

      // Сохраняем задачи в сессии
      ctx.session.sortedTasks = sortedTasks;
      ctx.session.deadlineField = deadlineField;

      // Показываем первую страницу
      await showTasksPage(ctx, sortedTasks, 1, deadlineField);
    }

    // Обработка кнопки "Пропустить"
    // Обработка кнопки "Пропустить"
    if (action.startsWith("tasks_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      const sortedTasks = ctx.session.sortedTasks || [];
      const deadlineField = ctx.session.deadlineField;

      if (!sortedTasks.length) {
        return ctx.reply("Задачи отсутствуют.");
      }

      await showTasksPage(ctx, sortedTasks, page, deadlineField);
    }
    if (action.startsWith("taskss_page_")) {
      const page = parseInt(action.split("_")[2], 10);
      const task = ctx.session.assignedTasks;
      if (!task.length) {
        return ctx.reply("Задачи отсутвуют.");
      }
      await showPaginatedTasks(ctx, task, page);
    }

    if (action.startsWith("skip_")) {
      const actionParts = action.split("_");
      const projectId = `${actionParts[1]}_${actionParts[2]}`;

      try {
        // Получаем задачи проекта
        const tasks = await getTasks(userToken, projectId);
        const tasksWithDetails = await Promise.all(
          tasks.map(async (task) => {
            const taskDetails = await getTaskDetails(userToken, task.id);
            return { ...task, details: taskDetails };
          })
        );

        // Фильтруем задачи по назначенному пользователю
        const assignedTasks = tasksWithDetails.filter((task) => {
          const assigneesString = task.details?.assignees;
          if (!assigneesString) return false;

          const assignees = assigneesString
            .split(",")
            .map((assignee) => assignee.trim());

          return assignees.includes(user.github_username);
        });

        if (!assignedTasks.length) {
          return ctx.reply("Вы не назначены на задачи в этом проекте.");
        }

        // Сохраняем задачи в сессии
        ctx.session.assignedTasks = assignedTasks;

        // Показываем страницу задач
        await showPaginatedTasks(ctx, assignedTasks, 1);
      } catch (error) {
        console.error(
          "Ошибка при обработке кнопки 'Пропустить':",
          error.message
        );
        await ctx.reply(
          "Произошла ошибка при обработке задач. Попробуйте позже."
        );
      }
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

👤 *Ответственный*: ${escapeMarkdown(task.assignees || "Не назначен")}`;

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
