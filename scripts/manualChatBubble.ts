import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";
import { createChatBubble } from "../src/services/chatBubble";
import { MessageEntity } from "grammy/types";
import {
  fmt,
  bold,
  italic,
  underline,
  code,
  strikethrough,
  pre,
  link,
  spoiler,
} from "@grammyjs/parse-mode";

interface Sample {
  fileName: string;
  text: string;
  name: string;
  time: number;
  profileTheme: { accent: number; photo?: ArrayBuffer };
  adminTitle?: string;
  entities?: MessageEntity[];
}

const now = Math.floor(Date.now() / 1000);

async function createSolidPngBuffer(
  width: number,
  height: number,
  color: { r: number; g: number; b: number; alpha?: number },
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: {
        r: color.r,
        g: color.g,
        b: color.b,
        alpha: color.alpha ?? 1,
      },
    },
  })
    .png()
    .toBuffer();
}

async function save(outputPath: string, data: Buffer) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, data);
}

async function main() {
  const outputDirArg = process.argv[2];
  const outputDir = outputDirArg
    ? resolve(outputDirArg)
    : resolve("./scripts/out");

  const profileImagePng = await createSolidPngBuffer(96, 96, {
    r: 230,
    g: 80,
    b: 80,
  });
  const photo = profileImagePng.buffer.slice(
    profileImagePng.byteOffset,
    profileImagePng.byteOffset + profileImagePng.byteLength,
  ) as ArrayBuffer;

  const lengthSamples: Sample[] = [];
  for (let i = 0; i < 15; i++) {
    lengthSamples.push({
      fileName: `length/L${i + 1}.webp`,
      text: "Test ".repeat(i + 1),
      name: "Alice",
      time: now,
      profileTheme: { accent: 5 },
      adminTitle: undefined,
    });
  }

  const formatted = fmt`Normal ${bold}bold${bold} ${italic}italic${italic} ${underline}underline${underline} ${strikethrough}strikethrough${strikethrough} ${code}code${code} ${link}link${link} ${pre}preformatted${pre} ${spoiler}spoiler${spoiler}`;

  const samples: Sample[] = [
    {
      fileName: "01-basic.webp",
      text: "Hello world 👋",
      name: "Alice",
      time: now,
      profileTheme: { accent: 5 },
      adminTitle: undefined,
    },
    {
      fileName: "02-admin.webp",
      text: "This is a longer message for manual visual validation.",
      name: "Bob",
      time: now - 3600,
      profileTheme: { accent: 2 },
      adminTitle: "admin",
    },
    {
      fileName: "03-photo.webp",
      text: "Profile photo branch ✅",
      name: "Charlie",
      time: now - 7200,
      profileTheme: { accent: 7, photo },
      adminTitle: undefined,
    },
    {
      fileName: "04-formatting.webp",
      text: formatted.text,
      name: "Dave",
      time: now - 10800,
      profileTheme: { accent: 3 },
      entities: formatted.entities,
    },
    {
      fileName: "05-longName.webp",
      text: "Testing long name handling",
      name: "Eve with a very long name that might cause issues",
      time: now - 14400,
      profileTheme: { accent: 1 },
    },
    ...lengthSamples,
  ] as const;

  for (const sample of samples) {
    const output = await createChatBubble(
      sample.text,
      sample.name,
      sample.time,
      sample.profileTheme,
      sample.adminTitle,
      sample.entities,
    );
    const outputPath = join(outputDir, sample.fileName);
    await save(outputPath, output);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
