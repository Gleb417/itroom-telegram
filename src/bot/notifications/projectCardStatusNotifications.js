/**
 * Формирует сообщение об изменении статуса элемента проекта.
 * @param {string} action - Тип действия (`edited`).
 * @param {object} from - Старый статус.
 * @param {object} to - Новый статус.
 * @returns {string} - Сформированное сообщение.
 */
export function formatProjectCardStatusNotification(action, from, to) {
	const statusAction = action === 'edited' ? '🔄 Статус задачи изменен!' : ''

	return (
		`${statusAction}\n\n` +
		`*Старый статус:* ${from.name} (${from.description})\n` +
		`*Новый статус:* ${to.name} (${to.description})\n` +
		`*Цвет старого статуса:* ${from.color}\n` +
		`*Цвет нового статуса:* ${to.color}`
	)
}
