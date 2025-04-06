import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { tryCatch } from "@/util/tryCatch";
import dayjs from "dayjs";
import { CIEventList, WAMessage, WAUser, Region } from "./api/interface";
import { getWeeklyFilterFromBody } from "@/util/utilService";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ACCOUNT_KEY;

class Supabase {
  supabase: SupabaseClient;

  constructor() {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials are not set");
    }
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async receiveMessage({
    blob,
    WaId,
    ProfileName,
    Body,
    MessageType,
    user_id,
  }: WAMessage): Promise<WAMessage | null> {
    try {
      const result = await this.supabase
        .from("wa-messages")
        .insert({
          blob: blob,
          WaId: WaId,
          ProfileName: ProfileName,
          Body: Body,
          MessageType: MessageType,
          user_id: user_id,
        })
        .select("*")
        .single();

      return result.data as WAMessage;
    } catch (e) {
      //Sentery
      console.error("Error creating user:", e);
      return null;
    }
  }

  async createUser({
    name,
    phoneNumber,
  }: {
    name: string;
    phoneNumber: string;
  }): Promise<WAUser> {
    try {
      const result = await this.supabase
        .from("wa-users")
        .insert({
          name,
          phone: phoneNumber,
        })
        .select()
        .single();

      return result.data as WAUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    const result = await tryCatch(
      Promise.resolve(
        this.supabase
          .from("wa-users")
          .select("*")
          .eq("phone", phoneNumber)
          .single()
      )
    );

    return result.data?.data as WAUser;
  }

  async getCIEventsByRegion(
    region: string,
    formDate: string = dayjs().format("YYYY-MM-DD"),
    toDate: string = dayjs().add(7, "day").format("YYYY-MM-DD")
  ) {
    let districts = [];
    if (region === "north") {
      districts = ["haifa", "pardesHanna", "carmel", "galilee"];
    } else {
      districts = [region];
    }
    try {
      const result = await this.supabase
        .from("ci_events")
        .select(
          "id, short_id, title,  address, start_date, end_date,segments, type,is_multi_day"
        )
        .in("district", districts)
        .gte("start_date", formDate)
        .lte("start_date", toDate)
        .not("hide", "is", true)
        .not("cancelled", "is", true);

      const list: CIEventList[] = result.data ?? [];

      return list;
    } catch (e) {
      console.error("Error getting CI events by region:", e);
      return [];
    }
  }

  async getCIEventsByRegions(
    regions: Region[],
    formDate: string = dayjs().format("YYYY-MM-DD"),
    toDate: string = dayjs().add(7, "day").format("YYYY-MM-DD")
  ) {
    try {
      const result = await this.supabase
        .from("ci_events")
        .select(
          "id, short_id, title,  address, start_date, end_date,segments, type,is_multi_day"
        )
        .in("district", regions)
        .gte("start_date", formDate)
        .lte("start_date", toDate)
        .not("hide", "is", true)
        .not("cancelled", "is", true);

      const list: CIEventList[] = result.data ?? [];

      return list;
    } catch (e) {
      console.error("Error getting CI events by region:", e);
      return [];
    }
  }
  async getCIEvents(
    formDate: string = dayjs().format("YYYY-MM-DD"),
    toDate: string = dayjs().add(60, "day").format("YYYY-MM-DD")
  ) {
    try {
      const result = await this.supabase
        .from("ci_events")
        .select(
          "id, short_id, title,  address, start_date, end_date,segments, type,is_multi_day"
        )
        .gte("start_date", formDate)
        .lte("start_date", toDate)
        .not("hide", "is", true)
        .not("cancelled", "is", true);

      const list: CIEventList[] = result.data ?? [];

      return list;
    } catch (e) {
      console.error("Error getting CI events by region:", e);
      return [];
    }
  }

  async setWeeklyFilter(user: WAUser, body: string) {
    const weeklyFilter = getWeeklyFilterFromBody(body);
    try {
      const result = await this.supabase
        .from("wa-users")
        .update({ filter: weeklyFilter, is_subscribed: true })
        .eq("id", user.id)
        .select("filter")
        .single();

      console.log("setWeeklyFilter.result", result);
      return result.data?.filter ?? [];
    } catch (e) {
      console.error("Error setting weekly filter:", e);
      return null;
    }
  }

  async unsubscribeFromWeeklyFilter(user: WAUser) {
    try {
      const result = await this.supabase
        .from("wa-users")
        .update({ is_subscribed: false })
        .eq("id", user.id)
        .select("is_subscribed")
        .single();

      return result?.data?.is_subscribed ?? undefined;
    } catch (e) {
      console.error("Error unsubscribing from weekly filter:", e);
      return undefined;
    }
  }
}

export const supabase = new Supabase();
