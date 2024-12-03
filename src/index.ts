import { parseCLI } from "@namchee/parsley";
import console from "node:console";
import process from "node:process";
import { Config, MODE } from "./config/index.ts";
import LicenseModule from "./license/license-module.ts";
import { TelegramProvider } from "./providers/telegram.ts";
import { WatcherModule } from "./watcher/watcher-module.ts";
import { BackupModule } from "@/modules/backup/backup-module.ts";
import { WizardModule } from "@/modules/wizard/wizard-module.ts";

const config = new Config();
await config.load();

const licenseModule = new LicenseModule(config);
if (!licenseModule.validateLicenseKey()) {
  console.error("Invalid license key!");
  process.exit(1);
}

const cliData = parseCLI(Deno.args.join(" "));

switch (cliData.command || config.get(MODE)) {
  case "":
  case "publish": {
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
  case "backup": {
    const backupModule = new BackupModule(config, new TelegramProvider());
    backupModule.scheduleBackups();

    process.on("beforeExit", () => {
      backupModule.stop();
    });

    process.on("exit", () => {
      backupModule.stop();
    });
    break;
  }
  case "config":
    await (new WizardModule(config).startWizard());
    break;
  case "sync":
    console.log("Syncing...");
    break;
  default: {
    console.error(`Unknown command: ${cliData.command}`);
    process.exit(1);
  }
}
