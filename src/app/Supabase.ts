import {
  createClient,
  SupabaseClient,
  //   PostgrestSingleResponse,
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
  user_id: string;
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
      console.log("receiveMessage.result", result);
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

      console.log("createUser.result", result);
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

    console.log("_1_result", result);

    return result.data?.data as WAUser;
  }
}

export const supabase = new Supabase();
