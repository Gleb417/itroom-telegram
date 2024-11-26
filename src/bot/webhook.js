import express from 'express'
import { notify } from './notifications/index.js'

const app = express()
const PORT = 3001

// Массив для хранения данных о событиях
let webhookData = []

// Middleware для обработки JSON
app.use(express.json())

// Endpoint для обработки Webhook (POST)
app.post('/webhook', async (req, res) => {
	const event = req.headers['x-github-event'] // Тип события
	const payload = req.body

	console.log(`Получено событие: ${event}`)

	// Сохраняем полученные данные в массив
	webhookData.push({ event, payload, timestamp: new Date() })

	try {
		// Передаем данные в обработчик уведомлений
		await notify(event, payload)

		// Ответ GitHub для подтверждения получения
		res.status(200).send('Webhook обработан.')
	} catch (error) {
		console.error('Ошибка обработки вебхука:', error)
		res.status(500).send('Ошибка сервера.')
	}
})

// Endpoint для просмотра данных о событиях (GET)
app.get('/webhook-data', (req, res) => {
	// Возвращаем последние данные о событиях
	res.status(200).json(webhookData)
})

// Запуск сервера
app.listen(PORT, () => {
	console.log(`Сервер запущен на http://localhost:${PORT}`)
})
