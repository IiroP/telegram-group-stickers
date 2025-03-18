import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import sharp from "sharp";
import { BOT_NAME } from "./globals";
import "emoji-regex";

/**
 * Check if user is admin in selected group
 *
 * @param chatId Chat ID
 * @param userId User ID
 * @param bot Bot (that is in the group)
 * @returns Boolean result
 */
export const isUserAdmin = async (
  chatId: number,
  userId: number,
  bot: TelegramBot
): Promise<boolean> => {
  try {
    const chatMember = await bot.getChatMember(chatId, userId);
    return ["administrator", "creator"].includes(chatMember.status);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false; // Assume not admin if error occurs
  }
};

/**
 * Convert image to sticker format (webp within 512x512 square)
 *
 * @param fileId
 * @returns
 */
export const processImage = async (
  fileId: string,
  bot: TelegramBot
): Promise<string> => {
  const fileLink = await bot.getFileLink(fileId);
  const response = await axios({ url: fileLink, responseType: "arraybuffer" });
  const filePath = `./sticker.webp`;

  await sharp(response.data)
    .resize(512, 512, { fit: "inside" })
    .webp({ lossless: true })
    .toFile(filePath);

  return filePath;
};

export const getEmoji = (caption: string[]): string|undefined => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const emojiRegex = require('emoji-regex');
  const regex = emojiRegex();
  const emojis: string[] = caption.filter((word) => regex.test(word)).slice(0, 1);
  return (emojis.length >= 1) ? emojis.join("") : undefined
}

/**
 * Generates sticker pack name based on group ID
 *
 * @param group Group ID as it comes from API
 * @returns Sticker pack name
 */
export const stickerPackName = (group: number): string => {
  const trimmedID = trimChatID(group);
  return `s_${trimmedID}_by_${BOT_NAME}`;
};

/**
 * Trims group ID for sticker pack name
 *
 * @param chatID Group ID as it comes from API
 * @returns Trimmed ID
 */
export const trimChatID = (chatID: number): string => {
  return chatID.toString().replace("-", "");
};

export const isGroup = (msg: TelegramBot.Message): boolean => {
  return msg.chat.type == "group" || msg.chat.type === "supergroup";
};
