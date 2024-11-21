import { config } from './config.js'
import { Bot } from 'grammy'
import dotenv from 'dotenv'
dotenv.config()

// Создаем экземпляр бота
const bot = new Bot(config.BOT_API_KEY)

// Обработчик команды /start
bot.command('start', ctx => {
	ctx.reply('Привет! Я твой новый бот.')
})

// Обработчик команды /help
bot.command('help', ctx => {
	ctx.reply('Напишите мне что-нибудь, и я отвечу!')
})

// Обработчик всех текстовых сообщений
bot.on('message', ctx => {
	ctx.reply(`Ты написал: ${ctx.message.text}`)
})

// Запуск бота
bot.start()
