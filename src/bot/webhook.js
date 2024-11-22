import express from 'express'
import { notifyNewTask } from './notifications/taskNotifications.js'

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
	if (event === 'issues' && payload.action === 'opened') {
		console.log('Новая задача создана!')
		// Вызываем функцию для уведомления о задаче
		await notifyNewTask(payload.issue)
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
