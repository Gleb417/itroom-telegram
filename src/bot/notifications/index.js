import bot from '../bot.js'
import db from '../../db/models/index.js'
import { formatCommentNotification } from './commentNotifications.js'
import { formatTaskNotification } from './taskNotifications.js'
import { formatStatusNotification } from './statusAction.js'

/**
 * Универсальная функция отправки уведомлений.
 * @param {string} type - Тип уведомления (`task`, `comment`, `status`).
 * @param {object} data - Данные уведомления.
 * @param {object} issue - Данные задачи (обязательно для комментариев).
 */
export async function notify(type, data, issue) {
	let message = ''

	if (type === 'task') {
		message = formatTaskNotification(data)
	} else if (type === 'comment') {
		message = formatCommentNotification(data, issue)
	} else if (type === 'status') {
		message = formatStatusNotification(data.action, issue)
	}

	// Собираем список назначенных пользователей
	const assignees = issue?.assignees || data.assignees

	if (!Array.isArray(assignees)) {
		console.error('Поле assignees не является массивом:', assignees)
		return
	}

	// Если список назначенных пуст
	if (assignees.length === 0) {
		console.log('Список назначенных пользователей пуст.')
		return
	}

	console.log(
		'Назначенные пользователи:',
		assignees.map(a => a.login)
	)

	// Обработка и отправка уведомлений каждому назначенному пользователю
	for (const assignee of assignees) {
		try {
			// Ищем пользователя в базе данных
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
}
