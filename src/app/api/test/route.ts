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

  // const phoneNumber = "584994306";
  // const var1 = "נחליאל";
  // const var2 = "ירושלים, מרכז";
  // const var3 = "7";
  // const res = await twilio.sendTemplate(
  //   `whatsapp:+972${phoneNumber}`,
  //   "HX22e0f3f6bb9efabb9bffc8e51d3a717f",
  //   {
  //     "1": var1,
  //     "2": var2,
  //     "3": var3,
  //   }
  // );

  // throw new Error("test error blabla");
  return NextResponse.json({});
}
