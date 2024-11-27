/**
 * Формирует сообщение о новом комментарии в задаче.
 * @param {object} comment - Данные комментария.
 * @param {object} issue - Данные задачи.
 * @returns {object} - Сформированное сообщение и ссылки на изображения.
 */
export function formatCommentNotification(comment, issue) {
	const { user, body, created_at } = comment

	// Регулярное выражение для поиска ссылок на изображения в комментарии
	const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g
	const imageUrls = []
	let match

	// Ищем все изображения в комментарии
	while ((match = imageRegex.exec(body)) !== null) {
		imageUrls.push(match[1]) // Извлекаем URL изображения
	}

	// Формируем текстовое сообщение
	const message =
		`💬 *Новый комментарий в задаче!*\n\n` +
		`*Задача:* [${issue.title}](${issue.html_url})\n` +
		`*Автор комментария:* ${user.login}\n` +
		`*Комментарий:* ${body.replace(imageRegex, '')}\n` +
		`*Дата комментария:* ${new Date(created_at).toLocaleString('ru-RU')}`

	// Если изображений нет, возвращаем только текстовое сообщение
	if (imageUrls.length === 0) {
		return { message, imageUrls: null } // imageUrls = null, так как изображений нет
	}

	// Если изображения есть, возвращаем сообщение и ссылки на изображения
	return { message, imageUrls }
}
