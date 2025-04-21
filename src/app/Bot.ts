// import { supabase } from "@/app/Supabase";
// import { twilio } from "@/app/Twilio";
// import { TwilioWhatsappWebhookPayload } from "@/interface";
import { validateTwilioPayload } from "@/util/utilService";

export class Bot {
  //   constructor() {}

  async handleTwilioWebhook(message: Record<string, string>) {
    validateTwilioPayload(message);
    // const payload = message as unknown as TwilioWhatsappWebhookPayload;

    // const {
    //   To,
    //   Body,
    //   From,
    //   WaId,
    //   SmsSid,
    //   NumMedia,
    //   SmsStatus,
    //   AccountSid,
    //   ApiVersion,
    //   ButtonText,
    //   MessageSid,
    //   MessageType,
    //   NumSegments,
    //   ProfileName,
    //   ButtonPayload,
    //   SmsMessageSid,
    //   ReferralNumMedia,
    //   MessagingServiceSid,
    //   OriginalRepliedMessageSid,
    //   OriginalRepliedMessageSender,
    // } = payload;

    // const phoneNumber = From;
    // const messageBody = Body;
  }
}
