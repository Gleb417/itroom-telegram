/**
 * Формирует сообщение об изменении статуса задачи.
 * @param {string} action - Тип действия (`closed` или `reopened`).
 * @param {object} issue - Данные задачи.
 * @returns {string} - Сформированное сообщение.
 */
export function formatStatusNotification(action, issue) {
	const { title, html_url, assignees, updated_at } = issue

	const statusAction =
		action === 'closed' ? '🔴 Задача закрыта!' : '🟢 Задача переоткрыта!'

	const assigneesText =
		assignees && assignees.length > 0
			? assignees.map(a => a.login).join(', ')
			: 'Не указано'

	return (
		`${statusAction}\n\n` +
		`*Заголовок:* ${title}\n` +
		`*Ссылка:* [Открыть задачу](${html_url})\n` +
		`*Дата изменения:* ${new Date(updated_at).toLocaleString('ru-RU')}\n` +
		`*Назначено на:* ${assigneesText}`
	)
}
