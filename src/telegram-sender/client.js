const input = require("input");
const { TelegramClient } = require("telegram");
const { StoreSession } = require("telegram/sessions/index.js");

module.exports = class MyTelegramClient {
  api_id = 29337088;
  api_hash = "40251e91de96dded6166f1891a29ffd6";
  storeSession = new StoreSession("sessions");
  /** @type {TelegramClient | null} */
  client = null;

  async init() {
    this.client = new TelegramClient(
      this.storeSession,
      this.api_id,
      this.api_hash,
      {
        connectionRetries: 5,
        requestRetries: 5,
      }
    );

    // this.client.setLogLevel(LogLevel.DEBUG);

    await this.client.start({
      phoneNumber: async () => await input.text('Enter phone number'),
      phoneCode: async () => await input.text('Enter code:'),
      password: async () => await input.text('Enter 2FA cloud password:'),
      onError: (err) => console.log(err),
      qrCode: async (qrCode) => {
          console.log('Requested QR code????', qrCode);
      },
      firstAndLastNames: async () => await input.text('Enter name and surname:'),
    });

    console.log("Authorization completed.");

    this.client?.session.save();
  }

  async sendFile(chat_id, filePath) {
    if (!this.client) throw new Error("Client is not initialized yet!");
    await this.client.sendFile(chat_id, { file: filePath });
    console.log("File is sent", filePath);
  }
}
