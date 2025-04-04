import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { tryCatch } from "@/util/tryCatch";
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

  async test(blob: any): Promise<any> {
    const result = await tryCatch(
      this.supabase
        .from("wa-messages")
        .insert({
          blob: blob,
        })
        .select("*")
        .single()
    );
    console.log("supabase test", result);
    return result;
  }
}

export const supabase = new Supabase();
