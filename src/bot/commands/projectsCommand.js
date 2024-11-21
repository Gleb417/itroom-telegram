bot.command('projects', async ctx => {
	const projects = await githubService.getProjects(ctx.from.id)
	const buttons = projects.map(p => ({
		text: p.name,
		callback_data: `project_${p.id}`,
	}))
	ctx.reply('Ваши проекты:', { reply_markup: { inline_keyboard: [buttons] } })
})
