import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import { JsonDB, Config } from "node-json-db";

// Secrets
dotenv.config();
const TOKEN = process.env.BOT_TOKEN ?? "";
const BOT_NAME = process.env.BOT_NAME ?? "";
//const STICKER_SET_NAME = `testipack_by_${BOT_NAME}`;
//const OWNER = Number(process.env.OWNER ?? "");

const bot = new TelegramBot(TOKEN, { polling: true });
const db = new JsonDB(new Config("database", true, true, "/"));

async function processImage(fileId: string): Promise<string> {
  const fileLink = await bot.getFileLink(fileId);
  const response = await axios({ url: fileLink, responseType: "arraybuffer" });
  const filePath = `./sticker.webp`;

  await sharp(response.data)
    .resize(512, 512, { fit: "inside" })
    .webp({ lossless: true })
    .toFile(filePath);

  return filePath;
}

bot.onText(/\/createPack/, async (msg) => {
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    if (!(await isUserAdmin(msg.chat.id, msg.from?.id ?? 0))) {
      bot.sendMessage(msg.chat.id, "Only group admins can use this command");
    }
    const id = msg.chat.id.toString().replace("-", "");
    const packName = `s_${id}_by_${BOT_NAME}`;
    try {
      bot.createNewStickerSet(
        msg.from?.id ?? 0,
        packName,
        msg.chat.title ?? packName,
        fs.createReadStream("./default.png"),
        "🔥"
      );
      db.push(`/groups/${id}`, msg.from?.id);
      bot.sendMessage(
        msg.chat.id,
        `Created pack: https://t.me/addstickers/${packName}`
      );
    } catch {
      bot.sendMessage(msg.chat.id, "Failed to create pack");
      return false;
    }
    const newSticker = (await bot.getStickerSet(packName)).stickers.at(-1);
    if (newSticker) {
      bot.sendSticker(msg.chat.id, newSticker.file_id);
    }
  }
});

bot.onText(/\/hello/, (msg) => {
  bot.sendMessage(msg.chat.id, "Hello there!");
});

bot.onText(/\/groupID/, (msg) => {
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    bot.sendMessage(msg.chat.id, `ID is ${msg.chat.id}`);
  }
});

// Listener for stickers/images
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const caption = msg.caption?.trim() ?? "";
  console.log(caption);

  if (!userId) return;

  // Only react in groups
  if (!(msg.chat.type == "group" || msg.chat.type === "supergroup")) {
    return;
  }

  const trimmedChatId = chatId.toString().replace("-", "");
  const packName = `s_${trimmedChatId}_by_${BOT_NAME}`;
  const packOwner = (await db.getData(
    `/groups/${trimmedChatId}`
  )) satisfies string;

  if (caption.startsWith("#stiku")) {
    const fileId = msg.photo?.pop()?.file_id || msg.sticker?.file_id;
    if (!fileId) return;

    try {
      const stickerPath = await processImage(fileId);
      await bot.addStickerToSet(
        packOwner,
        packName,
        fs.createReadStream(stickerPath),
        "🔥",
        "png_sticker"
      );

      await bot.sendMessage(chatId, "✅ Sticker added to the pack!");
      const newSticker = (await bot.getStickerSet(packName)).stickers.at(-1);
      if (newSticker) {
        bot.sendSticker(chatId, newSticker.file_id);
      }
    } catch (error) {
      console.error(error);
      await bot.sendMessage(
        chatId,
        "❌ Failed to add the sticker. Make sure the bot has permission."
      );
    }
  }
});

// Function to check if a user is an admin
async function isUserAdmin(chatId: number, userId: number): Promise<boolean> {
  try {
    const chatMember = await bot.getChatMember(chatId, userId);
    return ["administrator", "creator"].includes(chatMember.status);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false; // Assume not admin if error occurs
  }
}
