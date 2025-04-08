import {Circle, FabricImage, FabricText, Rect, StaticCanvas, Textbox,} from "fabric/node";
import {randomAccent} from "../utils/colors";
import {getTime} from "../utils/utils";
import {dataUriToBuffer} from "data-uri-to-buffer";
import sharp from "sharp";

export const createChatBubble = async (
  text: string,
  name: string,
  admin_title: string | null,
  time: number,
  picture?: ArrayBuffer,
) => {
  console.log("createChatBubble");
  console.log("createChatBubble", name);
  console.log("createChatBubble", admin_title);
  console.log("createChatBubble", text);
  const profilePicRadius = 30;
  const padding = 5;
  const textBoxStart = 2 * profilePicRadius + 3 * padding;
  const fontFamily = "Roboto";
  const fullWidth = text.length > 50 ? 512 : 300;
  const boxWidth = fullWidth - textBoxStart - padding;
  const accent = randomAccent();

  const nameBox = new FabricText(name, {
    fontSize: 18,
    fill: accent,
    top: 3 * padding,
    left: textBoxStart + 2 * padding,
    fontFamily: fontFamily,
    fontStyle: "bold",
  });
  const box = new Textbox(text, {
    left: textBoxStart + 2 * padding,
    top: 4 * padding + nameBox.height,
    width: boxWidth - 3 * padding,
    fontSize: 18,
    fill: "white",
    backgroundColor: "#182533",
    padding: 10,
    cornerRadius: 15,
    fontFamily: fontFamily,
  });

  const bubbleRect = new Rect({
    left: textBoxStart,
    top: padding,
    width: boxWidth,
    height: box.height + nameBox.height + 25 + 4 * padding,
    rx: 20,
    ry: 20,
    fill: "#182533",
  });

  const totalHeight = bubbleRect.height + 2 * padding;
  const canvas = new StaticCanvas(undefined, {
    width: fullWidth,
    height: bubbleRect.height + 2 * padding,
    backgroundColor: "rgba(0,0,0,0)",
  });
  console.log(picture)
  if (picture) {
    const buf = picture ? Buffer.from(picture) : Buffer.from("");
    const picURL = `data:image/png;base64,${buf.toString("base64")}`;
    const pic = await FabricImage.fromURL(picURL, undefined, {
      left: padding,
      top: totalHeight - padding - 2 * profilePicRadius,
    });
    const scaleFactor = (profilePicRadius * 2) / pic.width;
    pic.set({
      scaleX: scaleFactor,
      scaleY: scaleFactor,
    });
    pic.clipPath = new Circle({
      radius: profilePicRadius / scaleFactor,
      originX: "center",
      originY: "center",
      left: 0,
      top: 0,
    });
    canvas.add(pic);

  } else {
    // If there is no picture, add a placeholder
    const circle = new Circle({
      radius: profilePicRadius,
      fill: accent,
      left: padding,
      top: totalHeight - padding - 2 * profilePicRadius,
    });
    canvas.add(circle);
    const letter = name[0].toUpperCase();
    const letterText = new FabricText(letter, {
      fontSize: 24,
      fill: "white",
      fontFamily: fontFamily,
    });
    letterText.set({
      left: circle.left + circle.radius - letterText.width / 2,
      top: circle.top + circle.radius - letterText.height / 2,
    });
    canvas.add(letterText);
  }

  const clock = new FabricText(getTime(time), {
    fontSize: 16,
    fill: "grey",
    fontFamily: fontFamily,
    top: totalHeight - 2 * padding - 18,
    left: fullWidth - 60,
  });

  canvas.add(bubbleRect);
  canvas.add(box);
  canvas.add(nameBox);
  if (admin_title) {
    const adminBox = new FabricText(admin_title, {
      fontSize: 16,
      fill: accent,
      top: 2 * padding + nameBox.height,
      right: 2 * padding,
      fontFamily: fontFamily,
    });
    canvas.add(adminBox);
  }
  canvas.add(clock);
  console.log("Got Here")
  canvas.renderAll();
  const data = canvas.toDataURL({
    format: "png",
    multiplier: 512 / fullWidth,
  });
  return sharp(dataUriToBuffer(data).buffer)
    .resize(512, 512, { fit: "inside" })
    .webp({ lossless: true })
    .toBuffer();
};
