import { NextResponse } from "next/server";
// import { twilio } from "@/app/Twilio";
// import {
//   formatSubscribedRegions,
//   setupWeeklyMessage,
// } from "@/util/utilService";
// import { EventListType, EventlyType, Region } from "../interface";
import { supabase } from "@/app/Supabase";
export async function GET() {
  console.log("test");
  const user = await supabase.getUserByPhoneNumber("972584994306");
  console.log("user", user);
  //   const mockBody = "שבועי 1 2";
  const unsubscribed = await supabase.unsubscribeFromWeeklyFilter(user);
  console.log("unsubscribed", unsubscribed);
  //   await twilio.sendText(
  //     `whatsapp:${user.phone}`,
  //     formatSubscribedRegions(regions)
  //   );

  //   const res = await twilio.sendTemplate(
  //     "whatsapp:+972584994306",
  //     "HX07eb51b14cd02d33ac19a0bc9250bae4"
  //   );
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
