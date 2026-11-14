import {
  adminTitle,
  getActivePack,
  getEmoji,
  getProfilePicture,
  isGroup,
  isPrivate,
  isUserAdmin,
  MAX_STICKERS_PER_PACK,
  messageFromExternalReply,
  senderInfo,
} from "../utils/utils";
import {
  createStickerFromBuffer,
  createStickerFromID,
  createStickerPack,
  rotateStickerPack,
} from "../services/bot";
import { createChatBubble } from "../services/chatBubble";
import { Context, GrammyError } from "grammy";
import { Message } from "grammy/types";
import { DataError } from "node-json-db";

export const createPackController = async (ctx: Context) => {
  const msg = ctx.message;
  // Only react in groups
  if (!msg || !isGroup(msg)) {
    if (msg && isPrivate(msg)) {
      await ctx.reply(
        "This command can only be used in groups. Please use it in a group chat.",
      );
    }
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
    if (error instanceof GrammyError) {
      if (error.description.includes("PEER_ID_INVALID")) {
        await ctx.reply(
          "You haven't authorized the bot yet. Send start command to the bot with DM to authorize it.",
        );
        return;
      }
    }
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

export const rotatePackController = async (ctx: Context) => {
  const msg = ctx.message;
  // Only react in groups
  if (!msg || !isGroup(msg)) {
    if (msg && isPrivate(msg)) {
      await ctx.reply(
        "This command can only be used in groups. Please use it in a group chat.",
      );
    }
    return;
  }
  if (!(await isUserAdmin(msg.chat.id, msg.from.id, ctx))) {
    await ctx.reply("Only group admins can use this command");
    return;
  }

  let packName = "";
  try {
    const active = await getActivePack(msg.chat.id);
    const total = (await ctx.api.getStickerSet(active.name)).stickers.length;
    if (total < MAX_STICKERS_PER_PACK) {
      await ctx.reply(
        `The current pack is not full yet (${total}/${MAX_STICKERS_PER_PACK}).`,
      );
      return;
    }
    packName = await rotateStickerPack(
      ctx,
      msg.from.id,
      msg.chat.title,
      msg.chat.id,
    );
    await ctx.reply(`Created new pack: https://t.me/addstickers/${packName}`);
  } catch (error) {
    console.error(error);
    if (
      error instanceof GrammyError &&
      error.description.includes("PEER_ID_INVALID")
    ) {
      await ctx.reply(
        "You haven't authorized the bot yet. Send start command to the bot with DM to authorize it.",
      );
      return;
    }
    if (error instanceof DataError) {
      await ctx.reply(
        "Pack not found. Please create a pack first using /createPack.",
      );
      return;
    }
    await ctx.reply("Failed to create pack");
    return;
  }
  try {
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

  if (caption.indexOf("#stiku") >= 0) {
    const fileId = msg.photo?.pop()?.file_id || msg.sticker?.file_id;
    if (!fileId) {
      console.error("No fileId found");
      return;
    }

    try {
      const packName = await createStickerFromID(
        ctx.api,
        fileId,
        chatId,
        getEmoji(caption) ?? ["🖼️"],
      );
      const newSticker = (await ctx.api.getStickerSet(packName)).stickers.at(
        -1,
      );
      if (newSticker) {
        await ctx.replyWithSticker(newSticker.file_id);
      } else {
        await ctx.reply("❌ Something went wrong when creating the sticker.");
      }
    } catch (error) {
      handleError(ctx, error);
    }
  }
};

export const textStickerController = async (ctx: Context) => {
  const message =
    ctx.message?.reply_to_message ?? messageFromExternalReply(ctx.message);
  if (message?.photo || message?.sticker) {
    await createStickerController(ctx, message);
    return;
  }

  const caption = ctx.message?.text?.split(" ") ?? [];
  if (!message) {
    return;
  }

  const content = message.text ?? message.caption;
  const entities = message.entities ?? message.caption_entities;
  const { senderID, name } = senderInfo(message);
  const chatId = ctx.chat?.id;
  const title = await adminTitle(ctx, senderID);

  if (!content || !name || !chatId) {
    return;
  }
  const time = message.date;

  try {
    const profileTheme = senderID
      ? await getProfilePicture(ctx.api, senderID)
      : undefined;
    const image = await createChatBubble(
      content,
      name,
      time,
      profileTheme,
      title,
      entities,
    );
    const packName = await createStickerFromBuffer(
      ctx.api,
      Buffer.from(image),
      chatId,
      getEmoji(caption) ?? ["🖼️"],
    );
    const newSticker = (await ctx.api.getStickerSet(packName)).stickers.at(-1);
    if (newSticker) {
      await ctx.replyWithSticker(newSticker.file_id);
    } else {
      await ctx.reply("❌ Something went wrong when creating the sticker.");
    }
  } catch (error) {
    handleError(ctx, error);
  }
};

const handleError = async (ctx: Context, error: unknown) => {
  console.error(error);
  // Handle errors from DB
  if (error instanceof DataError) {
    await ctx.reply(
      "Pack not found. Please create a pack first using /createPack.",
    );
    return;
  }
  // Handle errors from Telegram API
  if (error instanceof GrammyError) {
    if (error.description.includes("STICKERS_TOO_MUCH")) {
      await ctx.reply(
        "The sticker pack is full. A group admin can create a new one with /rotatePack.",
      );
      return;
    }
    await ctx.reply(`Something went wrong. Error code: ${error.description}`);
    return;
  }
  // Other errors
  await ctx.reply("Unknown error, please try again later.");
};

export const packStatus = async (ctx: Context) => {
  const msg = ctx.message;
  // Only react in groups
  if (!msg || !isGroup(msg)) {
    if (msg && isPrivate(msg)) {
      await ctx.reply(
        "This command can only be used in groups. Please use it in a group chat.",
      );
    }
    return;
  }

  const chatId = ctx.chat?.id;
  if (!chatId) {
    return;
  }

  // Get pack statistics
  try {
    const { name } = await getActivePack(chatId);
    const stickerSet = await ctx.api.getStickerSet(name);
    const totalStickers = stickerSet.stickers.length;
    await ctx.reply(`Stickers: ${totalStickers}/${MAX_STICKERS_PER_PACK}`);
  } catch (error) {
    await handleError(ctx, error);
  }
};

//TODO: Refactor this file as there is a lot of repeated code
