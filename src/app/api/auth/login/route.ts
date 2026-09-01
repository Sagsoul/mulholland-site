import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionResponse } from "@/lib/admin-auth-route";
import { validateAdminCredentials } from "@/lib/admin-auth";
import { isEmailVerificationRequired } from "@/lib/auth-users";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await validateAdminCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (isEmailVerificationRequired() && !user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email before signing in", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    return createAdminSessionResponse(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to sign in" }, { status: 500 });
  }
}
