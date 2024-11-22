import bot from './src/bot/bot.js'
import './src/bot/webhook.js' // Просто импортируем, чтобы сервер запустился

// Запуск бота
bot.start()
console.log('Bot and Webhook server started.')
