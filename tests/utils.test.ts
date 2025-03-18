import assert from "node:assert";
import { test, describe } from "node:test";
import { getEmoji } from "../src/utils/utils";

describe("getEmoji", () => {
  test("correctly extracts first emoji", () => {
    const caption = ["Hello", "👋", "🤔", "world"];
    assert.strictEqual(getEmoji(caption), "👋");
  });

  test("works with ZWJ sequences", () => {
    const caption = ["test", "👩🏾‍💻"];
    assert.strictEqual(getEmoji(caption), "👩🏾‍💻");
  });

  test("ignores other characters", () => {
    const caption = ["#stiku", "#", "1", "emoji", "🤔"];
    assert.strictEqual(getEmoji(caption), "🤔");
  });

  test("returns undefined if no emoji", () => {
    const caption = ["No", "emoji", "here"];
    assert.strictEqual(getEmoji(caption), undefined);
  });
});
