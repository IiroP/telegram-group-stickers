import { JsonDB, Config } from "node-json-db";
import dotenv from "dotenv";

dotenv.config();
export const TOKEN = process.env.BOT_TOKEN ?? "";
export const BOT_NAME = process.env.BOT_NAME ?? "";

export const db = new JsonDB(new Config("database", true, true, "/"));
