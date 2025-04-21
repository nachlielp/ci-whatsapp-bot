import dotenv from "dotenv";
import { Twilio as TwilioClient } from "twilio";
import type { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";
import { tryCatch } from "@/util/tryCatch";
import { validateRequest } from "twilio/lib/webhooks/webhooks";
dotenv.config();

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

  async sendText(to: string, body: string): Promise<MessageInstance> {
    const result = await tryCatch(
      this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: `${to}`,
        body,
      })
    );

    if (result.error) {
      throw new Error(`Failed to send WhatsApp text: ${result.error}`);
    }

    return result.data;
  }

  async sendTemplate(
    to: string,
    contentSid: string,
    contentVariables: Record<string, string> = {}
  ): Promise<MessageInstance> {
    if (!contentSid) {
      throw new Error("sendTemplate.Twilio template is not set");
    }

    const result = await tryCatch(
      this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: `${to}`,
        contentSid,
        contentVariables: JSON.stringify(contentVariables),
      })
    );

    if (result.error) {
      throw new Error(`Failed to send first question: ${result.error}`);
    }

    return result.data;
  }

  async validateTwilioRequest(request: Request) {
    console.log("Validating Twilio request");
    const twilioSignature = request.headers.get("x-twilio-signature");
    const url = process.env.WEBHOOK_URL;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Validate required parameters
    if (!twilioSignature) {
      throw new Error("No Twilio signature found in request headers");
    }
    if (!url) {
      throw new Error("WEBHOOK_URL environment variable is not set");
    }
    if (!authToken) {
      throw new Error("TWILIO_AUTH_TOKEN environment variable is not set");
    }

    try {
      const twilioRequestBody = await request.text();
      const isValid = validateRequest(
        authToken,
        twilioSignature,
        url,
        JSON.parse(twilioRequestBody)
      );

      if (!isValid) {
        throw new Error(
          "Invalid Twilio signature for request: \n" + twilioRequestBody
        );
      }

      console.log("Twilio request validated");

      return isValid;
    } catch (error) {
      throw new Error(`Failed to validate Twilio request: ${error}`);
    }
  }
}

export const twilio = new Twilio();
