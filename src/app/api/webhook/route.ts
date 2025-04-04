import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
import { tryCatch } from "@/util/tryCatch";

export async function POST(request: Request) {
  const body = await tryCatch(request.json());
  const result = await tryCatch(supabase.test({ body: body.data }));
  if (result.error) {
    // TODO: handle error sentry
    return NextResponse.json({ status: "error" });
  }
  return NextResponse.json({ status: "success" });
}
