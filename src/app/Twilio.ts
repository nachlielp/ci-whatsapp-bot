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
    //TODO varify that body is not empty or over the limit (1600 characters?)
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

  async validateTwilioRequest(
    request: Request,
    messageData: Record<string, string>
  ) {
    try {
      console.log("Twilio.ts: Validating Twilio request");

      // Safely check if request is valid
      if (!request || typeof request !== "object") {
        console.log("Twilio.ts: Invalid request object");
        return false;
      }

      // Safely get headers
      const twilioSignature =
        request.headers?.get("x-twilio-signature") || null;
      const url = process.env.WEBHOOK_URL;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      // Validate required parameters
      if (!twilioSignature) {
        console.log("Twilio.ts: No Twilio signature found in request headers");
        return false;
      }
      if (!url) {
        console.log("Twilio.ts: WEBHOOK_URL environment variable is not set");
        return false;
      }
      if (!authToken) {
        console.log(
          "Twilio.ts: TWILIO_AUTH_TOKEN environment variable is not set"
        );
        return false;
      }

      // Safely validate the request
      let isValid = false;
      try {
        isValid = validateRequest(authToken, twilioSignature, url, messageData);
      } catch (validationError) {
        console.log(
          "Twilio.ts: Error during Twilio validation:",
          validationError
        );
        return false;
      }

      if (!isValid) {
        console.log("Twilio.ts: Invalid Twilio signature for request");
        return false;
      }

      console.log("Twilio.ts: Twilio request validated");
      return true;
    } catch (error) {
      // Catch any unexpected errors that might occur
      console.log(
        "Twilio.ts: Unexpected error during request validation:",
        error
      );
      return false;
    }
  }
}

export const twilio = new Twilio();
