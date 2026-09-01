import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, findUserByEmail } from "@/lib/auth-users";
import { sendPasswordResetEmail } from "@/lib/email-service";

function getSiteUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    if (user) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${getSiteUrl(request)}/admin/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to request password reset" }, { status: 500 });
  }
}
