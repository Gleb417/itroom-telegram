import { Bot } from "grammy";
import { authCommand } from "./commands/authCommand.js";
import { config } from "../utils/config.js";
import { tokenHandler } from "./commands/tokenHandler.js";

// Создаем бота
const bot = new Bot(config.BOT_API_KEY);

const chatTokens = new Map();

// Регистрация команд
bot.command("auth", (ctx) => authCommand(ctx, chatTokens));
bot.on("message:text", (ctx) => tokenHandler(ctx, chatTokens));

// Запуск бота
bot.start();
console.log("Bot started.");
export default bot;
