import {
  createClient,
  SupabaseClient,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import dotenv from "dotenv";
import { tryCatch } from "@/util/tryCatch";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ACCOUNT_KEY;

// Define the structure of your wa-messages table

interface WAMessage {
  blob: Record<string, unknown>;
  WaId: string;
  ProfileName: string;
  Body: string;
  MessageType: string;
}

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
  }: WAMessage): Promise<WAMessage> {
    const result = await tryCatch(
      Promise.resolve(
        this.supabase
          .from("wa-messages")
          .insert({
            blob: blob,
            WaId: WaId,
            ProfileName: ProfileName,
            Body: Body,
            MessageType: MessageType,
          })
          .select("*")
          .single()
      )
    );

    return (result.data as PostgrestSingleResponse<WAMessage>)
      .data as WAMessage;
  }
}

export const supabase = new Supabase();
