import { NextResponse } from "next/server";
// import { twilio } from "@/app/Twilio";
// import { supabase } from "@/app/Supabase";
// import { districtOptions } from "../interface";

export async function GET() {
  // const user = await supabase.getUserByPhoneNumber("972584994306");

  // const weeklyFilter = user.filter.map((r) => {
  //   return districtOptions.find((d) => d.value === r)?.label;
  // });

  // const res = await twilio.sendTemplate(
  //   "whatsapp:+972584994306",
  //   "HX01c011cdf6f855cdba8ab9fc1014c67f",
  //   {
  //     "1": "נחליאל",
  //     "2": weeklyFilter.join(", "),
  //     "3": weeklyFilter.length.toString(),
  //   }
  // );
  // console.log("res", res);
  // const res = await twilio.sendTemplate(
  //   "whatsapp:+972584994306",
  //   "HX62753712f8f915f3c8258b3473493025",
  //   {}
  // );

  throw new Error("test error blabla");
  return NextResponse.json({});
}
