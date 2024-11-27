// Импорт необходимых модулей
import express from 'express' // Для создания сервера
import { notify } from './notifications/index.js' // Функция уведомлений для обработки событий
const app = express()
const PORT = 3001

// Массив для хранения данных о полученных событиях Webhook
let webhookData = []
const MAX_EVENTS = 1 // Максимальное количество событий для хранения

// Middleware для обработки JSON-данных в теле запросов
app.use(express.json())

/**
 * Endpoint для обработки Webhook событий.
 * GitHub отправляет POST-запросы с данными о событиях, которые мы обрабатываем.
 */
app.post('/webhook', async (req, res) => {
	// Чтение типа события из заголовка запроса
	const event = req.headers['x-github-event'] // Например, "issues", "push", "projects_v2_item"
	// Получение полезной нагрузки (payload) из тела запроса
	const payload = req.body

	// Логирование события в консоль
	console.log(`Получено событие: ${event}`)

	// Добавляем новые данные о событии в массив webhookData
	webhookData.push({
		event,
		payload,
		timestamp: new Date(), // Сохраняем время получения события
	})

	// Если количество событий превышает MAX_EVENTS, удаляем старые данные
	if (webhookData.length > MAX_EVENTS) {
		webhookData.shift() // Удаляем самый старый элемент (первый в массиве)
	}

	try {
		// Передаем событие и его данные в обработчик уведомлений
		await notify(event, payload)

		// Возвращаем ответ с HTTP-статусом 200, чтобы подтвердить успешную обработку
		res.status(200).send('Webhook обработан.')
	} catch (error) {
		// Логируем ошибку обработки вебхука
		console.error('Ошибка обработки вебхука:', error)

		// Возвращаем ошибку с HTTP-статусом 500
		res.status(500).send('Ошибка сервера.')
	}
})

/**
 * Endpoint для просмотра сохраненных данных о событиях Webhook.
 * Полезно для отладки и мониторинга полученных событий.
 */
app.get('/webhook-data', (req, res) => {
	// Возвращаем массив webhookData в формате JSON
	res.status(200).json(webhookData)
})

// Запуск сервера на указанном порту
app.listen(PORT, () => {
	console.log(`Сервер запущен на http://localhost:${PORT}`)
})
