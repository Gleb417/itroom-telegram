import { Keyboard } from "grammy";

export async function setUserKeyboard(ctx, state) {
  let keyboard;

  if (state === "free") {
    keyboard = new Keyboard()
      .text("/auth")
      .text("/help")
      .row()
      .text("/project") // Добавляем команду /project
      .text("/other_command");
  } else if (state === "busy") {
    keyboard = new Keyboard().text("Завершить задачу").row();
  }

  await ctx.reply("Ваше текущее меню обновлено:", {
    reply_markup: { keyboard: keyboard.build(), resize_keyboard: true },
  });
}
