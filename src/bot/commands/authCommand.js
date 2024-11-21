bot.command('auth', async ctx => {
	const token = ctx.message.text.split(' ')[1]
	if (!token) return ctx.reply('Пожалуйста, предоставьте токен.')
	await dbService.saveToken(ctx.from.id, token)
	ctx.reply('✅ Авторизация прошла успешно!')
})
