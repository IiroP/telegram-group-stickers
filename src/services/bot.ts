import {
  getActivePack,
  processImage,
  stickerPackName,
  trimChatID,
} from "../utils/utils";
import { db } from "../utils/globals";
import { Api, Context, InputFile } from "grammy";

/** @returns Name of the pack the sticker was added to */
export const createStickerFromID = async (
  api: Api,
  fileId: string,
  chatID: number,
  emojis: string[],
): Promise<string> => {
  const stickerBuffer = Buffer.from(await processImage(fileId, api));
  const { name, owner } = await getActivePack(chatID);
  await api.addStickerToSet(owner, name, {
    sticker: new InputFile(stickerBuffer),
    emoji_list: emojis,
    format: "static",
  });
  return name;
};

/** @returns Name of the pack the sticker was added to */
export const createStickerFromBuffer = async (
  api: Api,
  buffer: Buffer,
  chatID: number,
  emojis: string[],
): Promise<string> => {
  const { name, owner } = await getActivePack(chatID);
  await api.addStickerToSet(owner, name, {
    sticker: new InputFile(buffer),
    emoji_list: emojis,
    format: "static",
  });
  return name;
};

const createPack = async (
  ctx: Context,
  owner: number,
  title: string,
  chatID: number,
  index: number,
): Promise<string> => {
  const packName = stickerPackName(chatID, index);
  await ctx.api.createNewStickerSet(owner, packName, title, [
    {
      sticker: new InputFile("./default.png"),
      format: "static",
      emoji_list: ["🖼️"],
    },
  ]);
  const trimmedChatId = trimChatID(chatID);
  await db.push(`/groups/${trimmedChatId}`, owner);
  await db.push(`/packs/${trimmedChatId}`, { name: packName, owner, index });
  return packName;
};

export const createStickerPack = async (
  ctx: Context,
  owner: number,
  title: string | undefined,
  chatID: number,
): Promise<string> =>
  createPack(ctx, owner, title ?? trimChatID(chatID), chatID, 1);

/** Creates the next pack of the group and makes it the active one */
export const rotateStickerPack = async (
  ctx: Context,
  owner: number,
  title: string | undefined,
  chatID: number,
): Promise<string> => {
  const { index } = await getActivePack(chatID);
  const next = index + 1;
  // Telegram limits pack titles to 64 characters
  const packTitle = `${title ?? trimChatID(chatID)} ${next}`.slice(0, 64);
  return createPack(ctx, owner, packTitle, chatID, next);
};
