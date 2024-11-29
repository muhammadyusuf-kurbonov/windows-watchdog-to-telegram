import {
  BACKUP_SCHEDULE_CRON,
  WATCH_DIR,
  WATCH_PATTERN,
  type Config,
} from "@/config/index.ts";
import type { IProvider } from "@/providers/index.ts";
import { Cron } from "@hexagon/croner";
import { format } from "@std/datetime";
import { join } from "@std/path";
import archiver from "archiver";
import console from "node:console";
import fs from "node:fs";

export class BackupModule {
  constructor(private config: Config, private provider: IProvider) {}

  private job: Cron | null = null;

  stop() {
    this.job?.stop();
  }

  scheduleBackups() {
    let backupCron = this.config.get(BACKUP_SCHEDULE_CRON) as
      | string
      | undefined;

    if (!backupCron) {
      console.warn("Backup cron is not setup! Default using EVERY HOUR");
      backupCron = "0 * * * *";
    }

    const job = new Cron(backupCron, () => this.backup(this.config, this.provider));
    this.job = job;
    console.log('Next run at', job.nextRun());
    return job;
  }

  listFiles(directory: string, regexes: RegExp[]): string[] {
    const result: string[] = [];
    for (const entry of Deno.readDirSync(directory)) {
      if (entry.isDirectory) {
        result.push(...this.listFiles(join(directory, entry.name), regexes));
      } else {
        const fullPath = join(directory, entry.name);
        if (regexes.some((regex) => regex.test(fullPath))) {
          result.push(fullPath);
        }
      }
    }

    return result;
  }

  async backup(config: Config, provider: IProvider) {
    let watchDir = config.get(WATCH_DIR) as string | undefined;

    if (!watchDir) {
      console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

      console.warn(
        "WATCH-DIR not specified. Listening current dir",
        Deno.cwd()
      );

      console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

      watchDir = Deno.cwd();
    }

    const watchPattern = (config.get(WATCH_PATTERN) as
      | string[]
      | undefined) || ["*"];

    const outputFilePath = Deno.makeTempFileSync({
      prefix: "backup-" + format(new Date(), "yyyy-MM-dd--HH-mm"),
      suffix: ".zip",
    });
    const output = fs.createWriteStream(outputFilePath);

    const { promise, reject, resolve } = Promise.withResolvers<void>();

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    output.on("close", () => {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "archiver has been finalized and the output file descriptor has closed."
      );
      resolve();
    });

    output.on("end", function () {
      console.log("Data has been drained");
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on("error", function (err) {
      reject(err);
      throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    watchPattern.forEach((pattern) => {
      // append files from a glob pattern
      archive.glob(pattern, { cwd: watchDir });
    });

    archive.finalize();
    await promise;

    provider.initialize(config);
    await provider.uploadFile(outputFilePath);

    console.log(`Backup uploaded ${outputFilePath}!`);

    return outputFilePath;
  }
}
