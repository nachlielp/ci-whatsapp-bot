import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { tryCatch } from "@/util/tryCatch";
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
    console.log("route_1_user", user);
    if (!user) {
      user = await supabase.createUser({
        name: messageData.ProfileName,
        phoneNumber: messageData.WaId,
      });
    }
    console.log("route_2_user", user);
    // Store the message data in the database
    const result = await tryCatch(
      supabase.receiveMessage({
        blob: messageData,
        WaId: messageData.WaId,
        ProfileName: messageData.ProfileName,
        Body: messageData.Body,
        MessageType: messageData.MessageType,
        user_id: user.id,
      })
    );

    const res = await twilio.sendMultipleSelectQuestion(
      messageData.WaId,
      messageData.Body,
      ["Option 1", "Option 2", "Option 3"]
    );
    console.log("route_3_res", res);

    // const res = await twilio.sendWhatsAppMessage({
    //   to: messageData.To,
    //   contentSid: messageData.SmsSid,
    //   contentVariables: {
    //     "1": "12/1",
    //     "2": "3pm",
    //   },
    // });
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
