/**
 * Формирует сообщение о новом комментарии в задаче.
 * @param {object} comment - Данные комментария.
 * @param {object} issue - Данные задачи.
 * @returns {object} - Сформированное сообщение и ссылки на изображения.
 */
export function formatCommentNotification(comment, issue) {
	const { user, body, created_at } = comment

	// Формируем текстовое сообщение
	const message =
		`💬 *Новый комментарий в задаче!*\n\n` +
		`*Задача:* [${issue.title}](${issue.html_url})\n` +
		`*Автор комментария:* ${user.login}\n` +
		`*Комментарий:* ${body}\n` +
		`*Дата комментария:* ${new Date(created_at).toLocaleString('ru-RU')}`

	// Если изображения есть, возвращаем сообщение и ссылки на изображения
	return { message }
}
