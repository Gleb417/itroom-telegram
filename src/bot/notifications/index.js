// notifications/index.js
import bot from '../bot.js'
import db from '../../db/models/index.js'
import { formatCommentNotification } from './commentNotifications.js'
import { formatTaskNotification } from './taskNotifications.js'
import { formatStatusNotification } from './statusAction.js'
import { formatProjectCardStatusNotification } from './projectCardStatusNotifications.js'

export const eventHandlers = {
	issues: async payload => {
		const { action, issue } = payload
		if (action === 'opened') {
			return formatTaskNotification(issue)
		} else if (['closed', 'reopened'].includes(action)) {
			return formatStatusNotification(action, issue)
		}
		return null
	},
	issue_comment: async payload => {
		if (payload.action === 'created') {
			return formatCommentNotification(payload.comment, payload.issue)
		}
		return null
	},
	projects_v2_item: async payload => {
		const { changes } = payload
		if (
			payload.action === 'edited' &&
			changes?.field_value?.field_name === 'Status'
		) {
			const { from, to } = changes.field_value
			return formatProjectCardStatusNotification(payload.action, from, to)
		}
		return null
	},
	// Добавляйте другие обработчики по мере необходимости...
}

/**
 * Универсальная функция обработки уведомлений.
 * @param {string} event - Тип события.
 * @param {object} payload - Данные, переданные с вебхуком.
 */
export async function notify(event, payload) {
	const handler = eventHandlers[event]
	if (!handler) {
		console.warn(`Обработчик для события "${event}" не найден.`)
		return
	}

	const message = await handler(payload)
	if (!message) {
		console.log(`Для события "${event}" сообщение не требуется.`)
		return
	}

	// Логика отправки сообщения
	const assignees = payload.issue?.assignees || payload.assignees || []
	if (!Array.isArray(assignees) || assignees.length === 0) {
		console.log('Список назначенных пользователей пуст.')
		return
	}

	for (const assignee of assignees) {
		try {
			const user = await db.User.findOne({
				where: { github_username: assignee.login },
			})
			if (user && user.telegram_id) {
				await bot.api.sendMessage(user.telegram_id, message, {
					parse_mode: 'Markdown',
				})
				console.log(
					`Уведомление отправлено: Telegram ID: ${user.telegram_id}, GitHub Username: ${assignee.login}`
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
