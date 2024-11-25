import express from 'express'
import { notify } from './notifications/index.js'

const app = express()
const PORT = 3001

// Переменная для хранения последнего полученного события
let lastWebhookData = null

// Middleware для обработки JSON
app.use(express.json())

// Endpoint для приема Webhook (POST)
app.post('/webhook', async (req, res) => {
	const event = req.headers['x-github-event'] // Тип события (например, "issues", "push")
	const payload = req.body

	// Сохраняем данные в переменную
	lastWebhookData = {
		event,
		payload,
	}

	console.log(`Получено событие: ${event}`)
	console.log('Данные сохранены.')

	// Обрабатываем события
	if (event === 'issues') {
		const { action, issue } = payload

		if (action === 'opened') {
			console.log('Новая задача создана!')
			await notify('task', issue) // Уведомление о новой задаче
		} else if (action === 'closed' || action === 'reopened') {
			console.log(`Задача ${action === 'closed' ? 'закрыта' : 'переоткрыта'}!`)
			await notify('status', { action }, issue) // Уведомление об изменении статуса
		}
	} else if (event === 'issue_comment' && payload.action === 'created') {
		console.log('Добавлен новый комментарий к задаче!')
		await notify('comment', payload.comment, payload.issue) // Уведомление о комментарии
	}

	// Ответ GitHub для подтверждения получения
	res.status(200).send('Webhook обработан.')
})

// Endpoint для отображения последнего полученного Webhook (GET)
app.get('/webhook', (req, res) => {
	if (lastWebhookData) {
		// Возвращаем данные в формате JSON
		res.json(lastWebhookData)
	} else {
		res.status(404).json({ message: 'Нет данных вебхука.' })
	}
})

// Запуск сервера
app.listen(PORT, () => {
	console.log(`Сервер запущен на http://localhost:${PORT}`)
})
