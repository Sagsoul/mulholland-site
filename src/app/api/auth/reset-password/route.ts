import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithToken, validatePasswordStrength } from "@/lib/auth-users";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = (await request.json()) as {
      token?: string;
      password?: string;
    };

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (!validatePasswordStrength(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const reset = await resetPasswordWithToken(token, password);

    if (!reset) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to reset password" }, { status: 500 });
  }
}
