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

interface WAUser {
  name: string;
  phone_number: string;
  created_at: string;
  id: string;
  filter: object;
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

  async createUser({
    name,
    phoneNumber,
  }: {
    name: string;
    phoneNumber: string;
  }) {
    const result = await tryCatch(
      Promise.resolve(
        this.supabase.from("wa-users").insert({
          name,
          phoneNumber,
        })
      )
    );

    return result.data as PostgrestSingleResponse<WAUser>;
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    const result = await tryCatch(
      Promise.resolve(
        this.supabase
          .from("wa-users")
          .select("*")
          .eq("phoneNumber", phoneNumber)
          .single()
      )
    );

    return result.data as PostgrestSingleResponse<WAUser>;
  }
}

export const supabase = new Supabase();
