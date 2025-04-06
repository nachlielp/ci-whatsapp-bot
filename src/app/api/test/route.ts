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
    "HXa0da0d6c5155a697326df97383b79b28",
    {
      "1": "נחליאל",
      "2": weeklyFilter.join(", "),
      "3": weeklyFilter.length.toString(),
    }
  );
  console.log("res", res);

  throw new Error("test error blabla");
  return NextResponse.json({});
}
