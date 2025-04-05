import dotenv from "dotenv";
import { Twilio as TwilioClient } from "twilio";
import type { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";
import { tryCatch } from "@/util/tryCatch";

dotenv.config();

interface WhatsAppMessage {
  to: string;
  contentSid: string;
  contentVariables?: Record<string, string>;
}

class Twilio {
  private client: TwilioClient;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials are not set");
    }

    this.client = new TwilioClient(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async sendWhatsAppMessage({
    to,
    contentSid,
    contentVariables,
  }: WhatsAppMessage): Promise<MessageInstance> {
    const result = await tryCatch(
      this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`,
        contentSid,
        contentVariables: contentVariables
          ? JSON.stringify(contentVariables)
          : undefined,
      })
    );

    if (result.error) {
      throw new Error(`Failed to send WhatsApp message: ${result.error}`);
    }

    return result.data;
  }

  async sendWhatsAppText(to: string, body: string): Promise<MessageInstance> {
    const result = await tryCatch(
      this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`,
        body,
      })
    );

    if (result.error) {
      throw new Error(`Failed to send WhatsApp text: ${result.error}`);
    }

    return result.data;
  }

  async sendMultipleSelectQuestion(
    to: string,
    question: string,
    options: string[]
  ): Promise<MessageInstance> {
    const result = await tryCatch(
      this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`,
        body: question,
        contentSid: "HX5a02fdfaec6faf208839c0e3eb82886b", //select_regions
        contentVariables: JSON.stringify({
          header: {
            type: "text",
            text: question,
          },
          body: {
            text: "Please select your options:",
          },
          action: {
            buttons: options.map((option, index) => ({
              type: "reply",
              reply: {
                id: `option_${index}`,
                title: option,
              },
            })),
          },
        }),
      })
    );

    console.log("sendMultipleSelectQuestion.result", result);

    if (result.error) {
      throw new Error(
        `Failed to send multiple select question: ${result.error}`
      );
    }

    return result.data;
  }
}

export const twilio = new Twilio();
