import assert from "node:assert";
import { test, describe } from "node:test";
import { getEmoji } from "../src/utils/utils";

describe("getEmoji", () => {
  test("correctly extracts first emoji", () => {
    const caption = ["Hello", "👋", "🤔", "world"];
    assert.deepStrictEqual(getEmoji(caption), ["👋"]);
  });

  test("works with ZWJ sequences", () => {
    const caption = ["test", "👩🏾‍💻"];
    assert.deepStrictEqual(getEmoji(caption), ["👩🏾‍💻"]);
  });

  test("ignores other characters", () => {
    const caption = ["#stiku", "#", "1", "emoji", "🤔"];
    assert.deepStrictEqual(getEmoji(caption), ["🤔"]);
  });

  test("support multiple consecutive emojis", () => {
    const caption = ["test", "👋🤔", "😄"];
    assert.deepStrictEqual(getEmoji(caption), ["👋", "🤔"]);
  });

  test("returns undefined if no emoji", () => {
    const caption = ["No", "emoji", "here"];
    assert.strictEqual(getEmoji(caption), undefined);
  });

  test("takes max 20 emojis", () => {
    const caption = ["👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋👋"];
    assert.deepStrictEqual(getEmoji(caption)?.length, 20);
  });
});
