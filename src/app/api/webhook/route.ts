import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { twilio } from "@/app/Twilio";
// import {
//   EventlyType,
//   Region,
//   districtOptions,
//   InteractiveButtonPayload,
// } from "../../../interface";
// import {
//   filterCIEventsByType,
//   formatCIEventsList,
//   emptyRegionMessage,
//   formatSubscribedRegions,
//   filterEventsByRegions,
// } from "@/util/utilService";
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

    // if (messageData.MessageType === "text") {
    //   if (messageData.Body.includes("הסר")) {
    //     twilioResult = await twilio.sendTemplate(
    //       messageData.From,
    //       process.env.TWILIO_TEMPLATE_CONFIRM_REMOVE!
    //     );
    //   } else if (messageData.Body.includes("שבועי")) {
    //     const user = await supabase.setWeeklyFilter(
    //       messageData.ProfileName,
    //       messageData.WaId,
    //       messageData.Body
    //     );
    //     if (user) {
    //       twilioResult = await twilio.sendText(
    //         `whatsapp:${user.phone}`,
    //         formatSubscribedRegions(user.filter)
    //       );
    //     }
    //   } else {
    //     twilioResult = await twilio.sendTemplate(
    //       messageData.From,
    //       process.env.TWILIO_TEMPLATE_FIRST_MESSAGE!
    //     );
    //   }
    // } else if (
    //   messageData.MessageType === "interactive" ||
    //   messageData.MessageType === "button"
    // ) {
    //   switch (messageData.ButtonPayload) {
    //     case InteractiveButtonPayload.first_message_reminder:
    //       twilioResult = await twilio.sendText(
    //         messageData.From,
    //         setupWeeklyMessage()
    //       );
    //       break;
    //     case InteractiveButtonPayload.first_message_events:
    //       twilioResult = await twilio.sendTemplate(
    //         messageData.From,
    //         process.env.TWILIO_TEMPLATE_SELECT_EVENT_TYPES!
    //       );
    //       break;
    //     case InteractiveButtonPayload.event_types_james:
    //       twilioResult = await twilio.sendTemplate(
    //         messageData.From,
    //         process.env.TWILIO_TEMPLATE_SELECT_REGION!
    //       );
    //       break;
    //     case InteractiveButtonPayload.event_types_courses:
    //       const ci_events = await supabase.getCIEvents();
    //       console.log("ci_events", ci_events);
    //       const filteredEvents = filterCIEventsByType(ci_events, [
    //         EventlyType.course,
    //         EventlyType.retreat,
    //         EventlyType.workshop,
    //       ]);
    //       const formattedCourseEvents = formatCIEventsList(filteredEvents);

    //       const coursesTitle = `*קורסים וסדנאות וריטריטים בחודשיים הקרובים*`;
    //       twilioResult = await twilio.sendText(
    //         messageData.From,
    //         coursesTitle + "\n\n" + formattedCourseEvents
    //       );
    //       break;
    //     case InteractiveButtonPayload.weekly_schedule_events:
    //       const userAndWeeklyEvents = await supabase.getUserAndThisWeekEvents(
    //         messageData.WaId
    //       );
    //       if (!userAndWeeklyEvents) {
    //         twilioResult = await twilio.sendText(
    //           messageData.From,
    //           "לא נמצאו אירועים/ משתמש"
    //         );
    //         break;
    //       }
    //       const { user: weeklyScheduleUser, events: weeklyScheduleEvents } =
    //         userAndWeeklyEvents;

    //       if (!weeklyScheduleUser || weeklyScheduleUser.filter.length === 0) {
    //         const noWeeklyFilterMessageTitle = `*לא מוגדר לכם איזורים*`;
    //         twilioResult = await twilio.sendText(
    //           messageData.From,
    //           noWeeklyFilterMessageTitle + "\n\n" + setupWeeklyMessage()
    //         );
    //         break;
    //       }
    //       const weeklyScheduleTitle = `*אירועים בשבוע הקרוב ב${weeklyScheduleUser?.filter
    //         .map(
    //           (r: Region) => districtOptions.find((d) => d.value === r)?.label
    //         )
    //         .join(", ")}.*`;

    //       const weeklyScheduleFilteredEvents = filterEventsByRegions(
    //         weeklyScheduleEvents,
    //         weeklyScheduleUser?.filter
    //       );
    //       const formattedWeeklyScheduleEvents = formatCIEventsList(
    //         weeklyScheduleFilteredEvents
    //       );
    //       twilioResult = await twilio.sendText(
    //         messageData.From,
    //         weeklyScheduleTitle + "\n\n" + formattedWeeklyScheduleEvents
    //       );
    //       break;
    //     case InteractiveButtonPayload.weekend_schedule_events:
    //       const userAndWeekendEvents = await supabase.getUserAndThisWeekEvents(
    //         messageData.WaId
    //       );
    //       if (!userAndWeekendEvents) {
    //         twilioResult = await twilio.sendText(
    //           messageData.From,
    //           "לא נמצאו אירועים/ משתמש"
    //         );
    //         break;
    //       }
    //       const { user: weekendScheduleUser, events: weekendScheduleEvents } =
    //         userAndWeekendEvents;

    //       if (!weekendScheduleUser || weekendScheduleUser.filter.length === 0) {
    //         const noWeeklyFilterMessageTitle = `*לא מוגדר לכם איזורים*`;
    //         twilioResult = await twilio.sendText(
    //           messageData.From,
    //           noWeeklyFilterMessageTitle + "\n\n" + setupWeeklyMessage()
    //         );
    //         break;
    //       }

    //       const weekendScheduleTitle = `*אירועים בסופ״ש הקרוב ב${weekendScheduleUser?.filter
    //         .map(
    //           (r: Region) => districtOptions.find((d) => d.value === r)?.label
    //         )
    //         .join(", ")}*`;

    //       const weekendScheduleFilteredEvents = filterEventsByRegions(
    //         weekendScheduleEvents,
    //         weekendScheduleUser?.filter
    //       );
    //       const formattedWeekendScheduleEvents = formatCIEventsList(
    //         weekendScheduleFilteredEvents
    //       );
    //       twilioResult = await twilio.sendText(
    //         messageData.From,
    //         weekendScheduleTitle + "\n\n" + formattedWeekendScheduleEvents
    //       );
    //       break;
    //     case InteractiveButtonPayload.remove_weekly_filter:
    //       twilioResult = await twilio.sendTemplate(
    //         messageData.From,
    //         process.env.TWILIO_TEMPLATE_CONFIRM_REMOVE!
    //       );
    //       break;
    //     case InteractiveButtonPayload.confirm_remove_yes:
    //       const phoneNumberToUnsubscribe = messageData.WaId;
    //       const unsubscribed = await supabase.unsubscribeFromWeeklyFilter(
    //         phoneNumberToUnsubscribe
    //       );
    //       if (unsubscribed === false) {
    //         twilioResult = await twilio.sendText(
    //           messageData.From,
    //           `*הוסרתם בצלחה*`
    //         );
    //       } else {
    //         twilioResult = await twilio.sendText(
    //           `${messageData.From}`,
    //           `*ישנה תקלה בהסרה, אנא צרו איתנו קשר במייל* info@ci-events.org`
    //         );
    //       }
    //       break;
    //     case InteractiveButtonPayload.confirm_remove_no:
    //       twilioResult = await twilio.sendTemplate(
    //         messageData.From,
    //         process.env.TWILIO_TEMPLATE_FIRST_MESSAGE!
    //       );
    //       break;
    //     default:
    //   }

    //   let region;
    //   switch (messageData.ListId) {
    //     case "select_regions_jerusalem":
    //       region = "jerusalem";
    //       break;
    //     case "select_regions_center":
    //       region = "center";
    //       break;
    //     case "select_regions_south":
    //       region = "south";
    //       break;
    //     case "select_regions_north":
    //       region = "north";
    //       break;
    //   }

    //   if (region) {
    //     const ci_events = await supabase.getCIEventsByRegion(region);
    //     const filteredEvents = filterCIEventsByType(ci_events, [
    //       EventlyType.class,
    //       EventlyType.jame,
    //       EventlyType.jam,
    //       EventlyType.underscore,
    //       EventlyType.score,
    //     ]);
    //     const formattedEvents = formatCIEventsList(filteredEvents);
    //     if (formattedEvents) {
    //       const regionHebrew = districtOptions.find(
    //         (r) => r.value === region
    //       )?.label;
    //       const jamesTitle = `*ג׳אמים ושיעורים ב${regionHebrew} בשבוע הקרוב*`;
    //       twilioResult = await twilio.sendText(
    //         messageData.From,
    //         jamesTitle + "\n\n" + formattedEvents
    //       );
    //     } else {
    //       twilioResult = await twilio.sendText(
    //         messageData.From,
    //         emptyRegionMessage(region as Region)
    //       );
    //     }
    //   }
    // } else {
    //   throw new Error(`Unsupported message type: ${messageData.MessageType}`);
    // }

    // const processingTime = Date.now();

    // const user = await supabase.upsertUser({
    //   name: messageData.ProfileName,
    //   phoneNumber: messageData.WaId,
    // });

    // if (user) {
    //   await supabase.incrementMessageCount(
    //     messageData.WaId,
    //     +user.message_count
    //   );
    // }

    // const message = await supabase.receiveMessage({
    //   blob: messageData,
    //   WaId: messageData.WaId,
    //   ProfileName: messageData.ProfileName,
    //   Body: messageData.Body,
    //   MessageType: messageData.MessageType,
    //   user_id: user.id,
    //   processing_time_ms: `${processingTime - startTime} `,
    // });

    // if (!message) {
    //   return NextResponse.json({
    //     status: "error",
    //     message: "Failed to process webhook",
    //   });
    // }

    // if (twilioResult) {
    //   await supabase.logTwilioResult(
    //     twilioResult,
    //     message.id,
    //     user.id,
    //     process.env.TWILIO_PHONE_NUMBER!,
    //     user.phone
    //   );
    // }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({
      status: "error",
      message: "Internal server error",
    });
  }
}
