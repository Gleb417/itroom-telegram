async function notifyNewTask(issue) {
	const { title, html_url, assignee, due_date } = issue
	if (assignee) {
		await bot.api.sendMessage(
			assignee.telegramId,
			`🆕 Новая задача: *${title}*\nСсылка: [Открыть задачу](${html_url})\nДедлайн: ${
				due_date || 'Не указан'
			}`
		)
	}
}
