import bot from '../bot.js'
import db from '../../db/models/index.js'
import { formatCommentNotification } from './commentNotifications.js'
import { formatTaskNotification } from './taskNotifications.js'
import { formatStatusNotification } from './statusAction.js'
import { formatProjectCardStatusNotification } from './projectCardStatusNotifications.js'

/**
 * Универсальная функция отправки уведомлений.
 * @param {string} event - Тип события (например, 'issues', 'projects_v2_item').
 * @param {object} payload - Данные, переданные с вебхуком.
 */
export async function notify(event, payload) {
	let message = ''

	if (event === 'issues') {
		const { action, issue } = payload
		if (action === 'opened') {
			message = formatTaskNotification(issue)
		} else if (action === 'closed' || action === 'reopened') {
			message = formatStatusNotification(action, issue)
		}
	} else if (event === 'issue_comment' && payload.action === 'created') {
		message = formatCommentNotification(payload.comment, payload.issue)
	} else if (event === 'projects_v2_item' && payload.action === 'edited') {
		const { changes } = payload
		if (
			changes &&
			changes.field_value &&
			changes.field_value.field_name === 'Status'
		) {
			const { from, to } = changes.field_value
			message = formatProjectCardStatusNotification(payload.action, from, to)
		}
	}

	if (message) {
		// Собираем список назначенных пользователей (в случае задачи и комментариев)
		const assignees = payload.issue?.assignees || payload.assignees || []

		if (Array.isArray(assignees) && assignees.length > 0) {
			console.log(
				'Назначенные пользователи:',
				assignees.map(a => a.login)
			)

			// Отправка уведомлений каждому назначенному пользователю
			for (const assignee of assignees) {
				try {
					const user = await db.User.findOne({
						where: { github_username: assignee.login },
					})

					if (user && user.telegram_id) {
						// Отправка сообщения в Telegram
						await bot.api.sendMessage(user.telegram_id, message, {
							parse_mode: 'Markdown',
						})
						console.log(
							`Уведомление отправлено пользователю Telegram ID: ${user.telegram_id}, GitHub Username: ${assignee.login}`
						)
					} else {
						console.log(
							`Пользователь с GitHub username ${assignee.login} не найден или у него нет Telegram ID.`
						)
					}
				} catch (error) {
					console.error(
						`Ошибка при отправке уведомления пользователю GitHub username: ${assignee.login}`,
						error
					)
				}
			}
		} else {
			console.log('Список назначенных пользователей пуст.')
		}
	}
}
