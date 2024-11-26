// Импорт необходимых модулей
import bot from '../bot.js' // Telegram-бот для отправки уведомлений
import db from '../../db/models/index.js' // База данных пользователей
import { formatCommentNotification } from './commentNotifications.js' // Форматирование уведомлений для комментариев
import { formatTaskNotification } from './taskNotifications.js' // Форматирование уведомлений для задач
import { formatStatusNotification } from './statusAction.js' // Форматирование уведомлений для изменений статуса
import { formatProjectCardStatusNotification } from './projectCardStatusNotifications.js' // Форматирование уведомлений для карточек проекта
import { getTaskDetails } from '../../services/githubService.js' // Сервис для получения данных о задаче через GitHub API
import dotenv from 'dotenv' // Модуль для работы с переменными окружения

// Загрузка переменных окружения из файла .env
dotenv.config()

// Токен суперпользователя для авторизации в GitHub API
const userToken = process.env.BOT_API_SUPERUSER

// Обработчики событий, связанных с GitHub Webhooks
export const eventHandlers = {
	/**
	 * Обработка событий issues.
	 * @param {object} payload - Данные о событии.
	 * @returns {string|null} - Форматированное уведомление или null.
	 */
	issues: async payload => {
		const { action, issue } = payload
		if (action === 'opened') {
			return formatTaskNotification(issue)
		} else if (['closed', 'reopened'].includes(action)) {
			return formatStatusNotification(action, issue)
		}
		return null
	},

	/**
	 * Обработка событий issue_comment.
	 * @param {object} payload - Данные о событии.
	 * @returns {string|null} - Форматированное уведомление или null.
	 */
	issue_comment: async payload => {
		if (payload.action === 'created') {
			const notification = formatCommentNotification(
				payload.comment,
				payload.issue
			)
			return notification.message
		}
		return null
	},

	/**
	 * Обработка событий projects_v2_item.
	 * @param {object} payload - Данные о событии.
	 * @returns {string|null} - Форматированное уведомление или null.
	 */
	projects_v2_item: async payload => {
		const { action, projects_v2_item, changes } = payload

		// Обрабатываем только события с action = "edited"
		if (action !== 'edited') {
			console.log(
				`Событие projects_v2_item с action "${action}" не обрабатывается.`
			)
			return null
		}

		// Проверяем, что изменения касаются поля "Status"
		if (changes?.field_value?.field_name === 'Status') {
			const nodeId = projects_v2_item.node_id

			try {
				// Получение данных о задаче через GitHub API
				const taskDetail = await getTaskDetails(userToken, nodeId)
				const { from, to } = changes.field_value

				return formatProjectCardStatusNotification(action, from, to, taskDetail)
			} catch (error) {
				console.error('Ошибка получения данных задачи:', error)
				return null
			}
		}

		console.log('Изменения не касаются поля "Status".')
		return null
	},
	// Добавляйте другие обработчики событий по мере необходимости...
}

/**
 * Получение списка назначенных пользователей из события projects_v2_item.
 * @param {object} payload - Данные о событии.
 * @returns {array} - Список пользователей (логины).
 */
async function getNodeID(payload) {
	const nodeId = payload.projects_v2_item.node_id
	const taskDetail = await getTaskDetails(userToken, nodeId)
	const assigneesString = taskDetail.assignees
	// Преобразуем строку с логинами в массив
	const assignees = assigneesString.split(',').map(assignee => assignee.trim())

	return assignees
}

/**
 * Универсальная функция обработки уведомлений.
 * @param {string} event - Тип события.
 * @param {object} payload - Данные, переданные с вебхуком.
 */
export async function notify(event, payload) {
	// Получение обработчика для указанного типа события
	const handler = eventHandlers[event]
	let projectV2Assignees = []

	// Обработка специфичного события projects_v2_item
	if (event === 'projects_v2_item' && payload.action === 'edited') {
		projectV2Assignees = await getNodeID(payload)
	}

	// Если обработчик для события отсутствует, выводим предупреждение
	if (!handler) {
		console.warn(`Обработчик для события "${event}" не найден.`)
		return
	}

	// Формируем сообщение через обработчик
	let message = await handler(payload)
	if (!message) {
		console.log(`Для события "${event}" сообщение не требуется.`)
		return
	}

	// Проверяем, что message является строкой, а не объектом
	if (typeof message !== 'string') {
		console.log(`Ожидалась строка, но получен объект для события "${event}".`)
		return
	}

	// Если сообщение пустое, пропускаем его
	if (!message.trim()) {
		console.log(`Сообщение для события "${event}" пустое.`)
		return
	}

	// Определяем назначенных пользователей для уведомлений
	let assignees =
		payload.issue?.assignees || payload.assignees || projectV2Assignees

	// Если список пользователей представлен строками, преобразуем в объекты
	if (Array.isArray(assignees) && typeof assignees[0] === 'string') {
		assignees = assignees.map(username => ({ login: username }))
	}

	// Проверяем корректность массива назначенных пользователей
	if (!Array.isArray(assignees) || assignees.length === 0) {
		console.log('Список назначенных пользователей пуст.')
		return
	}

	// Отправка уведомлений каждому назначенному пользователю
	for (const assignee of assignees) {
		try {
			const user = await db.User.findOne({
				where: { github_username: assignee.login },
			})

			if (user && user.telegram_id) {
				// Если сообщение не пустое, отправляем
				await bot.api.sendMessage(user.telegram_id, message, {
					parse_mode: 'Markdown',
				})
				console.log(
					`Текстовое уведомление отправлено: Telegram ID: ${user.telegram_id}, GitHub Username: ${assignee.login}`
				)
			} else {
				console.log(
					`Пользователь ${assignee.login} не найден или не настроен Telegram ID.`
				)
			}
		} catch (error) {
			console.error(`Ошибка отправки уведомления для ${assignee.login}`, error)
		}
	}
}
