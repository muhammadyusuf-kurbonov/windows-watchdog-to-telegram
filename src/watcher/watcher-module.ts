import globToRegexp from "glob-to-regexp";
import console from "node:console";
import { clearTimeout, setTimeout } from "node:timers";
import { WATCH_DIR, WATCH_PATTERN, type Config } from "../config/index.ts";
import type { IProvider } from "../providers/index.ts";

export class WatcherModule {
  constructor(private config: Config, private provider: IProvider) {}

  async startWatching() {
    let watchDir = this.config.get(WATCH_DIR) as string | undefined;

    if (!watchDir) {
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

      console.log("WATCH-DIR not specified. Listening current dir", Deno.cwd());

      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

      watchDir = Deno.cwd();
    }

    const watchPattern = this.config.get<string>(WATCH_PATTERN) || "**/*";

    const watchPatterns = globToRegexp(watchPattern, { globstar: true, flags: "i" });

    await this.provider.initialize(this.config);

    const watcher = Deno.watchFs(watchDir);

    this.listenWatcher(watcher, watchPatterns);

    return () => {
      watcher.close();
    };
  }

  private async listenWatcher(watcher: Deno.FsWatcher, pattern: RegExp) {
    for await (const event of watcher) {
      const filtered = this.matchesPattern(event, pattern);

      if (event.kind === "access") {
        continue;
      }

      if (!filtered) {
        continue;
      }

      this.handle(event);
    }
  }

  private matchesPattern(event: Deno.FsEvent, pattern: RegExp) {
    return event.paths.some((path) => pattern.test(path));
  }

  private pathEvents: Record<
    string,
    { event: Deno.FsEvent["kind"]; timer: NodeJS.Timeout }
  > = {};

  private handle(event: Deno.FsEvent) {
    event.paths.forEach((path) => {
      if (this.pathEvents[path]) {
        clearTimeout(this.pathEvents[path].timer);
      }
    });

    event.paths.forEach((path) => {
      this.pathEvents[path] = {
        event: event.kind,
        timer: setTimeout(() => {
          this.provider.uploadFile(path);
        }),
      };
    });
  }
}
