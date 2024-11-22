import { Bot } from 'grammy'
import { config } from '../utils/config.js'

// Создаем бота
const bot = new Bot(config.BOT_API_KEY)

// Запуск бота
bot.start()
console.log('Bot started.')

export default bot
