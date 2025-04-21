import axios from "axios";
import sharp from "sharp";
import { BOT_NAME, TOKEN } from "./globals";
import emojiRegex from "emoji-regex";
import { File, Message } from "grammy/types";
import { Api, Context } from "grammy";

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
  ctx: Context,
): Promise<boolean> => {
  try {
    const chatMember = await ctx.getChatMember(userId);
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
  api: Api,
): Promise<ArrayBuffer> => {
  const fileLink = getFileLink(await api.getFile(fileId));
  const response = await axios({ url: fileLink, responseType: "arraybuffer" });

  return sharp(response.data)
    .resize(512, 512, { fit: "inside" })
    .webp({ lossless: true })
    .toBuffer();
};

export const getEmoji = (caption: string[]): string[] | undefined => {
  const regex = emojiRegex();
  const emojis: string[] = caption
    .filter((word) => regex.test(word))
    .slice(0, 1) // take only first emojis
    .flatMap((word) =>
      [...new Intl.Segmenter().segment(word)].map((x) => x.segment),
    )
    .slice(0, 20); // take max 20 emojis;
  return emojis.length >= 1 ? emojis : undefined;
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

export const isGroup = (msg: Message): boolean => {
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

export const getFileLink = (file: File): string => {
  if (file.file_path) {
    return `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
  }
  return "";
};

/**
 * Get profile picture of a user
 *
 * @param bot Telegram Bot
 * @param user user id
 * @returns ArrayBuffer of the profile picture and accent color id, or undefined
 */
export const getProfilePicture = async (
  api: Api,
  user: number,
): Promise<{ photo?: ArrayBuffer; accent: number } | undefined> => {
  try {
    const chat = await api.getChat(user);
    const accent = chat.accent_color_id;
    const fileID = chat.photo?.small_file_id;
    if (!fileID) {
      return { accent };
    }
    const link = getFileLink(await api.getFile(fileID));
    const response = await axios({ url: link, responseType: "arraybuffer" });
    return {
      photo: response.data,
      accent,
    };
  } catch {
    // Bot cannot fetch profile picture of group it's not in
    console.error("Bot cannot fetch profile picture of group it's not in");
    return;
  }
};

export const senderInfo = (
  message: Message,
): { senderID?: number; name?: string } => {
  // Check if message is forwarded
  const forward = message.forward_origin;
  if (forward) {
    switch (forward.type) {
      case "user":
        // Forwarded from user
        return {
          senderID: forward.sender_user.id,
          name: `${forward.sender_user.first_name ?? ""} ${forward.sender_user.last_name ?? ""}`,
        };
      case "chat":
        // Forwarded from chat
        return {
          senderID: forward.sender_chat.id,
          name: forward.sender_chat.title ?? "Unknown",
        };
      case "channel":
        // Forwarded from channel
        return {
          senderID: forward.chat.id,
          name: forward.chat.title ?? "Unknown",
        };
      case "hidden_user":
        // Forwarded from hidden user
        return {
          name: forward.sender_user_name,
        };
    }
  }
  // Message sent by user
  return {
    senderID: message.from?.id,
    name: `${message.from?.first_name ?? ""} ${message.from?.last_name ?? ""}`,
  };
};

export const adminTitle = async (
  ctx: Context,
  userID?: number,
): Promise<string | undefined> => {
  if (!userID) {
    return undefined;
  }
  try {
    const info = await ctx.getChatMember(userID);
    if (info.status === "administrator" || info.status === "creator") {
      const fallback = info.status === "creator" ? "owner" : "admin";
      return info.custom_title ?? fallback;
    }
    return undefined;
  } catch {
    console.error("Error fetching admin title");
    return undefined;
  }
};
