import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { tryCatch } from "@/util/tryCatch";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const formData = await request.formData();

    // Convert FormData to a regular object
    const messageData: Record<string, string> = {};
    formData.forEach((value, key) => {
      messageData[key] = value.toString();
    });

    // Log the received data for debugging
    console.log("Received Twilio webhook data:", messageData);

    // Store the message data in the database
    const result = await tryCatch(
      supabase.receiveMessage({
        blob: messageData,
        WaId: messageData.WaId,
        ProfileName: messageData.ProfileName,
        Body: messageData.Body,
        MessageType: messageData.MessageType,
      })
    );

    if (result.error) {
      console.error("Error storing webhook data:", result.error);
      return NextResponse.json({
        status: "error",
        message: "Failed to process webhook",
      });
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({
      status: "error",
      message: "Internal server error",
    });
  }
}
