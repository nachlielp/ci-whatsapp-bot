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
      } else if (messageData.Body.includes("שבועי")) {
        const regions = await supabase.setWeeklyFilter(user, messageData.Body);
        await twilio.sendText(
          `whatsapp:${user.phone}`,
          formatSubscribedRegions(regions)
        );
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
          const weeklyScheduleTitle = `*אירועים בשבוע הקרוב ב${user.filter
            .map((r) => districtOptions.find((d) => d.value === r)?.label)
            .join(", ")}*`;
          const events = await supabase.getCIEventsByRegions(user.filter);
          const formattedWeeklyScheduleEvents = formatCIEventsList(events);
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
          const unsubscribed = await supabase.unsubscribeFromWeeklyFilter(user);
          if (unsubscribed === false) {
            await twilio.sendText(messageData.From, `*הוסרתם בצלחה*`);
          } else {
            await twilio.sendText(
              `whatsapp:${user.phone}`,
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

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({
      status: "error",
      message: "Internal server error",
    });
  }
}
