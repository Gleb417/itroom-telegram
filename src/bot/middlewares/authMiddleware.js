import axios from 'axios'
import { InlineKeyboard } from 'grammy'
import db from '../../db/models/index.js'

export async function tokenHandler(ctx, chatTokens, authState) {
	const chatId = ctx.chat.id
	const token = ctx.message.text.trim()

	if (!authState) {
		throw new Error('authState is not initialized.')
	}

	if (!authState.has(chatId)) {
		authState.set(chatId, { step: 0 })
	}

	if (!token) {
		return ctx.reply('Введите валидный токен GitHub.')
	}

	try {
		// Проверяем токен через GitHub API
		const response = await axios.get('https://api.github.com/user', {
			headers: { Authorization: `Bearer ${token}` },
		})

		const username = response.data.login

		// Сохраняем токен в базе данных
		let user = await db.User.findOne({ where: { telegram_id: chatId } })

		if (!user) {
			// Если пользователя нет, создаем его
			user = await db.User.create({
				telegram_id: chatId,
				github_username: username,
				github_token: token,
			})
		} else {
			// Если пользователь есть, обновляем токен
			user.github_token = token
			await user.save()
		}

		// Завершаем состояние ожидания
		chatTokens.set(chatId, token)
		authState.delete(chatId)

		ctx.reply(`Токен сохранен! Вы авторизованы как ${username}.`)
	} catch (error) {
		console.error('Ошибка проверки токена:', error.message)

		if (error.response?.status === 401) {
			const keyboard = new InlineKeyboard()
				.text('Попробовать снова', 'retry_auth')
				.row()
				.text('Отмена', 'cancel_auth')

			return ctx.reply('Неверный токен. Выберите действие:', {
				reply_markup: keyboard,
			})
		} else {
			return ctx.reply(
				'Произошла ошибка при проверке токена. Попробуйте позже.'
			)
		}
	}
}
