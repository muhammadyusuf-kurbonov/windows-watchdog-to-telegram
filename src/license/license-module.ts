import { LICENSE_KEY, type Config } from "../config/index.ts";
import { checkExpire } from "./validate.ts";

const LICENSE_KEY_FILE = "./license-key.txt";

export default class LicenseModule {
  constructor(private config: Config) {}

  validateLicenseKey(): boolean {
    let licenseKey = "";
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
