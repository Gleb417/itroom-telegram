/**
 * Формирует сообщение об изменении статуса задачи.
 * @param {string} action - Тип действия (`closed` или `reopened`).
 * @param {object} issue - Данные задачи.
 * @returns {string} - Сформированное сообщение.
 */
export function formatStatusNotification(action, issue) {
	const { title, html_url, assignee, updated_at } = issue

	const statusAction =
		action === 'closed' ? '🔴 Задача закрыта!' : '🟢 Задача переоткрыта!'

	return (
		`${statusAction}\n\n` +
		`*Заголовок:* ${title}\n` +
		`*Ссылка:* [Открыть задачу](${html_url})\n` +
		`*Дата изменения:* ${new Date(updated_at).toLocaleString('ru-RU')}\n` +
		(assignee
			? `*Назначено на:* ${assignee.login}`
			: '*Назначено на:* Не указано')
	)
}
