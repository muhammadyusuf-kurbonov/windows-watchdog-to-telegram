import { input, password } from "@inquirer/prompts";
import bigInt from "big-integer";
import console from "node:console";
import { Api, TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions/index.js";
import { CHAT_ID_KEY, type Config } from "../config/index.ts";
import type { IProvider } from "./index.ts";

export class TelegramProvider implements IProvider {
  private api_id = 29337088;
  private api_hash = "40251e91de96dded6166f1891a29ffd6";
  private storeSession = new StoreSession("sessions");

  private client: TelegramClient | null = null;

  private chatID: string | null = null;

  async initialize(config: Config) {
    this.client = new TelegramClient(
      this.storeSession,
      this.api_id,
      this.api_hash,
      {
        connectionRetries: 5,
        requestRetries: 5,
      }
    );

    this.chatID = config.get(CHAT_ID_KEY) || "me";

    // this.client.setLogLevel(LogLevel.DEBUG);

    await this.client.start({
      phoneNumber: async () =>
        await input({ message: "Enter phone number", required: true }),
      phoneCode: async () =>
        await input({ message: "Enter code:", required: true }),
      password: async () =>
        await password({ message: "Enter 2FA cloud password:" }),
      onError: (err) => console.log(err),
      firstAndLastNames: async () => {
        const nameAnsSurname = (
          await input({ message: "Enter name and surname:", required: true })
        ).split(" ");
        return [nameAnsSurname[0], nameAnsSurname[1]];
      },
    });

    console.log("Authorization completed.");

    this.client?.session.save();
  }

  async uploadFile(filePath: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("Client is not initialized yet!");
    }

    if (!this.chatID) {
      throw new Error("call initialize before!");
    }

    const result = await this.client
      .sendFile(this.chatID, { file: filePath })
      .then(() => true)
      .catch((error) => {
        console.error(error);
        return false;
      });

    return result;
  }

  async downloadFile(file: string): Promise<boolean> {
    if (!this.client) {
      throw new Error("Client is not initialized yet!");
    }

    if (!this.chatID) {
      throw new Error("call initialize before!");
    }

    const messageOfFile = (await this.client
      .invoke(
        new Api.messages.Search({
          peer: bigInt(this.chatID),
          filter: new Api.InputMessagesFilterDocument(),
          q: file,
        })
      )
      .then((response) => response.toJSON())) as Api.messages.Messages;

    const message = messageOfFile.messages[0] as Api.Message;

    if (!messageOfFile.messages.length) {
      console.log("No such file", file);
      return false;
    }

    return this.client
      .downloadMedia(message, {
        outputFile: file,
      })
      .then(() => true)
      .catch(() => false);
  }

  async listFiles(dir?: string): Promise<string[]> {
    if (!this.client) {
      throw new Error("Client is not initialized yet!");
    }

    if (!this.chatID) {
      throw new Error("call initialize before!");
    }

    const messageOfFile = (await this.client
      .invoke(
        new Api.messages.Search({
          peer: bigInt(this.chatID),
          filter: new Api.InputMessagesFilterDocument(),
          q: dir,
        })
      )
      .then((response) => response.toJSON())) as Api.messages.Messages;

    const messages = messageOfFile.messages as Api.Message[];
    return messages
      .map((msg) => {
        if (!msg.document) {
          return null;
        }

        const filename = msg.document?.attributes.find(
          (attr) => attr.className === "DocumentAttributeFilename"
        )?.fileName;

        if (!filename) {
          console.warn("No filename for document");
        }

        return filename || msg.id.toString();
      })
      .filter((value) => !!value) as string[];
  }

  async sendFile(chat_id: string, filePath: string) {
    if (!this.client) {
      throw new Error("Client is not initialized yet!");
    }
    await this.client.sendFile(chat_id, {
      file: filePath,
      forceDocument: true,
    });
  }
}
