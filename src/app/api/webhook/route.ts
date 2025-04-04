import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { tryCatch } from "@/util/tryCatch";
export async function GET(request: Request) {
  const result = await tryCatch(supabase.test({ request: request }));
  if (result.error) {
    // TODO: handle error sentry
    return NextResponse.json({ status: "error" });
  }
  return NextResponse.json({ status: "success" });
}
