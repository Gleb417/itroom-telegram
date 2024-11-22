import { Bot } from "grammy";
import { authCommand } from "./commands/authCommand.js";
import { config } from "../utils/config.js";

// Создаем бота
const bot = new Bot(config.BOT_API_KEY);

// Регистрация команды /auth
bot.command("auth", authCommand);

// Запуск бота
bot.start();
console.log("Bot started.");
export default bot;
