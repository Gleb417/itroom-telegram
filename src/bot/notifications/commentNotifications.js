/**
 * Формирует сообщение о новом комментарии в задаче.
 * @param {object} comment - Данные комментария.
 * @param {object} issue - Данные задачи.
 * @returns {object} - Сформированное сообщение и массив ссылок на изображения.
 */
export function formatCommentNotification(comment, issue) {
	const { user, body, created_at } = comment

	// Регулярное выражение для поиска ссылок на изображения
	const imageRegex = /!\[.*?\]\((.*?)\)/g
	const images = []
	let match

	// Извлекаем ссылки на изображения
	while ((match = imageRegex.exec(body)) !== null) {
		images.push(match[1])
	}

	// Формируем текстовое сообщение
	const message =
		`💬 *Новый комментарий в задаче!*\n\n` +
		`*Задача:* [${issue.title}](${issue.html_url})\n` +
		`*Автор комментария:* ${user.login}\n` +
		`*Комментарий:* ${body.replace(imageRegex, '').trim() || 'Без текста'}\n` +
		`*Дата комментария:* ${new Date(created_at).toLocaleString('ru-RU')}`

	return { message, images }
}
