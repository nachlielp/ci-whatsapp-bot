import { NextResponse } from "next/server";
import { twilio } from "@/app/Twilio";
import { supabase } from "@/app/Supabase";
import { districtOptions } from "../interface";

export async function GET() {
  const user = await supabase.getUserByPhoneNumber("972584994306");

  const weeklyFilter = user.filter.map((r) => {
    return districtOptions.find((d) => d.value === r)?.label;
  });

  const res = await twilio.sendTemplate(
    "whatsapp:+972584994306",
    "HX221918bf41b50626282cf15d5e8b7e13",
    {
      "1": "נחליאל",
      "2": weeklyFilter.join(", "),
    }
  );
  console.log("res", res);

  return NextResponse.json({});
}
