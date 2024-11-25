import {
	authCommand,
	changeTokenCallback,
	handleNewToken,
} from './authCommand.js'
import { setUserKeyboard } from '../../utils/keyboard.js'
import { tokenHandler } from '../middlewares/authMiddleware.js'
import { cancelAuth } from './cancelAuth.js'
import { retryAuth } from './retryAuth.js'
import { helpCommand, addCommandDescription } from './helpCommand.js'

export function registerCommands(
	bot,
	chatTokens,
	authState = new Map(),
	userStates = new Map()
) {
	bot.command('help', helpCommand)
	// Команда /auth
	bot.command('auth', async ctx => {
		const userState = userStates.get(ctx.chat.id) || 'free'

		if (userState === 'busy') {
			return ctx.reply(
				'Вы находитесь в процессе выполнения задачи. Завершите текущую задачу, чтобы использовать команды.'
			)
		}

		await authCommand(ctx) // Вызываем логику авторизации
		userStates.set(ctx.chat.id, 'free') // Устанавливаем состояние пользователя как свободное
		await setUserKeyboard(ctx, 'free')
	})
	// Дополняем список доступных команд
	addCommandDescription(
		'/auth',
		'Авторизация через токен. Используйте эту команду, чтобы начать процесс авторизации.'
	)
	addCommandDescription('/help', 'Вывод списка доступных команд и их описания.')
	addCommandDescription(
		'/retry',
		'Попробовать повторить последний шаг авторизации (если доступно).'
	)
	addCommandDescription(
		'/cancel',
		'Отменить текущий процесс авторизации или выполнения задачи.'
	)
	// Обработка текстовых сообщений (например, токена)
	bot.on('message:text', async ctx => {
		const userState = userStates.get(ctx.chat.id) || 'free'

		if (userState === 'busy') {
			return ctx.reply('Вы находитесь в процессе выполнения задачи.')
		}

		// Обрабатываем новый токен или сообщение
		if (ctx.session.awaitingToken) {
			await handleNewToken(ctx)
		} else {
			tokenHandler(ctx, chatTokens, authState)
		}
	})

	// Обработка inline-кнопок
	bot.on('callback_query:data', async ctx => {
		const action = ctx.callbackQuery.data

		if (action === 'cancel_auth') {
			cancelAuth(ctx, authState)
		} else if (action === 'retry_auth') {
			retryAuth(ctx)
		} else if (action === 'change_token') {
			await changeTokenCallback(ctx) // Обрабатываем изменение токена
		}

		await ctx.answerCallbackQuery() // Убираем индикатор загрузки на кнопке
	})

	// Инициализация состояния пользователя
	bot.on('message', async ctx => {
		if (!userStates.has(ctx.chat.id)) {
			userStates.set(ctx.chat.id, 'free') // Устанавливаем начальное состояние как "свободен"
			await setUserKeyboard(ctx, 'free')
		}
	})
}
