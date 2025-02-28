import { inject, injectable } from "tsyringe";
import { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { Logger } from "@infrastructure/Logger.js";
import { SelfMessageHandler } from "@whatsapp/handlers/SelfMessageHandler";
import { CommandMessageHandler } from "@whatsapp/handlers/CommandMessageHandler";
import { OCRImageHandler } from "@whatsapp/handlers/OCRImageHandler";
import { StickerHandler } from "@whatsapp/handlers/StickerHandler";
import { MessageContext } from "@interfaces/MessageContext";
import { BaseHandler } from "@whatsapp/handlers/BaseHandler";
import { documentHandler } from "./DocumentHandler";

@injectable()
export class MessageHandler {
  private handler: BaseHandler;

  constructor(
    @inject(Logger) private logger: Logger,
    @inject(SelfMessageHandler) selfMessageHandler: SelfMessageHandler,
    @inject(CommandMessageHandler) commandMessageHandler: CommandMessageHandler,
    @inject(OCRImageHandler) ocrImageHandler: OCRImageHandler,
    @inject(StickerHandler) stickerHandler: StickerHandler,
    @inject(documentHandler) documentHandler: documentHandler,
  ) {
    this.handler = selfMessageHandler;

    selfMessageHandler
      .setNext(commandMessageHandler)
      .setNext(ocrImageHandler)
      .setNext(stickerHandler)
      .setNext(documentHandler);
  }

  public async handleMessage(socket: WASocket, messages: WAMessage[]) {
    try {
      for (const msg of messages) {
        const context: MessageContext = {
          socket,
          data: msg,
          remoteJid: msg.key.remoteJid as string,
          messageContent:
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            "",
        };

        await this.handler.handle(context);
      }
    } catch (error) {
      this.logger.error(`Erro ao processar mensagem:`, error);
    }
  }
}
