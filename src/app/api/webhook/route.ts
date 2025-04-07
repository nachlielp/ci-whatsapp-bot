import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { twilio } from "@/app/Twilio";
import { EventlyType, Region, districtOptions } from "../interface";
import {
  filterCIEventsByType,
  formatCIEventsList,
  emptyRegionMessage,
  setupWeeklyMessage,
  formatSubscribedRegions,
  filterEventsByRegions,
} from "@/util/utilService";
// import { twilio } from "@/app/Twilio";

export async function POST(request: Request) {
  const startTime = Date.now(); // Capture start time
  try {
    // Parse the request body
    const formData = await request.formData();

    // Convert FormData to a regular object
    const messageData: Record<string, string> = {};
    formData.forEach((value, key) => {
      messageData[key] = value.toString();
    });

    // const user = await supabase.upsertUser({
    //   name: messageData.ProfileName,
    //   phoneNumber: messageData.WaId,
    // });

    const processingTime1 = Date.now();

    if (messageData.MessageType === "text") {
      if (messageData.Body.includes("הסר")) {
        await twilio.sendTemplate(
          messageData.From,
          process.env.TWILIO_TEMPLATE_CONFIRM_REMOVE!
        );
      } else if (messageData.Body.includes("שבועי")) {
        const user = await supabase.setWeeklyFilter(
          messageData.ProfileName,
          messageData.WaId,
          messageData.Body
        );
        if (user) {
          await twilio.sendText(
            `whatsapp:${user.phone}`,
            formatSubscribedRegions(user.filter)
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
          const formattedCourseEvents = formatCIEventsList(filteredEvents);

          const coursesTitle = `*קורסים וסדנאות וריטריטים בחודשיים הקרובים*`;
          await twilio.sendText(
            messageData.From,
            coursesTitle + "\n\n" + formattedCourseEvents
          );
          break;
        case "weekly_schedule_events":
          const result = await supabase.getUserAndThisWeekEvents(
            messageData.From
          );
          if (!result) {
            await twilio.sendText(
              messageData.From,
              "לא נמצאו אירועים או משתמש"
            );
            break;
          }
          const { user: weeklyScheduleUser, events: weeklyScheduleEvents } =
            result;
          const weeklyScheduleTitle = `*אירועים בשבוע הקרוב ב${weeklyScheduleUser?.filter
            .map(
              (r: Region) => districtOptions.find((d) => d.value === r)?.label
            )
            .join(", ")}*`;

          const weeklyScheduleFilteredEvents = filterEventsByRegions(
            weeklyScheduleEvents,
            weeklyScheduleUser?.filter
          );
          const formattedWeeklyScheduleEvents = formatCIEventsList(
            weeklyScheduleFilteredEvents
          );
          await twilio.sendText(
            messageData.From,
            weeklyScheduleTitle + "\n\n" + formattedWeeklyScheduleEvents
          );
          break;
        case "weekly_schedule_remove":
          await twilio.sendTemplate(
            messageData.From,
            process.env.TWILIO_TEMPLATE_CONFIRM_REMOVE!
          );
          break;
        case "confirm_remove_yes":
          const phoneNumberToUnsubscribe = messageData.WaId;
          const unsubscribed = await supabase.unsubscribeFromWeeklyFilter(
            phoneNumberToUnsubscribe
          );
          if (unsubscribed === false) {
            await twilio.sendText(messageData.From, `*הוסרתם בצלחה*`);
          } else {
            await twilio.sendText(
              `${messageData.From}`,
              `*ישנה תקלה בהסרה, אנא צרו איתנו קשר במייל* info@ci-events.org`
            );
          }
          break;
        case "confirm_remove_no":
          await twilio.sendTemplate(
            messageData.From,
            process.env.TWILIO_TEMPLATE_FIRST_MESSAGE!
          );
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
        case "select_regions_north":
          region = "north";
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
        const formattedEvents = formatCIEventsList(filteredEvents);
        if (formattedEvents) {
          const regionHebrew = districtOptions.find(
            (r) => r.value === region
          )?.label;
          const jamesTitle = `*ג׳אמים ושיעורים ב${regionHebrew} בשבוע הקרוב*`;
          await twilio.sendText(
            messageData.From,
            jamesTitle + "\n\n" + formattedEvents
          );
        } else {
          await twilio.sendText(
            messageData.From,
            emptyRegionMessage(region as Region)
          );
        }
      }
    }

    const processingTime2 = Date.now();

    const user = await supabase.upsertUser({
      name: messageData.ProfileName,
      phoneNumber: messageData.WaId,
    });

    const message = await supabase.receiveMessage({
      blob: messageData,
      WaId: messageData.WaId,
      ProfileName: messageData.ProfileName,
      Body: messageData.Body,
      MessageType: messageData.MessageType,
      user_id: user.id,
      processing_time_ms: `step 1 get user: ${
        processingTime1 - startTime
      } , step 2 - process message: ${processingTime2 - processingTime1} `,
    });

    if (!message) {
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
