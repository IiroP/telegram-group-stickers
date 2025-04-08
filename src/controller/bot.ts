import TelegramBot, { Message } from "node-telegram-bot-api";
import {
  getAdminTitle,
  getEmoji,
  getProfilePicture,
  isGroup,
  isUserAdmin,
  senderInfo,
  stickerPackName,
} from "../utils/utils";
import {
  createStickerPack,
  sendStickerSetLastSticker,
  addStickerBufferAndNotify,
  addStickerIDAndNotify,
  logErrorAndNotify,
} from "../services/bot";
import { createChatBubble } from "../services/chatBubble";

export const createPackController = async (
  msg: TelegramBot.Message,
  bot: TelegramBot,
): Promise<void> => {
  // Only react in groups
  if (!isGroup(msg)) return;

  // Only admin user can create the pack
  const userId = msg.from?.id ?? 0;
  const chatId = msg.chat.id;
  if (!(await isUserAdmin(chatId, userId, bot))) {
    await bot.sendMessage(chatId, "Only group admins can use this command");
    return;
  }

  let packName = "";
  try {
    packName = await createStickerPack(bot, userId, msg.chat.title, chatId);
    await bot.sendMessage(
      chatId,
      `Created pack: https://t.me/addstickers/${packName}`,
    );
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, "Failed to create pack");
    return;
  }

  // Attempt to send the newly created sticker pack's last sticker
  await sendStickerSetLastSticker(bot, chatId, packName);
};

export const createStickerController = async (
  msg: TelegramBot.Message,
  bot: TelegramBot,
): Promise<void> => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  // Only proceed if we know the user ID and it's a group
  if (!userId || !isGroup(msg)) return;

  const captionWords = msg.caption?.split(" ") ?? [];
  const packName = stickerPackName(chatId);

  // Check if the #stiku tag is present
  if (captionWords.includes("#stiku")) {
    const fileId = msg.photo?.pop()?.file_id || msg.sticker?.file_id;
    if (!fileId) return;

    await addStickerIDAndNotify(
      bot,
      chatId,
      packName,
      fileId,
      getEmoji(captionWords) ?? "🖼️",
    );
  }
};

export const textStickerController = async (
  bot: TelegramBot,
  originalMessage: Message,
): Promise<void> => {
  // We work off the message being replied to
  const message = originalMessage.reply_to_message;
  if (!message) return;

  // If the replied-to message has a photo/sticker, treat it similarly
  // to the createStickerController logic:
  if (message.photo) {
    const chatId = message.chat.id;
    if (!isGroup(message)) return;

    const captionWords = message.caption?.split(" ") ?? [];
    const packName = stickerPackName(chatId);
    const fileId = message.photo?.pop()?.file_id || message.sticker?.file_id;
    if (!fileId) return;

    await addStickerIDAndNotify(
      bot,
      chatId,
      packName,
      fileId,
      getEmoji(captionWords) ?? "🖼️",
    );
    return;
  }

  // Otherwise, we assume it's text and attempt to create a chat bubble
  const { senderID, name } = senderInfo(message);
  const content = message.text;
  if (!content || !senderID || !name) return;

  const chatId = originalMessage.chat.id;
  const packName = stickerPackName(chatId);
  const time = message.date;
  const adminTitle = await getAdminTitle(chatId, senderID);

  try {
    const profilePic = await getProfilePicture(bot, senderID);
    // Create an image from a "chat bubble"
    const image = await createChatBubble(
      content,
      name,
      adminTitle ?? null,
      time,
      profilePic,
    );

    const originalMessageWords = originalMessage.text?.split(" ") ?? [];
    await addStickerBufferAndNotify(
      bot,
      chatId,
      packName,
      Buffer.from(image),
      getEmoji(originalMessageWords) ?? "🖼️",
    );
  } catch (error) {
    console.error(error);
    await logErrorAndNotify(bot, error, chatId);
  }
};
