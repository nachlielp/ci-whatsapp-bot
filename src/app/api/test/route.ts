import { NextResponse } from "next/server";
// import { twilio } from "@/app/Twilio";
// import { supabase } from "@/app/Supabase";
// import { districtOptions } from "../interface";
import { bot } from "@/app/Bot";

import dotenv from "dotenv";
dotenv.config();
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

  // const phoneNumber = "whatsapp:+972584994306";
  // const var1 = "נחליאל";
  // const var2 = "ירושלים, מרכז";
  // const var3 = "7";

  // const user = await supabase.upsertUser({
  //   name: "nachliel",
  //   phoneNumber: phoneNumber,
  // });

  // if (user) {
  //   await supabase.incrementMessageCount(phoneNumber, +user.message_count);
  // }

  // const time = new Date();
  // const blockedUsers = await supabase.listOfBlockedUsers();
  // const time2 = new Date();
  // console.log("time2", time2.getTime() - time.getTime());
  // const timetoprocess = time2.getTime() - time.getTime();
  // const res = await twilio.sendTemplate(
  //   `${phoneNumber}`,
  //   "HX22e0f3f6bb9efabb9bffc8e51d3a717f",
  //   {
  //     "1": var1,
  //     "2": var2,
  //     "3": var3,
  //   }
  // );
  // if (res) {
  //   await supabase.logTwilioResult(
  //     res,
  //     "e14d79be-dde5-4a41-a106-ab07bb3aac63",
  //     "b95a089c-9dcc-4502-b02a-67dfb24922fa",
  //     process.env.TWILIO_PHONE_NUMBER!,
  //     phoneNumber
  //   );
  // }
  // throw new Error("test error blabla");
  const res = await bot.handleWeeklyUpdate();
  console.log("res", res);
  return NextResponse.json({ res });
}
