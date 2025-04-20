# Telegram Group Sticker pack bot

This bot can be used to create collaborative sticker packs for Telegram groups. The code is still WIP, so expect there to be bugs and uncaught errors.

## How to use?

_This part is subject to change_

1. Group admin/owner adds the bot into the group, and sends command `/createPack`
   - This creates the initial Sticker pack with Hello World sticker
2. After the pack has been created, all images sent to the group with `#stiku (<emojis>)` as the caption are added to the pack
   - Replying to existing image/sticker with `#stiku (<emojis>)` also adds it to the pack

The user who initially ran the `/createPack` command owns the sticker pack and can also manually edit the contents

## How to run the bot?

1. Clone this repository and install dependencies with `pnpm install`
2. Add `.env` file with following contents:

```
BOT_TOKEN=<insert your bot token here>
BOT_NAME=<insert your bot username here>
```

3. Build the app with `pnpm build`
4. Run the app with `pnpm start`

### Docker

You can also use Docker to run the application, build with `docker compose build` and run with `docker compose up`

## Requirements

If your system is not directly supported by [node-canvas](https://github.com/Automattic/node-canvas), check what system packages you have to install before running this app.

## Contributing

Feel free to submit PR:s to this repo. All code should be formatted with `pnpm format`.
