import { NextResponse } from "next/server";
import { bot } from "@/app/Bot";

export async function GET() {
  // Add your cron job logic here
  try {
    // Your scheduled task code goes here
    console.log("Cron job executed at:", new Date().toISOString());
    await bot.handleWeeklyUpdate();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed" },
      { status: 500 }
    );
  }
}
