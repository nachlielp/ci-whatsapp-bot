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
    } else if (
      messageData.MessageType === "interactive" ||
      messageData.MessageType === "button"
    ) {
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
          const userAndWeeklyEvents = await supabase.getUserAndThisWeekEvents(
            messageData.WaId
          );
          if (!userAndWeeklyEvents) {
            await twilio.sendText(messageData.From, "לא נמצאו אירועים/ משתמש");
            break;
          }
          const { user: weeklyScheduleUser, events: weeklyScheduleEvents } =
            userAndWeeklyEvents;

          if (!weeklyScheduleUser || weeklyScheduleUser.filter.length === 0) {
            const noWeeklyFilterMessageTitle = `*לא מוגדר לכם איזורים *`;
            await twilio.sendText(
              messageData.From,
              noWeeklyFilterMessageTitle + "\n\n" + setupWeeklyMessage()
            );
            break;
          }
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
        case "weekend_schedule_events":
          const userAndWeekendEvents = await supabase.getUserAndThisWeekEvents(
            messageData.WaId
          );
          if (!userAndWeekendEvents) {
            await twilio.sendText(messageData.From, "לא נמצאו אירועים/ משתמש");
            break;
          }
          const { user: weekendScheduleUser, events: weekendScheduleEvents } =
            userAndWeekendEvents;

          if (!weekendScheduleUser || weekendScheduleUser.filter.length === 0) {
            const noWeeklyFilterMessageTitle = `*לא מוגדר לכם איזורים *`;
            await twilio.sendText(
              messageData.From,
              noWeeklyFilterMessageTitle + "\n\n" + setupWeeklyMessage()
            );
            break;
          }

          const weekendScheduleTitle = `*אירועים בסופ״ש הקרוב ב${weekendScheduleUser?.filter
            .map(
              (r: Region) => districtOptions.find((d) => d.value === r)?.label
            )
            .join(", ")}*`;

          const weekendScheduleFilteredEvents = filterEventsByRegions(
            weekendScheduleEvents,
            weekendScheduleUser?.filter
          );
          const formattedWeekendScheduleEvents = formatCIEventsList(
            weekendScheduleFilteredEvents
          );
          await twilio.sendText(
            messageData.From,
            weekendScheduleTitle + "\n\n" + formattedWeekendScheduleEvents
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
    } else {
      throw new Error(`Unsupported message type: ${messageData.MessageType}`);
    }

    const processingTime = Date.now();

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
      processing_time_ms: `${processingTime - startTime} `,
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
