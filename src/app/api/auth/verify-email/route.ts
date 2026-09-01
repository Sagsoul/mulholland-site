import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth-users";

async function verifyToken(rawToken?: string | null) {
  const token = rawToken?.trim();
  if (!token) return false;
  return verifyEmailToken(token);
}

export async function GET(request: NextRequest) {
  const verified = await verifyToken(request.nextUrl.searchParams.get("token"));
  const redirectUrl = new URL(`/admin/login?verified=${verified ? "1" : "0"}`, request.url);
  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as { token?: string };
    const verified = await verifyToken(token);

    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to verify email" }, { status: 500 });
  }
}
