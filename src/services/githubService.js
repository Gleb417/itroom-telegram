import axios from "axios";

async function getTasks(userToken, projectId) {
  const query = `
	  query ($projectId: ID!) {
		node(id: $projectId) {
		  ... on ProjectV2 {
			items(first: 50) {  # Увеличь значение, если нужно больше задач
			  nodes {
				id
				title: fieldValueByName(name: "Title") {
				  ... on ProjectV2ItemFieldSingleSelectValue {
					name
				  }
				}
				content {
				  ... on Issue {
					id
					title
					url
					createdAt
				  }
				  ... on PullRequest {
					id
					title
					url
					createdAt
				  }
				}
			  }
			}
		  }
		}
	  }
	`;

  const variables = { projectId };

  try {
    console.log("GraphQL variables for getTasks:", variables);

    const response = await axios.post(
      "https://api.github.com/graphql",
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    console.log("GraphQL response for tasks:", response.data);

    if (response.data.errors) {
      console.error("GraphQL ошибки:", response.data.errors);
      throw new Error("Ошибка GraphQL: " + response.data.errors[0]?.message);
    }

    const items = response.data?.data?.node?.items?.nodes;

    if (!items || !Array.isArray(items)) {
      console.error("Данные задач отсутствуют или некорректны.");
      return [];
    }

    return items.map((item) => ({
      id: item.id,
      title: item.title?.name || item.content?.title || "Без названия",
      url: item.content?.url || null,
      createdAt: item.content?.createdAt || null,
    }));
  } catch (error) {
    console.error(
      "Ошибка при получении задач Projects V2:",
      error.response?.data || error.message
    );
    throw new Error("Не удалось получить задачи. Проверьте данные проекта.");
  }
}

async function getComments(userToken, issueId) {
  try {
    const response = await axios.get(
      `https://api.github.com/issues/${issueId}/comments`,
      {
        headers: { Authorization: `token ${userToken}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Ошибка при получении комментариев:",
      error.response?.data || error.message
    );
    throw new Error(
      "Не удалось получить комментарии. Проверьте данные задачи."
    );
  }
}

async function getRepositories(userToken) {
  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `token ${userToken}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Ошибка при получении репозиториев:",
      error.response?.data || error.message
    );
    throw new Error("Не удалось получить репозитории. Проверьте токен.");
  }
}

async function getProjectsV2(userToken, owner, repo) {
  const query = `
		query ($owner: String!, $repo: String!) {
		  repository(owner: $owner, name: $repo) {
			projectsV2(first: 10) {
			  nodes {
				id
				title
				url
			  }
			}
		  }
		}
	  `;

  const variables = { owner, repo };

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (response.data.errors) {
      console.error("GraphQL ошибки:", response.data.errors);
      throw new Error("Ошибка GraphQL: " + response.data.errors[0]?.message);
    }

    if (
      !response.data?.data?.repository?.projectsV2?.nodes ||
      !Array.isArray(response.data.data.repository.projectsV2.nodes)
    ) {
      console.error("Данные проекта отсутствуют или некорректны.");
      return [];
    }

    return response.data.data.repository.projectsV2.nodes;
  } catch (error) {
    console.error("Ошибка получения Projects (beta):", error.message);
    if (error.response?.data) {
      console.error("Дополнительная информация:", error.response.data);
    }
    throw new Error(
      "Не удалось получить проекты. Проверьте токен или данные репозитория."
    );
  }
}
// Функция для глубокого логирования объектов
function deepLog(obj) {
  return JSON.stringify(obj, null, 2); // Печатает объект с отступами
}

async function getTaskDetails(userToken, taskId) {
  try {
    const query = `
		query ($taskId: ID!) {
		  node(id: $taskId) {
			... on ProjectV2Item {
			  id
			  content {
				... on Issue {
				  title
				  body
				  url
				  createdAt
				  updatedAt
				  assignees(first: 10) {
					nodes {
					  login
					}
				  }
				}
				... on DraftIssue {
				  title
				  body
				}
			  }
			}
		  }
		}
	  `;

    const variables = { taskId };

    console.log("Отправка запроса на GitHub API:");
    console.log("Query:", query);
    console.log("Variables:", variables);

    const response = await axios.post(
      "https://api.github.com/graphql",
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Логируем весь ответ
    console.log("Ответ от GitHub API:");
    console.log(JSON.stringify(response.data, null, 2));

    const taskData = response.data.data.node.content;
    console.log("Данные задачи:", JSON.stringify(taskData, null, 2));

    if (!taskData) {
      console.error("Задача не найдена. taskId:", taskId);
      throw new Error("Задача не найдена.");
    }

    // Обработка assignees
    const assignees =
      taskData.assignees?.nodes?.map((assignee) => assignee.login).join(", ") ||
      "Не назначен";

    const taskDetails = {
      id: taskData.id,
      title: taskData.title || "Без названия",
      body: taskData.body || "Нет описания",
      url: taskData.url,
      createdAt: taskData.createdAt,
      updatedAt: taskData.updatedAt,
      assignee: assignees,
    };

    return taskDetails;
  } catch (error) {
    console.error("Ошибка при получении данных о задаче:");
    console.error(error.response?.data || error.message);
    throw new Error("Не удалось получить данные о задаче.");
  }
}

export {
  getRepositories,
  getTasks,
  getComments,
  getProjectsV2,
  getTaskDetails,
};
