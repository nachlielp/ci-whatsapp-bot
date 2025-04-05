import { supabase } from "@/app/Supabase";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("test");
  const events = await supabase.getCIEventsByRegion("jerusalem");
  return NextResponse.json(events);
}
