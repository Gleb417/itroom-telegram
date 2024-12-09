/**
 * Формирует сообщение об изменении статуса элемента проекта.
 * @param {string} action - Тип действия (`edited`).
 * @param {object} from - Старый статус, содержит имя (`name`) и цвет (`color`).
 * @param {object} to - Новый статус, содержит имя (`name`) и цвет (`color`).
 * @param {object} taskDetail - Детали задачи, включая заголовок, URL и дату изменения.
 * @returns {string} - Сформированное сообщение в формате Markdown.
 */
export function formatProjectCardStatusNotification(
	action,
	from,
	to,
	taskDetail
) {
	// Проверяем тип действия: если `edited`, добавляем уведомление о смене статуса
	const statusAction = action === 'edited' ? '🔄 Статус задачи изменен!' : ''

	/**
	 * Функция для преобразования цвета в соответствующий эмодзи.
	 * @param {string} color - Название цвета (например, "red", "green").
	 * @returns {string} - Эмодзи, соответствующее цвету.
	 */
	const getColorEmoji = color => {
		// Словарь для сопоставления цвета с эмодзи
		const colorMap = {
			red: '🔴', // Красный
			green: '🟢', // Зеленый
			yellow: '🟡', // Желтый
			blue: '🔵', // Синий
			purple: '🟣', // Фиолетовый
			orange: '🟠', // Оранжевый
			gray: '⚪️', // Серый
		}
		// Преобразуем цвет в нижний регистр и ищем его в словаре
		// Если цвет не найден, возвращаем черное эмодзи (⚫️)
		return colorMap[color.toLowerCase()] || '⚫️'
	}

	// Преобразуем цвета из верхнего регистра в нижний
	const fromColor = from.color.toLowerCase()
	const toColor = to.color.toLowerCase()

	// Формируем сообщение
	const message =
		`${statusAction}\n\n` +
		`📌 *Задача:* [${taskDetail.title}](${taskDetail.url})\n` +
		`❌ *Старый статус:* ${getColorEmoji(fromColor)} ${from.name}\n` +
		`✅ *Новый статус:* ${getColorEmoji(toColor)} ${to.name}\n` +
		`📅 *Дата изменения:* ${new Date(taskDetail.updatedAt).toLocaleString(
			'ru-RU'
		)}`

	// Возвращаем сообщение в формате Markdown
	return { message }
}
