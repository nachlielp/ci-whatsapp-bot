import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { tryCatch } from "@/util/tryCatch";
import dayjs from "dayjs";
import { CIEventList, WAMessage, WAUser, Region } from "../interface";
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
    processing_time_ms,
    user_id,
  }: Omit<WAMessage, "id">): Promise<WAMessage | null> {
    try {
      const result = await this.supabase
        .from("wa_messages")
        .insert({
          blob: blob,
          WaId: WaId,
          ProfileName: ProfileName,
          Body: Body,
          MessageType: MessageType,
          user_id: user_id,
          processing_time_ms: processing_time_ms,
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

  async upsertUser({
    name,
    phoneNumber,
    is_blocked = false,
  }: {
    name: string;
    phoneNumber: string;
    is_blocked?: boolean;
  }): Promise<WAUser> {
    try {
      const result = await this.supabase
        .from("wa_users")
        .upsert(
          {
            name,
            phone: phoneNumber,
            is_blocked,
          },
          {
            onConflict: "phone",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      return result.data as WAUser;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
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
        .from("wa_users")
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

  async getUser(phoneNumber: string) {
    try {
      const result = await this.supabase
        .from("wa_users")
        .select("*")
        .eq("phone", phoneNumber)
        .single();
      return result.data as WAUser;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  async incrementMessageCount(
    phoneNumber: string,
    currentMessageCount: number
  ) {
    let result = null;
    try {
      result = await this.supabase
        .from("wa_users")
        .update({
          message_count: currentMessageCount + 1,
          updated_at: dayjs().tz("UTC").format("YYYY-MM-DD HH:mm:ss.SSSSSSZ"),
        })
        .eq("phone", phoneNumber);
    } catch (error) {
      console.error("Error incrementing message count:", error);
      throw error;
    }

    return result;
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    const result = await tryCatch(
      Promise.resolve(
        this.supabase
          .from("wa_users")
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
    if (region === Region.north) {
      districts = [
        Region.haifa,
        Region.pardesHanna,
        Region.pardesHana,
        Region.carmel,
        Region.galilee,
      ];
    } else {
      districts = [region];
    }
    try {
      const result = await this.supabase
        .from("ci_events")
        .select(
          "id, short_id, title,  address, start_date, end_date,segments, type,is_multi_day, district"
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
    const districts = regions.map((region) => {
      if (region === Region.north) {
        return ["haifa", "pardesHanna", "carmel", "galilee"];
      }
      return [region];
    });
    try {
      const result = await this.supabase
        .from("ci_events")
        .select(
          "id, short_id, title,  address, start_date, end_date,segments, type,is_multi_day, district"
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

  async getCIEvents(
    formDate: string = dayjs().format("YYYY-MM-DD"),
    toDate: string = dayjs().add(60, "day").format("YYYY-MM-DD")
  ) {
    try {
      const result = await this.supabase
        .from("ci_events")
        .select(
          "id, short_id, title,  address, start_date, end_date,segments, type,is_multi_day, district"
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

  async setWeeklyFilter(name: string, phoneNumber: string, body: string) {
    const weeklyFilter = getWeeklyFilterFromBody(body);

    try {
      const result = await this.supabase
        .from("wa_users")
        .upsert(
          {
            name,
            phone: phoneNumber,
            filter: weeklyFilter,
            is_subscribed: true,
          },
          {
            onConflict: "phone",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      return result.data as WAUser;
    } catch (e) {
      console.error("Error setting weekly filter:", e);
      return null;
    }
  }

  async unsubscribeFromWeeklyFilter(phoneNumber: string) {
    try {
      const result = await this.supabase
        .from("wa_users")
        .update({ is_subscribed: false })
        .eq("phone", phoneNumber)
        .select("is_subscribed")
        .single();

      return result?.data?.is_subscribed ?? undefined;
    } catch (e) {
      console.error("Error unsubscribing from weekly filter:", e);
      return undefined;
    }
  }

  async logProcessingTime(id: string, processing_time_ms: string) {
    try {
      const result = await this.supabase
        .from("wa_messages")
        .update({ processing_time_ms })
        .eq("id", id);

      return result.data;
    } catch (e) {
      console.error("Error logging processing time:", e);
      return null;
    }
  }

  async getUserAndThisWeekEvents(phoneNumber: string) {
    const today = dayjs();

    const currentDay = today.day();

    const daysToSaturday = currentDay === 6 ? 0 : 6 - currentDay;

    const formDate = today.format("YYYY-MM-DD");

    const toDate = dayjs(formDate)
      .add(daysToSaturday, "day")
      .format("YYYY-MM-DD");

    // Get user data and events in parallel
    try {
      const [userResult, eventsResult] = await Promise.all([
        this.supabase
          .from("wa_users")
          .select("*")
          .eq("phone", phoneNumber)
          .single(),

        this.supabase
          .from("ci_events")
          .select(
            "id, short_id, title,  address, start_date, end_date,segments, type,is_multi_day, district  "
          )

          .gte("start_date", formDate)
          .lte("start_date", toDate)
          .not("hide", "is", true)
          .not("cancelled", "is", true),
      ]);

      return {
        user: userResult.data as WAUser,
        events: eventsResult.data as CIEventList[],
      };
    } catch (e) {
      console.error("Error getting user and this week events:", e);
      return null;
    }
  }

  async logTwilioResult(
    twilioResult: object,
    messageId: string | null,
    userId: string,
    from: string,
    to: string,
    type: "user_message" | "cron_job"
  ) {
    try {
      const result = await this.supabase.from("wa_twilio_logs").insert({
        result: twilioResult,
        wa_users_id: userId,
        wa_messages_id: messageId,
        trigger: type,
        from: from,
        to: to,
      });
      return result.data;
    } catch (e) {
      console.error("Error logging twilio result:", e);
      throw new Error("Error logging twilio result");
    }
  }

  async getBlockedUsers() {
    try {
      const result = await this.supabase
        .from("wa_users")
        .select("*")
        .eq("is_blocked", true);
      return result.data;
    } catch (e) {
      console.error("Error getting blocked users:", e);
      return [];
    }
  }

  async getSubscribedUsers() {
    try {
      const { data, error } = await this.supabase
        .from("wa_users")
        .select("*")
        .eq("is_subscribed", true);

      if (error) {
        console.error("Error getting WA users:", error);
        throw error;
      }

      if (data.length === 0) {
        return [];
      }
      return data as WAUser[];
    } catch (error) {
      console.error("Error getting WA users:", error);
      throw error;
    }
  }
}

export const supabase = new Supabase();
