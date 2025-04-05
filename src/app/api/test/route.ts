import { supabase } from "@/app/Supabase";
import { NextResponse } from "next/server";
import { twilio } from "@/app/Twilio";
import { formatCIEventsList } from "@/util/utilService";
export async function GET() {
  console.log("test");
  const events = await supabase.getCIEventsByRegion("jerusalem");
  const res = await twilio.sendText(
    "+972584994306",
    formatCIEventsList(events)
  );
  //   const res = await twilio.sendWhatsAppText("+972584994306", "hellow world");
  return NextResponse.json(res);
}
