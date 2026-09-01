import { NextRequest, NextResponse } from "next/server";
import { createEmailVerificationToken, findUserByEmail } from "@/lib/auth-users";
import { sendEmailVerificationEmail } from "@/lib/email-service";

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

    if (user && !user.email_verified) {
      const token = await createEmailVerificationToken(user.id);
      const verificationUrl = `${getSiteUrl(request)}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
      await sendEmailVerificationEmail(user.email, verificationUrl);
    }

    return NextResponse.json({ success: true, message: "If an account exists, a verification email has been sent." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to resend verification email" }, { status: 500 });
  }
}
