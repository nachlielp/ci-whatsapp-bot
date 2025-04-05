import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { twilio } from "@/app/Twilio";
// import { twilio } from "@/app/Twilio";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const formData = await request.formData();

    // Convert FormData to a regular object
    const messageData: Record<string, string> = {};
    formData.forEach((value, key) => {
      messageData[key] = value.toString();
    });

    let user = await supabase.getUserByPhoneNumber(messageData.WaId);

    if (!user) {
      user = await supabase.createUser({
        name: messageData.ProfileName,
        phoneNumber: messageData.WaId,
      });
    }

    // Store the message data in the database
    const result = await supabase.receiveMessage({
      blob: messageData,
      WaId: messageData.WaId,
      ProfileName: messageData.ProfileName,
      Body: messageData.Body,
      MessageType: messageData.MessageType,
      user_id: user.id,
    });

    if (!result) {
      return NextResponse.json({
        status: "error",
        message: "Failed to process webhook",
      });
    }

    //TODO: send message to user
    await twilio.sendWhatsAppMessage({
      to: messageData.From,
      contentSid: process.env.TWILIO_TEMPLATE_SELECT_SETUP_OR_REGION!,
      contentVariables: {
        name: messageData.ProfileName,
      },
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({
      status: "error",
      message: "Internal server error",
    });
  }
}
