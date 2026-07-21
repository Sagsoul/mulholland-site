import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSessionResponse,
  createAdminSessionResponse,
} from "@/lib/admin-auth-route";
import {
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Admin credentials are not configured on the server" }, { status: 503 });
    }

    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return createAdminSessionResponse();
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to sign in" }, { status: 500 });
  }
}

export async function DELETE() {
  return clearAdminSessionResponse();
}
