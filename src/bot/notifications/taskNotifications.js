import bot from '../bot.js'
import db from '../../db/models/index.js'

export async function notifyNewTask(issue) {
	const { title, html_url, assignee, created_at } = issue

	// Формируем сообщение
	const message =
		`🆕 *Новая задача создана!*\n\n` +
		`*Заголовок:* ${title}\n` +
		`*Ссылка:* [Открыть задачу](${html_url})\n` +
		`*Дата создания:* ${new Date(created_at).toLocaleString('ru-RU')}\n` +
		(assignee
			? `*Назначено на:* ${assignee.login}`
			: '*Назначено на:* Не указано')

	// Получаем всех пользователей из базы
	const users = await db.User.findAll()

	// Отправляем уведомления всем пользователям
	for (const user of users) {
		if (user.telegram_id) {
			// Отправляем сообщение в Telegram
			try {
				await bot.api.sendMessage(user.telegram_id, message, {
					parse_mode: 'Markdown',
				})
				console.log(
					`Уведомление отправлено пользователю Telegram ID: ${user.telegram_id}`
				)
			} catch (error) {
				console.error(
					`Ошибка при отправке уведомления пользователю Telegram ID: ${user.telegram_id}`,
					error
				)
			}
		}
	}
}
