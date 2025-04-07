import TelegramBot, { Message } from "node-telegram-bot-api";
import axios from "axios";
import sharp from "sharp";
import { BOT_NAME } from "./globals";
import emojiRegex from "emoji-regex";

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
  bot: TelegramBot,
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
  bot: TelegramBot,
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

export const getEmoji = (caption: string[]): string | undefined => {
  const regex = emojiRegex();
  const emojis: string[] = caption
    .filter((word) => regex.test(word))
    .slice(0, 1);
  return emojis.length >= 1 ? emojis.join("") : undefined;
};

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

/**
 * Parse Telegram message timestamp to HH:MM format
 *
 * @param timestamp Telegram message timestamp
 * @returns time in HH:MM format
 */
export const getTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Get profile picture of a user
 *
 * @param bot Telegram Bot
 * @param user user id
 * @returns ArrayBuffer of the profile picture (or undefined)
 */
export const getProfilePicture = async (
  bot: TelegramBot,
  user: number,
): Promise<ArrayBuffer | undefined> => {
  try {
    const chat = await bot.getChat(user);
    const fileID = chat.photo?.small_file_id;
    if (!fileID) {
      return;
    }
    const link = await bot.getFileLink(fileID);
    const response = await axios({ url: link, responseType: "arraybuffer" });
    return response.data;
  } catch {
    // Bot cannot fetch profile picture of group it's not in
    console.log("Bot cannot fetch profile picture of group it's not in");
    return;
  }
};

export const senderInfo = (
  message: Message,
): { senderID?: number; name?: string } => {
  if (message.forward_from_chat) {
    // Message forwarded from channel or anonymous group
    return {
      senderID: message.forward_from_chat.id,
      name: message.forward_from_chat.title ?? "Unknown",
    };
  } else if (message.forward_from) {
    // Message forwarded from user
    return {
      senderID: message.forward_from.id,
      name: `${message.forward_from.first_name ?? ""} ${message.forward_from.last_name ?? ""}`,
    };
  } else if (!message.from) {
    // No idea who sent this message
    return {};
  }
  // Message sent by user
  return {
    senderID: message.from.id,
    name: `${message.from.first_name ?? ""} ${message.from.last_name ?? ""}`,
  };
};
