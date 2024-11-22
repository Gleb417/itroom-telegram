export function cancelAuth(ctx, authState) {
  const chatId = ctx.chat.id;

  if (authState.has(chatId)) {
    authState.delete(chatId);
    return ctx.reply(
      "Процесс авторизации отменен. Если потребуется, введите команду /auth снова."
    );
  }

  ctx.reply("Вы не находитесь в процессе авторизации.");
}
