import TelegramBot from "node-telegram-bot-api";
import { processImage, stickerPackName, trimChatID } from "../utils/utils";
import fs from "fs";
import { db } from "../utils/globals";

export const createSticker = async (
  bot: TelegramBot,
  fileId: string,
  pack: string,
  chatID: number
) => {
  const stickerPath = await processImage(fileId, bot);
  const trimmedChatId = trimChatID(chatID);
  const owner = await db.getData(`/groups/${trimmedChatId}`);
  await bot.addStickerToSet(
    owner,
    pack,
    fs.createReadStream(stickerPath),
    "🔥",
    "png_sticker"
  );
};

export const createStickerPack = async (
  bot: TelegramBot,
  owner: number,
  title: string | undefined,
  chatID: number
): Promise<string> => {
  const trimmedChatId = trimChatID(chatID);
  const packName = stickerPackName(chatID);
  await bot.createNewStickerSet(
    owner,
    packName,
    title ?? trimmedChatId,
    fs.createReadStream("./default.png"),
    "🖼️"
  );
  await db.push(`/groups/${trimmedChatId}`, owner);
  return packName;
};
