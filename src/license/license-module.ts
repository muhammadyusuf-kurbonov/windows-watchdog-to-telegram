import { LICENSE_KEY, type Config } from "../config/index.ts";
import { checkExpire } from "./validate.ts";
import { existsSync } from '@std/fs';

const LICENSE_KEY_FILE = "./license-key.txt";

export default class LicenseModule {
  constructor(private config: Config) {}

  validateLicenseKey(): boolean {
    let licenseKey = "";

    if (!existsSync(LICENSE_KEY_FILE)) {
      Deno.createSync(LICENSE_KEY_FILE);
    }

    try {
      licenseKey = Deno.readTextFileSync(LICENSE_KEY_FILE).trim();
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        licenseKey = this.config.get(LICENSE_KEY);
      }
    }

    return checkExpire(licenseKey);
  }
}
