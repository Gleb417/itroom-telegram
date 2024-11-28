import axios from "axios";

async function getTasks(userToken, projectId) {
  const query = `
    query ($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 50) {
            nodes {
              id
              content {
                ... on Issue {
                  title
                  url
                  createdAt
                }
                ... on PullRequest {
                  title
                  url
                  createdAt
                }
              }
              fieldValues(first: 50) {
                nodes {
                  ... on ProjectV2ItemFieldValueCommon {
                    field {
                      ... on ProjectV2SingleSelectField {
                        id
                        name
                      }
                      ... on ProjectV2Field {
                        id
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                  }
                  ... on ProjectV2ItemFieldTextValue {
                    text
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    date
                  }
                  ... on ProjectV2ItemFieldNumberValue {
                    number
                  }
                  ... on ProjectV2ItemFieldIterationValue {
                    title
                    duration
                  }
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

    const items = response.data?.data?.node?.items?.nodes;

    if (!items || !Array.isArray(items)) {
      console.error("Данные задач отсутствуют или некорректны.");
      return [];
    }

    return items.map((item) => {
      const fields = {};
      item.fieldValues.nodes.forEach((fieldValue) => {
        if (fieldValue.field?.name) {
          fields[fieldValue.field.name] =
            fieldValue.text ||
            fieldValue.name ||
            fieldValue.date ||
            fieldValue.number ||
            fieldValue.title || // Для Iteration Value
            null;
        }
      });

      return {
        id: item.id,
        title: item.content?.title || "Без названия",
        url: item.content?.url || null,
        createdAt: item.content?.createdAt || null,
        fields,
      };
    });
  } catch (error) {
    console.error(
      "Ошибка при получении задач Projects V2:",
      error.response?.data || error.message
    );
    throw new Error("Не удалось получить задачи. Проверьте данные проекта.");
  }
}

async function getProjectFields(userToken, projectId) {
  const query = `
    query ($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 50) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  name
                }
              }
              ... on ProjectV2Field {
                id
                name
                dataType
              }
              ... on ProjectV2Field {
                id
                name
              }
              ... on ProjectV2Field {
                id
                name
              }
              ... on ProjectV2IterationField {
                id
                name
              }
            }
          }
        }
      }
    }
  `;

  const variables = { projectId };

  try {
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

    if (response.data.errors) {
      console.error("GraphQL ошибки:", response.data.errors);
      throw new Error("Ошибка GraphQL: " + response.data.errors[0]?.message);
    }

    const fields = response.data?.data?.node?.fields?.nodes;

    if (!fields) {
      console.error("Поля проекта не найдены или данные некорректны.");
      return [];
    }

    return fields;
  } catch (error) {
    console.error(
      "Ошибка при получении полей проекта:",
      error.response?.data || error.message
    );
    throw new Error("Не удалось получить поля проекта.");
  }
}

async function getComments(userToken, issueId) {
  const query = `
	query($issueId: ID!) {
	  node(id: $issueId) {
		... on ProjectV2Item {
		  content {
			... on Issue {
			  comments(first: 100) {
				nodes {
				  id
				  body
				  author {
					login
				  }
				  createdAt
				}
			  }
			}
		  }
		}
	  }
	}
  `;

  const variables = { issueId };

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

    // Проверяем, что node существует
    const node = response.data?.data?.node;

    if (!node || !node.content || !node.content.comments) {
      console.log(
        "Комментарии для задачи не найдены или задача не существует."
      );
      return [];
    }

    const comments = node.content.comments.nodes;

    return comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      user: {
        login: comment.author.login,
      },
      createdAt: comment.createdAt,
    }));
  } catch (error) {
    console.error(
      "Ошибка при получении комментариев с использованием GraphQL:",
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
              number
              repository {
                owner {
                  login
                }
                name
                isInOrganization
              }
              id
            }
            ... on DraftIssue {
              title
              body
            }
          }
          fieldValues(first: 50) {
            nodes {
              ... on ProjectV2ItemFieldValueCommon {
                field {
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                  }
                  ... on ProjectV2Field {
                    id
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
              }
              ... on ProjectV2ItemFieldTextValue {
                text
              }
              ... on ProjectV2ItemFieldDateValue {
                date
              }
              ... on ProjectV2ItemFieldNumberValue {
                number
              }
              ... on ProjectV2ItemFieldIterationValue {
                title
                duration
              }
            }
          }
          project {
            number
          }
        }
      }
    }
  `;

  const variables = { taskId };

  try {
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

    if (response.data.errors) {
      console.error("GraphQL ошибки:", response.data.errors);
      throw new Error("Ошибка GraphQL: " + response.data.errors[0]?.message);
    }

    const taskData = response.data?.data?.node;

    if (!taskData) {
      console.error("Задача не найдена. taskId:", taskId);
      throw new Error("Задача не найдена.");
    }

    const issue = taskData.content;

    const fields = taskData.fieldValues.nodes.map((fieldValue) => {
      const fieldName = fieldValue?.field?.name || "Unknown";
      let value;

      if (fieldValue.name) value = fieldValue.name; // SingleSelect
      else if (fieldValue.text) value = fieldValue.text; // Text field
      else if (fieldValue.date) value = fieldValue.date; // Date field
      else if (fieldValue.number) value = fieldValue.number; // Number field
      else if (fieldValue.title) value = fieldValue.title; // Iteration field
      else value = null;

      return { fieldName, value };
    });

    const assignees =
      issue?.assignees?.nodes?.map((assignee) => assignee.login).join(", ") ||
      "Не назначен";

    const projectNumber = taskData.project?.number || "Unknown";

    // Определяем ссылку на основе isInOrganization
    const ownerType = issue?.repository?.isInOrganization ? "orgs" : "users";
    const customUrl = issue?.repository
      ? `https://github.com/${ownerType}/${issue.repository.owner.login}/projects/${projectNumber}/views/1?pane=issue&itemId=${taskData.id}&issue=${issue.repository.owner.login}%7C${issue.repository.name}%7C${issue.number}`
      : issue?.url;

    const taskDetails = {
      id: taskData.id,
      title: issue?.title || "Без названия",
      body: issue?.body || "Нет описания",
      url: customUrl,
      createdAt: issue?.createdAt || null,
      updatedAt: issue?.updatedAt || null,
      assignees,
      fields,
    };

    return taskDetails;
  } catch (error) {
    console.error(
      "Ошибка при получении данных о задаче:",
      error.response?.data || error.message
    );
    throw new Error("Не удалось получить данные о задаче.");
  }
}

export {
  getRepositories,
  getTasks,
  getComments,
  getProjectsV2,
  getTaskDetails,
  getProjectFields,
};
