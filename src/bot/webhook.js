app.post('/webhook', async (req, res) => {
	const { action, issue, comment } = req.body
	if (action === 'opened' || action === 'assigned') {
		await notifyNewTask(issue)
	} else if (action === 'comment_created') {
		await notifyNewComment(comment)
	}
	res.sendStatus(200)
})
