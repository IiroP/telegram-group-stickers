import "node-telegram-bot-api";

// Message may have forward_origin property, this is an incomplete definition for it
// See https://core.telegram.org/bots/api#messageorigin
declare module "node-telegram-bot-api" {
  interface Message {
    forward_origin?: {
      sender_user_name?: string;
    };
  }
}
