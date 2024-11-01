import chokidar from "chokidar";
import console from "node:console";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import parser from "properties-parser";
import { MyTelegramClient } from "./telegram-sender/client.ts";
import { checkExpire } from "./validate.ts";

const CONFIG_FILE = "./watcher.properties";

if (!fs.existsSync(CONFIG_FILE)) {
  console.log("No config is available! Exiting ...");
  process.exit(0);
}

const properties = parser.read(CONFIG_FILE);

if (!properties["LICENSE_KEY"]) {
  throw new Error("No license key was provided!");
}

const expredLicense = checkExpire(properties["LICENSE_KEY"]);

if (!expredLicense) {
  console.log("License is expired! Exiting ...");
  process.exit(0);
}

if (!properties["WATCH_DIR"]) {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

  console.log("WATCH-DIR not specified");

  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

  process.exit(0);
}
const watchPath = properties["WATCH_DIR"];

if (!properties["CHAT"]) {
  console.warn("CHAT not specified. See example. Default sending to Favorites");
}
const chat = properties["CHAT"] || "me";

const client = new MyTelegramClient();
await client.init();

const patterns = properties["PATTERN"] || "*.zip;*.rar";

const watchPatterns = patterns
  .split(";")
  .map((pattern) => path.join(watchPath, pattern));
console.log(watchPatterns);
const watcher = chokidar.watch(watchPatterns, {
  persistent: true,
  awaitWriteFinish: true,
  ignoreInitial: true,
});

watcher.on("add", async (pathToFile: string) => {
  console.log("Sending", pathToFile, "to", chat);
  await client.sendFile(chat, pathToFile);
});

console.log("Watcher activated for", watchPath);
