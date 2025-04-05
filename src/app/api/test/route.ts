import { NextResponse } from "next/server";
import { twilio } from "@/app/Twilio";
import { filterCIEventsByType } from "@/util/utilService";
import { formatCIEventsList } from "@/util/utilService";
import { EventlyType } from "../interface";
import { supabase } from "@/app/Supabase";
export async function GET() {
  console.log("test");
  //   const res = await twilio.sendTemplate(
  //     "whatsapp:+972584994306",
  //     "HXb691c80223a6c2f797069e6a54fa3069"
  //   );
  //   const ci_events = await supabase.getCIEventsByRegion("center");
  const ci_events = await supabase.getCIEvents();
  console.log("ci_events", ci_events);
  const filteredEvents = filterCIEventsByType(ci_events, [
    EventlyType.course,
    EventlyType.retreat,
    EventlyType.workshop,
  ]);
  const formattedEvents = formatCIEventsList(filteredEvents);
  const res = await twilio.sendText("whatsapp:+972584994306", formattedEvents);
  //   const res = await twilio.sendWhatsAppText("+972584994306", "hellow world");
  return NextResponse.json(res);
}
