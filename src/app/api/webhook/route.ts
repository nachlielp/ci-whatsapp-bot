import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { twilio } from "@/app/Twilio";
import dotenv from "dotenv";
import { bot } from "@/app/Bot";

dotenv.config();
export async function POST(request: Request) {
  const startTime = Date.now(); // Capture start time

  try {
    const formData = await request.formData();

    const messageData: Record<string, string> = {};

    try {
      formData.forEach((value, key) => {
        messageData[key] = String(value);
      });
    } catch (conversionError) {
      console.error(
        "api/webhook/route.ts: Failed to convert form data to params:",
        conversionError
      );
      throw new Error(
        `Failed to convert form data to params, error: ${conversionError}`
      );
    }

    const isValid = await twilio.validateTwilioRequest(request, messageData);

    if (!isValid) {
      console.error("api/webhook/route.ts: Invalid request", request);
      return NextResponse.json({
        status: "error",
        message: "Invalid request",
      });
    }

    //Blcok international
    if (
      process.env.BLOCK_INTERNATIONAL_MESSAGES?.toLowerCase().trim() ===
        "true" &&
      !messageData.WaId.startsWith(process.env.LOCAL_PHON_EXTENSION!)
    ) {
      console.log("blocking international messages for", messageData.WaId);
      return NextResponse.json({
        status: "error",
        message: "Invalid request",
      });
    }

    //Block blocked users
    if (process.env.BLOCK_BLOCKED_USERS?.toLowerCase().trim() === "true") {
      console.log("checking blocked users for", messageData.WaId);
      const user = await supabase.getUser(messageData.WaId);
      if (user?.is_blocked) {
        return NextResponse.json({
          status: "error",
          message: "Invalid request",
        });
      }
    }

    await bot.handleTwilioWebhook(messageData, startTime);

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({
      status: "error",
      message: "Internal server error",
    });
  }
}
