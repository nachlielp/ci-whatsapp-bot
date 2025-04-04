import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import dayjs from "dayjs";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ACCOUNT_KEY;

class Supabase {
  supabase: any;

  constructor() {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials are not set");
    }
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async test(bolb: any): Promise<boolean> {
    const env_notification_flag = process.env.ENV_NOTIFICATION_FLAG;

    try {
      const { data, error } = await this.supabase
        .from("wa-messages")
        .insert({
          blob: bolb,
        })
        .select("*");

      if (error) {
        console.error("Error checking notification flag:", error);
        return false;
      }
      return true;
    } catch (error) {
      // TODO: handle error
      console.error("Error checking notification flag:", error);
      return false;
    }
  }
}

export const supabase = new Supabase();
