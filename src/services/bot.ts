import { processImage, stickerPackName, trimChatID } from "../utils/utils";
import { db } from "../utils/globals";
import { Api, Context, InputFile } from "grammy";

export const createStickerFromID = async (
  api: Api,
  fileId: string,
  pack: string,
  chatID: number,
  emojis: string[],
) => {
  const stickerBuffer = Buffer.from(await processImage(fileId, api));
  const trimmedChatId = trimChatID(chatID);
  const owner = await db.getData(`/groups/${trimmedChatId}`);
  await api.addStickerToSet(owner, pack, {
    sticker: new InputFile(stickerBuffer),
    emoji_list: emojis,
    format: "static",
  });
};

export const createStickerFromBuffer = async (
  api: Api,
  buffer: Buffer,
  pack: string,
  chatID: number,
  emojis: string[],
) => {
  const trimmedChatId = trimChatID(chatID);
  const owner = await db.getData(`/groups/${trimmedChatId}`);
  await api.addStickerToSet(owner, pack, {
    sticker: new InputFile(buffer),
    emoji_list: emojis,
    format: "static",
  });
};

export const createStickerPack = async (
  ctx: Context,
  owner: number,
  title: string | undefined,
  chatID: number,
): Promise<string> => {
  const trimmedChatId = trimChatID(chatID);
  const packName = stickerPackName(chatID);
  await ctx.api.createNewStickerSet(owner, packName, title ?? trimmedChatId, [
    {
      sticker: new InputFile("./default.png"),
      format: "static",
      emoji_list: ["🖼️"],
    },
  ]);
  await db.push(`/groups/${trimmedChatId}`, owner);
  return packName;
};
