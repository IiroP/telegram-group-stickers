import { Bot } from "grammy";
import { TOKEN } from "./utils/globals";
import {
  createPackController,
  createStickerController,
  textStickerController,
} from "./controller/bot";
import { isGroup } from "./utils/utils";

const bot = new Bot(TOKEN);

bot.command("createPack", async (ctx) => {
  createPackController(ctx);
});

bot.command("hello", (ctx) => {
  ctx.api.getUpdates({ offset: -1 });
  ctx.reply("Hello there!");
});

bot.command("groupID", (ctx) => {
  if (ctx.message && isGroup(ctx.message)) {
    ctx.reply(`ID is ${ctx.chat.id}`);
  }
});

bot.hears(/^#stiku/, (ctx) => {
  textStickerController(ctx);
});

// Listener for stickers/images
bot.on(":photo", async (ctx) => {
  createStickerController(ctx);
});

// Start the bot
bot.start();
console.log("Started the bot");
