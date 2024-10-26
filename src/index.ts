import chokidar from "chokidar";
import parser from "properties-parser";
import fs from "node:fs";
import { MyTelegramClient } from "./telegram-sender/client";
import path from "node:path";

const CONFIG_FILE = "./watcher.properties";

if (!fs.existsSync(CONFIG_FILE)) {
  console.log("No config is available! Exiting ...");
  process.exit(0);
}

const properties = parser.read(CONFIG_FILE);

if (!properties["WATCH_DIR"]) {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

  console.log("WATCH-DIR not specified");

  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

  process.exit(0);
}
const watchPath = properties["WATCH_DIR"];

if (!properties["CHAT"]) {
  console.warn(
    "CHAT not specified. See example. Default sending to Favorites"
  );
}
const chat = properties["CHAT"] || "me";

const client = new MyTelegramClient();
await client.init();

const patterns = properties['PATTERN'] || '*.zip;*.rar';

const watchPatterns = patterns.split(';').map((pattern) =>
  path.join(watchPath, pattern)
);
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