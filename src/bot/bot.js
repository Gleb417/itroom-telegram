import { Bot } from 'grammy'
import { registerCommands } from './commands/index.js'
import { config } from '../utils/config.js'

// Создаем бота
const bot = new Bot(config.BOT_API_KEY)

const chatTokens = new Map()
const authState = new Set()
const userStates = new Map() // Состояния пользователей ("free" или "busy")

// Регистрация команд
registerCommands(bot, chatTokens, authState, userStates)

// Запуск бота
try {
	bot.start()
	console.log('Bot started.')
} catch {
	console.log('Error')
}
export default bot
