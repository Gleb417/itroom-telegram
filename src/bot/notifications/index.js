export async function notifyNewTask(issue) {
	const { title, html_url, assignee, due_date } = issue
	if (assignee) {
		console.log(
			`🆕 Новая задача: ${title}\nСсылка: ${html_url}\nДедлайн: ${
				due_date || 'Не указан'
			}`
		)
		// Отправьте сообщение через Telegram API или Bot API
	}
}

export async function notifyNewComment(comment, issue) {
	const { user, body } = comment
	console.log(
		`💬 Новый комментарий от ${user.login} в задаче "${issue.title}":\n${body}`
	)
	// Отправьте сообщение через Telegram API или Bot API
}
