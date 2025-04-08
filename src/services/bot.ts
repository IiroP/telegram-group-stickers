import TelegramBot from "node-telegram-bot-api";
import { processImage, stickerPackName, trimChatID } from "../utils/utils";
import fs from "fs";
import { db } from "../utils/globals";

export const createStickerFromID = async (
  bot: TelegramBot,
  fileId: string,
  pack: string,
  chatID: number,
  emoji: string,
) => {
  const stickerPath = await processImage(fileId, bot);
  const trimmedChatId = trimChatID(chatID);
  const owner = await db.getData(`/groups/${trimmedChatId}`);
  await bot.addStickerToSet(
    owner,
    pack,
    fs.createReadStream(stickerPath),
    emoji,
    "png_sticker",
  );
  fs.unlinkSync(stickerPath);
};

export const createStickerFromBuffer = async (
  bot: TelegramBot,
  buffer: Buffer,
  pack: string,
  chatID: number,
  emoji: string,
) => {
  const trimmedChatId = trimChatID(chatID);
  const owner = await db.getData(`/groups/${trimmedChatId}`);
  await bot.addStickerToSet(owner, pack, buffer, emoji, "png_sticker");
};

export const createStickerPack = async (
  bot: TelegramBot,
  owner: number,
  title: string | undefined,
  chatID: number,
): Promise<string> => {
  const trimmedChatId = trimChatID(chatID);
  const packName = stickerPackName(chatID);
  await bot.createNewStickerSet(
    owner,
    packName,
    title ?? trimmedChatId,
    fs.createReadStream("./default.png"),
    "🖼️",
  );
  await db.push(`/groups/${trimmedChatId}`, owner);
  return packName;
};
export const sendStickerSetLastSticker = async (
  bot: TelegramBot,
  chatId: number,
  packName: string
): Promise<void> => {
  try {
    const stickerSet = await bot.getStickerSet(packName);
    const newSticker = stickerSet.stickers.at(-1);
    if (newSticker) {
      await bot.sendSticker(chatId, newSticker.file_id);
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Helper that adds a sticker (by file ID) to a given pack, notifies the user,
 * and sends the new sticker if successful.
 */
export const addStickerIDAndNotify = async (
  bot: TelegramBot,
  chatId: number,
  packName: string,
  fileId: string,
  emoji: string
): Promise<void> => {
  try {
    await createStickerFromID(bot, fileId, packName, chatId, emoji);
    await bot.sendMessage(chatId, "✅ Sticker added to the pack!");
    await sendStickerSetLastSticker(bot, chatId, packName);
  } catch (error) {
    console.error(error);
    await logErrorAndNotify(bot, error, chatId);
  }
}

/**
 * Helper that adds a sticker (from a Buffer) to a given pack, notifies the user,
 * and sends the new sticker if successful.
 */
export const addStickerBufferAndNotify = async (
  bot: TelegramBot,
  chatId: number,
  packName: string,
  buffer: Buffer,
  emoji: string
): Promise<void> => {
  try {
    await createStickerFromBuffer(bot, buffer, packName, chatId, emoji);
    await bot.sendMessage(chatId, "✅ Sticker added to the pack!");
    await sendStickerSetLastSticker(bot, chatId, packName);
  } catch (error) {
    await logErrorAndNotify(bot, error, chatId);
  }
}
export const logErrorAndNotify = async (
  bot: TelegramBot,
  error: unknown,
  chatId: number,
): Promise<void> => {
  console.error(error);
  await bot.sendMessage(
    chatId,
    "❌ Failed to add the sticker. Make sure the bot has permission."
  );
}
