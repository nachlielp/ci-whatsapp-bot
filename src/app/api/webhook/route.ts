import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { twilio } from "@/app/Twilio";
import { EventlyType, Region, EventListType } from "../interface";
import {
  filterCIEventsByType,
  formatCIEventsList,
  emptyRegionMessage,
  setupWeeklyMessage,
} from "@/util/utilService";
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

    console.log("_user", user);
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

    if (messageData.MessageType === "text") {
      if (messageData.Body.includes("הסר")) {
        const unsubscribed = await supabase.unsubscribeFromWeeklyFilter(user);
        if (unsubscribed === false) {
          await twilio.sendText(messageData.From, `*הוסרתם בצלחה*`);
        } else {
          await twilio.sendText(
            `whatsapp:${user.phone}`,
            `*ישנה תקלה בהסרה, אנא צרו איתנו קשר במייל* info@ci-events.org`
          );
        }
      } else {
        await twilio.sendTemplate(
          messageData.From,
          process.env.TWILIO_TEMPLATE_FIRST_MESSAGE!
        );
      }
    } else if (messageData.MessageType === "interactive") {
      switch (messageData.ButtonPayload) {
        case "first_message_reminder":
          await twilio.sendText(messageData.From, setupWeeklyMessage());
          break;
        case "first_message_events":
          await twilio.sendTemplate(
            messageData.From,
            process.env.TWILIO_TEMPLATE_SELECT_EVENT_TYPES!
          );
          break;
        case "event_types_james":
          await twilio.sendTemplate(
            messageData.From,
            process.env.TWILIO_TEMPLATE_SELECT_REGION!
          );
          break;
        case "event_types_courses":
          const ci_events = await supabase.getCIEvents();
          console.log("ci_events", ci_events);
          const filteredEvents = filterCIEventsByType(ci_events, [
            EventlyType.course,
            EventlyType.retreat,
            EventlyType.workshop,
          ]);
          const formattedEvents = formatCIEventsList(
            filteredEvents,
            EventListType.courses
          );
          await twilio.sendText(messageData.From, formattedEvents);
          break;

        default:
      }

      let region;
      switch (messageData.ListId) {
        case "select_regions_jerusalem":
          region = "jerusalem";
          break;
        case "select_regions_center":
          region = "center";
          break;
        case "select_regions_south":
          region = "south";
          break;
        case "select_regions_pardes_hanna":
          region = "pardesHanna";
          break;
        case "select_regions_carmel":
          region = "carmel";
          break;
        case "select_regions_haifa":
          region = "haifa";
          break;
        case "select_regions_galilee":
          region = "galilee";
          break;
      }

      if (region) {
        const ci_events = await supabase.getCIEventsByRegion(region);
        const filteredEvents = filterCIEventsByType(ci_events, [
          EventlyType.class,
          EventlyType.jame,
          EventlyType.underscore,
          EventlyType.score,
        ]);
        const formattedEvents = formatCIEventsList(
          filteredEvents,
          EventListType.james,
          region as Region
        );
        if (formattedEvents) {
          await twilio.sendText(messageData.From, formattedEvents);
        } else {
          await twilio.sendText(
            messageData.From,
            emptyRegionMessage(region as Region)
          );
        }
      }
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
