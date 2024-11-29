import type { Config } from "../config/index.ts";

export interface IProvider {
  initialize(config: Config): Promise<void>;
  listFiles(dir?: string): Promise<string[]>;
  downloadFile(file: string): Promise<boolean>;
  uploadFile(filePath: string): Promise<boolean>;
}
