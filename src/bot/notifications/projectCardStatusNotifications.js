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

	// Формируем сообщение в формате Markdown
	return (
		`${statusAction}\n\n` + // Добавляем заголовок с изменением статуса
		`*Заголовок:* ${taskDetail.title}\n` + // Заголовок задачи
		`*Ссылка:* [Открыть задачу](${taskDetail.url})\n` + // Ссылка на задачу
		`*Старый статус:* ${getColorEmoji(from.color)} ${from.name}\n` + // Старый статус с эмодзи цвета
		`*Новый статус:* ${getColorEmoji(to.color)} ${to.name}\n` + // Новый статус с эмодзи цвета
		`*Дата изменения:* ${new Date(taskDetail.updatedAt).toLocaleString(
			'ru-RU'
		)}\n` // Дата изменения в локальном формате
	)
}
