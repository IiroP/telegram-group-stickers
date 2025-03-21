import TelegramBot from "node-telegram-bot-api";
import { TOKEN } from "./utils/globals";
import {
  createPackController,
  createStickerController,
  textStickerController,
} from "./controller/bot";
import { isGroup } from "./utils/utils";

const bot = new TelegramBot(TOKEN, { polling: true });
console.log("Started the bot");

bot.onText(/^\/createPack$/, async (msg) => {
  createPackController(msg, bot);
});

bot.onText(/\/hello/, (msg) => {
  bot.getUpdates({ offset: -1 });
  bot.sendMessage(msg.chat.id, "Hello there!");
});

bot.onText(/\/groupID/, (msg) => {
  if (isGroup(msg)) {
    bot.sendMessage(msg.chat.id, `ID is ${msg.chat.id}`);
  }
});

bot.onText(/^#stiku/, (msg) => {
  textStickerController(bot, msg);
});

// Listener for stickers/images
bot.on("photo", async (msg) => {
  createStickerController(msg, bot);
});
