import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/admin-auth-route";
import { getSales } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    if (!requireAdminApiSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    return NextResponse.json(getSales({ channel, from, to, limit }));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
