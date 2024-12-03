import { MODE } from "@/config/constants.ts";
import {
  BACKUP_SCHEDULE_CRON,
  WATCH_DIR,
  WATCH_PATTERN,
  type Config,
} from "@/config/index.ts";
import { input, select } from "@inquirer/prompts";
import { TelegramProvider } from "@/providers/telegram.ts";
import console from "node:console";
import fileSelector from "inquirer-file-selector";

export class WizardModule {
  constructor(private config: Config) {}

  async startWizard() {
    console.log("Welcome to the Config! Let's configure it!");

    const mode = await select<"backup" | "publish">({
      message: "Select default mode: ",
      choices: [
        {
          value: "backup",
          name: "Backup",
        },
        {
          value: "publish",
          name: "Upload",
        },
      ],
    });

    this.config.set(MODE, mode);

    const watchDir = await fileSelector({
      message: "Enter directory to watch:",
      type: 'directory',
    });

    this.config.set(WATCH_DIR, watchDir);

    const watchPattern = await input({
      message: "Enter file pattern to watch:",
      required: true,
      default: "**/*.*",
    });
    this.config.set(WATCH_PATTERN, watchPattern);

    if (mode === "backup") {
      const backupScheduleCron = await input({
        message: "Enter cron schedule for backups:",
        required: true,
      });
      this.config.set(BACKUP_SCHEDULE_CRON, backupScheduleCron);
    }

    this.config.save();

    const provider = await select<"telegram">({
      message: "Select provider:",
      choices: [
        {
          value: "telegram",
          name: "Telegram",
        },
      ],
    });

    if (provider === "telegram") {
      // Add Telegram-specific configuration options here
      const telegramProvider = new TelegramProvider();
      await telegramProvider.initialize(this.config);
    } else {
      console.log("Unsupported provider selected.");
    }
  }
}
