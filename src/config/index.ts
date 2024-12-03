import { parse } from "@std/toml";
import { existsSync } from "@std/fs";
import console from "node:console";

export class Config {
  private config: Record<string, unknown> = {};

  public load(configFilePath = "./config.toml") {
    try {
      const decoder = new TextDecoder("utf-8");

      if (!existsSync(configFilePath)) {
        Deno.createSync(configFilePath);
      }

      const configFile = Deno.readFileSync(configFilePath);
      const configContent = decoder.decode(configFile);

      this.config = parse(configContent);
    } catch (e) {
      console.warn(e);
    }
  }

  public get<T>(key: string): T {
    return this.config[key] as T;
  }
}

export * from "./constants.ts";
