import { NextResponse } from "next/server";
import { twilio } from "@/app/Twilio";
import { formatCIEventsList } from "@/util/utilService";
// import {
//   formatSubscribedRegions,
//   setupWeeklyMessage,
// } from "@/util/utilService";
// import { EventListType, EventlyType, Region } from "../interface";
import { supabase } from "@/app/Supabase";
// import {
//   formatSubscribedRegions,
//   getWeeklyFilterFromBody,
// } from "@/util/utilService";
import { districtOptions } from "../interface";

export async function GET() {
  console.log("test");
  const user = await supabase.getUserByPhoneNumber("972584994306");

  //   const events = await supabase.getCIEventsByRegions(user.filter);
  //   console.log("events", events);
  //   const formattedEvents = formatCIEventsList(events);

  const weeklyScheduleTitle = `*שיעורים וג'אמים בשבוע הקרוב ב${user.filter
    .map((r) => districtOptions.find((d) => d.value === r)?.label)
    .join(", ")}*`;
  const events = await supabase.getCIEventsByRegions(user.filter);
  const formattedWeeklyScheduleEvents = formatCIEventsList(events);
  const res = await twilio.sendText(
    "whatsapp:+972584994306",
    weeklyScheduleTitle + "\n\n" + formattedWeeklyScheduleEvents
  );
  console.log("res", res);
  //   const ci_events = await supabase.getCIEventsByRegion("center");
  //   const ci_events = await supabase.getCIEvents();
  //   console.log("ci_events", ci_events);
  //   const filteredEvents = filterCIEventsByType(ci_events, [
  //     EventlyType.course,
  //     EventlyType.retreat,
  //     EventlyType.workshop,
  //   ]);
  //   const formattedEvents = formatCIEventsList(
  //     filteredEvents,
  //     EventListType.courses,
  //     Region.center
  //   );
  //   const res = await twilio.sendText("whatsapp:+972584994306", formattedEvents);
  //   const res = await twilio.sendText(
  //     "whatsapp:+972584994306",
  //     setupWeeklyMessage()
  //   );
  return NextResponse.json({});
}
