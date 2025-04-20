import {
  getEmoji,
  getProfilePicture,
  isGroup,
  isUserAdmin,
  senderInfo,
  stickerPackName,
} from "../utils/utils";
import {
  createStickerFromBuffer,
  createStickerFromID,
  createStickerPack,
} from "../services/bot";
import { createChatBubble } from "../services/chatBubble";
import { Context } from "grammy";
import { Message } from "grammy/types";

export const createPackController = async (ctx: Context) => {
  const msg = ctx.message;
  // Only react in groups
  if (!msg || !isGroup(msg)) {
    return;
  }
  // Only admin user can create the pack
  if (!(await isUserAdmin(msg.chat.id, msg.from.id, ctx))) {
    await ctx.reply("Only group admins can use this command");
    return;
  }

  let packName = "";
  try {
    packName = await createStickerPack(
      ctx,
      msg.from?.id ?? 0,
      msg.chat.title,
      msg.chat.id,
    );
    await ctx.reply(`Created pack: https://t.me/addstickers/${packName}`);
  } catch (error) {
    console.error(error);
    await ctx.reply("Failed to create pack");
    return;
  }
  try {
    // If success, send the new sticker
    const newSticker = (await ctx.api.getStickerSet(packName)).stickers.at(-1);
    if (newSticker) {
      await ctx.replyWithSticker(newSticker.file_id);
    }
  } catch (error) {
    console.error(error);
  }
};

export const createStickerController = async (
  ctx: Context,
  replyMessage?: Message,
) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const caption =
    ctx.message?.caption?.split(" ") ?? ctx.message?.text?.split(" ") ?? [];
  const msg = replyMessage ?? ctx.message;

  if (!userId || !chatId || !msg || !ctx.message) {
    console.error("Missing userId, chatId, or message");
    return;
  }

  // Only react in groups
  if (!isGroup(ctx.message)) {
    console.error("Not a group");
    return;
  }

  const packName = stickerPackName(chatId);

  if (caption.indexOf("#stiku") >= 0) {
    const fileId = msg.photo?.pop()?.file_id || msg.sticker?.file_id;
    if (!fileId) {
      console.error("No fileId found");
      return;
    }

    try {
      await createStickerFromID(
        ctx.api,
        fileId,
        packName,
        chatId,
        getEmoji(caption) ?? ["🖼️"],
      );
      await ctx.reply("✅ Sticker added to the pack!");
      const newSticker = (await ctx.api.getStickerSet(packName)).stickers.at(
        -1,
      );
      if (newSticker) {
        await ctx.replyWithSticker(newSticker.file_id);
      }
    } catch (error) {
      console.error(error);
      await ctx.reply(
        "❌ Failed to add the sticker. Make sure the bot has permission.",
      );
    }
  }
};

export const textStickerController = async (ctx: Context) => {
  const message = ctx.message?.reply_to_message;
  if (message?.photo || message?.sticker) {
    await createStickerController(ctx, message);
    return;
  }

  const caption = ctx.message?.text?.split(" ") ?? [];
  if (!message) {
    return;
  }

  const content = message.text;
  const { senderID, name } = senderInfo(message);
  const chatId = ctx.chat?.id;

  if (!content || !name || !chatId) {
    return;
  }
  const packName = stickerPackName(chatId);
  const time = message.date;

  try {
    const profileTheme = senderID
      ? await getProfilePicture(ctx.api, senderID)
      : undefined;
    const image = await createChatBubble(content, name, time, profileTheme);
    await createStickerFromBuffer(
      ctx.api,
      Buffer.from(image),
      packName,
      chatId,
      getEmoji(caption) ?? ["🖼️"],
    );
    await ctx.reply("✅ Sticker added to the pack!");
    const newSticker = (await ctx.api.getStickerSet(packName)).stickers.at(-1);
    if (newSticker) {
      await ctx.replyWithSticker(newSticker.file_id);
    }
  } catch (error) {
    console.error(error);
    await ctx.reply(
      "❌ Failed to add the sticker. Make sure the bot has permission.",
    );
  }
};

//TODO: Refactor this file as there is a lot of repeated code
