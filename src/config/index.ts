import { parse, stringify } from "@std/toml";
import { existsSync } from "@std/fs";
import console from "node:console";
import { WizardModule } from "@/modules/wizard/wizard-module.ts";

export class Config {
  private config: Record<string, unknown> = {};

  public async load(configFilePath = "./config.toml") {
    try {
      const decoder = new TextDecoder("utf-8");

      if (!existsSync(configFilePath)) {
        Deno.createSync(configFilePath);

        await (new WizardModule(this).startWizard());
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

  public set(key: string, value: unknown): void {
    this.config[key] = value;
  }

  public save(configFilePath = "./config.toml") {
    const encoder = new TextEncoder();
    const configContent = encoder.encode(stringify(this.config));
    Deno.writeFileSync(configFilePath, configContent);
  }
}

export * from "./constants.ts";
