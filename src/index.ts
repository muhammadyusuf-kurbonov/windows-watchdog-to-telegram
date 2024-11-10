import { parseCLI } from "@namchee/parsley";
import console from "node:console";
import process from "node:process";
import { Config } from "./config/index.ts";
import LicenseModule from "./license/license-module.ts";
import { TelegramProvider } from "./providers/telegram.ts";
import { WatcherModule } from "./watcher/watcher-module.ts";

const config = new Config();
config.load();

const licenseModule = new LicenseModule(config);
if (!licenseModule.validateLicenseKey()) {
  console.error("Invalid license key!");
  process.exit(1);
}

const cliData = parseCLI(Deno.args.join(" "));

switch (cliData.command) {
  case "":
  case "watch": {
    const watcherModule = new WatcherModule(config, new TelegramProvider());
    const stopWatching = await watcherModule.startWatching();

    process.on("beforeExit", () => {
      stopWatching();
    });

    process.on("exit", () => {
      stopWatching();
    });
    break;
  }
  case "sync":
    console.log("Syncing...");
    break;
  default: {
    console.error(`Unknown command: ${cliData.command}`);
    process.exit(1);
  }
}
