import assert from "node:assert";
import { test, describe } from "node:test";
import { getEmoji, senderInfo } from "../src/utils/utils";
import { Message } from "grammy/types";

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

describe("senderInfo", () => {
  test("extracts info from regular user message", () => {
    const message = {
      from: {
        id: 123456,
        is_bot: false,
        first_name: "John",
        last_name: "Doe",
      },
      chat: { id: 1, type: "private", first_name: "John" },
      message_id: 1,
      date: 1234567890,
    } as Message;

    const result = senderInfo(message);
    assert.deepStrictEqual(result, {
      senderID: 123456,
      name: "John Doe",
    });
  });

  test("extracts info from anonymous admin message (sender_chat)", () => {
    const message = {
      from: {
        id: 1087968824,
        is_bot: true,
        first_name: "Group",
      },
      sender_chat: {
        id: -1001234567890,
        type: "supergroup",
        title: "Test Group",
      },
      chat: { id: -1001234567890, type: "supergroup", title: "Test Group" },
      message_id: 1,
      date: 1234567890,
    } as Message;

    const result = senderInfo(message);
    assert.deepStrictEqual(result, {
      senderID: -1001234567890,
      name: "Test Group",
    });
  });

  test("extracts info from forwarded message from user", () => {
    const message = {
      from: {
        id: 123456,
        is_bot: false,
        first_name: "Forwarder",
      },
      forward_origin: {
        type: "user",
        date: 1234567890,
        sender_user: {
          id: 789012,
          is_bot: false,
          first_name: "Original",
          last_name: "Sender",
        },
      },
      chat: { id: 1, type: "private", first_name: "Forwarder" },
      message_id: 1,
      date: 1234567890,
    } as Message;

    const result = senderInfo(message);
    assert.deepStrictEqual(result, {
      senderID: 789012,
      name: "Original Sender",
    });
  });

  test("extracts info from forwarded message from chat", () => {
    const message = {
      from: {
        id: 123456,
        is_bot: false,
        first_name: "Forwarder",
      },
      forward_origin: {
        type: "chat",
        date: 1234567890,
        sender_chat: {
          id: -1001234567890,
          type: "supergroup",
          title: "Original Chat",
        },
      },
      chat: { id: 1, type: "private", first_name: "Forwarder" },
      message_id: 1,
      date: 1234567890,
    } as Message;

    const result = senderInfo(message);
    assert.deepStrictEqual(result, {
      senderID: -1001234567890,
      name: "Original Chat",
    });
  });
});
