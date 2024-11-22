import axios from "axios";

export async function tokenHandler(ctx, chatTokens) {
  const token = ctx.message.text.trim();

  if (!token) {
    return ctx.reply("Введите валидный токен GitHub.");
  }

  try {
    // Проверяем токен через GitHub API
    const response = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const username = response.data.login;

    // Сохраняем токен в памяти
    chatTokens.set(ctx.chat.id, token);

    ctx.reply(`Токен успешно сохранен! Вы авторизованы как ${username}.`);
  } catch (error) {
    console.error("Ошибка проверки токена:", error.message);

    if (error.response && error.response.status === 401) {
      ctx.reply("Неверный токен. Попробуйте снова.");
    } else {
      ctx.reply("Произошла ошибка при проверке токена. Попробуйте позже.");
    }
  }
}
