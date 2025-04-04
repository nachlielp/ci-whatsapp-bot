import { NextResponse } from "next/server";
import { supabase } from "../../Supabase";
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await supabase.test({ id: params.id, request: request });
  return NextResponse.json({ message: "Hello, world!" });
}
